import {
  getTemplateForProfile,
  getProfileBySlug,
} from "@/lib/profile/profile-template-mapping";
import {
  buildTemplateDataFromPastedJson,
  normalizeAiResumeContent,
  parseResumeJsonFromText,
  resumeContentHasRequiredFields,
} from "@/lib/resume/normalize-ai-resume-content";

/**
 * Parse pasted JSON response and build templateData for manual mode.
 * Uses only the pasted ChatGPT JSON — no merge with resumes/*.json profile data.
 * Profile slug is used only for PDF template selection and download filename.
 *
 * @param {object} opts
 * @param {string} opts.profileSlug
 * @param {string} opts.rawResponse
 * @returns {{ resumeContent: object, templateData: object, resumeName: string, templateName: string }}
 */
export function manualResponseToTemplateData({ profileSlug, rawResponse }) {
  if (!profileSlug) throw new Error("Profile slug required");
  if (!rawResponse || typeof rawResponse !== "string") {
    throw new Error("ChatGPT response (JSON) required");
  }

  const profileConfig = getProfileBySlug(profileSlug);
  if (!profileConfig) {
    throw new Error(`Profile "${profileSlug}" not found`);
  }

  const resumeName = profileConfig.resume;
  const templateName = getTemplateForProfile(profileSlug) || "Resume";

  let content = rawResponse.trim();
  content = content.replace(/```json\s*/gi, "");
  content = content.replace(/```javascript\s*/gi, "");
  content = content.replace(/```\s*/g, "");
  content = content.replace(/^(here is|here's|this is|the json is):?\s*/gi, "");

  let resumeContent;
  try {
    resumeContent = parseResumeJsonFromText(content);
  } catch (parseError) {
    throw new Error(
      `${parseError.message}. Check the pasted response.`,
    );
  }

  if (!resumeContentHasRequiredFields(resumeContent, null)) {
    throw new Error(
      "Missing required fields (title, summary, skills, or experience). Ensure the pasted JSON includes all of them.",
    );
  }

  const normalized = normalizeAiResumeContent(resumeContent);
  const templateData = buildTemplateDataFromPastedJson(resumeContent, normalized);

  if (!templateData.experience.length) {
    throw new Error(
      "No work experience to display. Add an experience array in your pasted JSON.",
    );
  }

  return {
    resumeContent: normalized,
    templateData,
    resumeName,
    templateName,
  };
}
