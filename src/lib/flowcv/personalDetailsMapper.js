import { getFlowCvPersonalDetailsTemplate } from "./session.js";

function clonePlain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function emptyPersonalDetailsShape() {
  return {
    phone: "",
    photo: {},
    social: {
      linkedIn: {
        link: "",
        display: "",
      },
    },
    address: "",
    fullName: "",
    jobTitle: "",
    usAddress: false,
    detailsOrder: ["displayEmail", "phone", "address", "linkedIn"],
    displayEmail: "",
    showPlaceholder: false,
  };
}

function stripBoldMarkers(text) {
  return String(text || "")
    .replace(/\*\*/g, "")
    .trim();
}

/**
 * @param {Record<string, unknown>} tailoredResumeJson
 */
export function tailoredResumeJsonToFlowCvPersonalDetails(tailoredResumeJson) {
  const json =
    tailoredResumeJson && typeof tailoredResumeJson === "object"
      ? tailoredResumeJson
      : {};
  const title = /** @type {string} */ (json.title || "");
  console.log("????",json);
  const base = getFlowCvPersonalDetailsTemplate() || emptyPersonalDetailsShape();
  const out = clonePlain(base);
  const fullName = String(json.name || "").trim();
  const email = String(json.email || "").trim();
  const phone = String(json.phone || "").trim();
  const location = String(json.location || "").trim();
  const linkedin = String(json.linkedin || "").trim();
  const whatsapp = String(json.whatsapp || "").trim();
  const gender = String(json.gender || "").trim();
  const pronouns = String(json.pronouns || json.pronoun || "").trim();

  if (fullName) out.fullName = fullName;
  if (email) out.displayEmail = email;
  if (phone) out.phone = phone;
  if (location) out.address = location;

  out.jobTitle = stripBoldMarkers(title);

  if (!out.social) out.social = {};
  if (!out.social.linkedIn) {
    out.social.linkedIn = { link: "", display: "" };
  } else {
    out.social.linkedIn = { ...out.social.linkedIn };
  }
  if (linkedin) out.social.linkedIn.link = linkedin;

  if (out.gender) out.gender = "Female";
  if (pronouns) out.pronouns = pronouns;

  if (whatsapp) {
    const existingKey = Object.keys(out.social).find(
      (key) => key.toLowerCase() === "whatsapp",
    );
    const whatsappKey = existingKey || "whatsapp";
    const current = out.social[whatsappKey];
    out.social[whatsappKey] = {
      ...(current && typeof current === "object" ? current : {}),
      link: whatsapp,
    };
  }

  if (!Array.isArray(out.detailsOrder)) {
    out.detailsOrder = ["displayEmail", "phone", "address", "linkedIn"];
  } else {
    out.detailsOrder = [...out.detailsOrder];
  }
  if (whatsapp && !out.detailsOrder.some((item) => String(item).toLowerCase() === "whatsapp")) {
    out.detailsOrder.push("whatsapp");
  }
  console.log(">>>>", out);
  return out;
}
