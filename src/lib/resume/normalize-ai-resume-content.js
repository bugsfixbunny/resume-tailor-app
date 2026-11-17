/**
 * Normalize AI / manual-paste resume JSON into the flat shape used by PDF/DOCX templates.
 * Supports both legacy flat format and nested "title block" + role/description/dates format.
 */

export function normalizeExperienceTitle(rawTitle) {
  let s = String(rawTitle ?? "").trim();
  if (!s) return "Engineer";

  if (s.includes("—")) {
    s = s.split("—").pop().trim();
  }

  s = s.split("|")[0].trim();

  const slashParts = s.split("/");
  if (slashParts.length > 1) {
    const rhs = slashParts.slice(1).join("/").trim();
    if (/(^remote$)|,|\b\d{1,2}\/\d{4}\b|\b\d{4}\b/i.test(rhs)) {
      s = slashParts[0].trim();
    }
  }

  s = s.replace(/\b\d{1,2}\/\d{4}\b.*$/i, "").trim();
  s = s.replace(/\s{2,}/g, " ").trim();
  return s || "Engineer";
}

export function extractResumeHeadlineTitle(titleField) {
  if (typeof titleField === "string") return titleField.trim();
  if (titleField && typeof titleField === "object" && !Array.isArray(titleField)) {
    const nested = titleField.title;
    if (typeof nested === "string") return nested.trim();
  }
  return "";
}

const EXPERIENCE_ARRAY_KEYS = [
  "experience",
  "workExperience",
  "work_experience",
  "professionalExperience",
  "employment",
];

function experienceEntriesFromValue(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") {
    return Object.values(val).filter((x) => x && typeof x === "object");
  }
  return [];
}

export function resolveExperienceFromResumeContent(resumeContent) {
  if (!resumeContent || typeof resumeContent !== "object") return [];

  for (const key of EXPERIENCE_ARRAY_KEYS) {
    const entries = experienceEntriesFromValue(resumeContent[key]);
    if (entries.length > 0) return entries;
  }

  for (const [key, val] of Object.entries(resumeContent)) {
    if (!/experience|employment|workhistory|work_history/i.test(key)) continue;
    const entries = experienceEntriesFromValue(val);
    if (entries.length > 0) return entries;
  }

  return [];
}

function tryParseJson(text) {
  return JSON.parse(text);
}

function repairJsonText(text) {
  let s = String(text || "");
  s = s.replace(/,(\s*[}\]])/g, "$1");
  s = s.replace(/""\s*([,\]])/g, '"$1');
  s = s.replace(/\}\}\s*,/g, "},");
  s = s.replace(/\}\}\s*\}/g, "}}");
  return s;
}

/**
 * Parse pasted/AI JSON text with balanced-brace extract and full-span fallback.
 */
export function parseResumeJsonFromText(text) {
  const trimmed = String(text || "").trim();
  const candidates = [];

  const balanced = extractJsonObjectFromText(trimmed);
  if (balanced) candidates.push(balanced);

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const span = trimmed.substring(first, last + 1);
    if (!candidates.includes(span)) candidates.push(span);
  }

  let lastError = null;
  for (const candidate of candidates) {
    for (const content of [candidate, repairJsonText(candidate)]) {
      try {
        const parsed = tryParseJson(content);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(
    lastError?.message
      ? `Invalid JSON: ${lastError.message}`
      : "No JSON object found",
  );
}

export function resumeContentHasRequiredFields(
  resumeContent,
  profileData = null,
) {
  if (!resumeContent || typeof resumeContent !== "object") return false;
  const hasHeadline = Boolean(extractResumeHeadlineTitle(resumeContent.title));
  const aiExperience = resolveExperienceFromResumeContent(resumeContent);
  const profileExperience = profileData?.experience;
  const hasExperience =
    aiExperience.length > 0 ||
    (Array.isArray(profileExperience) && profileExperience.length > 0);

  return Boolean(
    hasHeadline &&
      resumeContent.summary &&
      resumeContent.skills &&
      hasExperience,
  );
}

/**
 * Extract the first complete top-level JSON object (balanced braces).
 * Safer than firstBrace/lastBrace when trailing text or extra braces exist.
 */
export function extractJsonObjectFromText(text) {
  const start = String(text || "").indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) return text.substring(start, i + 1);
    }
  }
  return null;
}

function parseExperienceDates(exp) {
  const start = String(exp?.start_date ?? "").trim();
  const end = String(exp?.end_date ?? "").trim();
  if (start || end) {
    return { start_date: start, end_date: end };
  }

  const datesRaw = String(exp?.dates ?? "").trim();
  if (!datesRaw) {
    return { start_date: "", end_date: "" };
  }

  const splitMatch = datesRaw.match(
    /^(.+?)\s*(?:–|—|-|to)\s*(.+)$/i,
  );
  if (splitMatch) {
    return {
      start_date: splitMatch[1].trim(),
      end_date: splitMatch[2].trim(),
    };
  }

  return { start_date: datesRaw, end_date: "" };
}

function experienceBullets(exp) {
  const sources = [exp?.details, exp?.description, exp?.bullets];
  for (const source of sources) {
    if (Array.isArray(source)) {
      return source.map((d) => String(d).trim()).filter(Boolean);
    }
  }
  return [];
}

export function normalizeExperienceEntries(experience) {
  const list = Array.isArray(experience) ? experience : [];
  return list.map((exp) => {
    const roleTitle = exp?.role ?? exp?.title ?? exp?.jobTitle ?? "";
    const { start_date, end_date } = parseExperienceDates(exp);

    return {
      title: normalizeExperienceTitle(roleTitle),
      company: String(exp?.company ?? "").trim(),
      location: String(exp?.location ?? "").trim(),
      start_date,
      end_date,
      details: experienceBullets(exp),
    };
  });
}

export function normalizeAiResumeContent(resumeContent) {
  return {
    ...resumeContent,
    title: extractResumeHeadlineTitle(resumeContent.title),
    experience: normalizeExperienceEntries(
      resolveExperienceFromResumeContent(resumeContent),
    ),
  };
}

function pickStringField(obj, ...keys) {
  if (!obj || typeof obj !== "object") return "";
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * Contact/header fields from pasted JSON only (no profile file merge).
 */
export function extractContactFieldsFromResumeContent(resumeContent) {
  const root =
    resumeContent && typeof resumeContent === "object" ? resumeContent : {};
  const contact =
    root.contact && typeof root.contact === "object" && !Array.isArray(root.contact)
      ? root.contact
      : {};

  return {
    name: pickStringField(root, "name") || pickStringField(contact, "name"),
    email: pickStringField(root, "email") || pickStringField(contact, "email"),
    phone: pickStringField(root, "phone") || pickStringField(contact, "phone"),
    location:
      pickStringField(root, "location") || pickStringField(contact, "location"),
    linkedin:
      pickStringField(root, "linkedin") || pickStringField(contact, "linkedin"),
    website:
      pickStringField(root, "website") ||
      pickStringField(contact, "website") ||
      pickStringField(root, "github") ||
      pickStringField(contact, "github"),
  };
}

export function normalizeEducationEntries(education) {
  if (!Array.isArray(education)) return [];
  return education.map((edu) => {
    if (!edu || typeof edu !== "object") {
      return { degree: "", school: "", start_year: "", end_year: "" };
    }
    return {
      degree: String(edu.degree ?? "").trim(),
      school: String(edu.school ?? edu.institution ?? "").trim(),
      start_year: String(edu.start_year ?? edu.startYear ?? "").trim(),
      end_year: String(edu.end_year ?? edu.endYear ?? "").trim(),
      ...(edu.grade != null && String(edu.grade).trim()
        ? { grade: String(edu.grade).trim() }
        : {}),
    };
  });
}

/**
 * Build PDF/DOCX `templateData` from pasted ChatGPT JSON only (manual / non-API mode).
 */
export function buildTemplateDataFromPastedJson(resumeContent, normalized) {
  const contact = extractContactFieldsFromResumeContent(resumeContent);
  const skills =
    resumeContent?.skills && typeof resumeContent.skills === "object"
      ? resumeContent.skills
      : {};

  return {
    name: contact.name,
    title: normalized?.title || "",
    email: contact.email,
    phone: contact.phone,
    location: contact.location,
    linkedin: contact.linkedin,
    website: contact.website,
    summary:
      typeof resumeContent?.summary === "string" ? resumeContent.summary : "",
    skills,
    experience: Array.isArray(normalized?.experience)
      ? normalized.experience
      : [],
    education: normalizeEducationEntries(resumeContent?.education),
  };
}
