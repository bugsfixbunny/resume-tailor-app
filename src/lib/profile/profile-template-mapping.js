// Profile to Template mapping
// Maps profile ID (filename without .json) to display name and PDF template
export const profileTemplateMapping = {
  sugar: {
    resume: "Sugar Ray",
    template: "Resume-Executive-Navy",
  },
  maurice: {
    resume: "Maurice Williams",
    template: "Resume-Executive-Navy",
  },
  raymond: {
    resume: "Raymond Luces",
    template: "Resume-Executive-Navy",
  },
  alfredo: {
    resume: "Alfredo",
    template: "Resume-Executive-Navy"
  },
  maurice_devops: {
    resume: "Maurice_Williams_Devops",
    template: "Resume-Executive-Navy",
  },
  maurice_security: {
    resume: "Maurice_Williams_Security",
    template: "Resume-Executive-Navy",
  },
  sugar: {
    resume: "Sugar Ray",
    template: "Resume-Executive-Navy",
  },
  ricardo: {
    resume: "Ricardo",
    template: "Resume-Executive-Navy",
  },
  petko: {
    resume: "Petko Stoyanov",
    template: "Resume-Executive-Navy",
  },
  petko_sre: {
    resume: "Petko_Stoyanov_SRE",
    template: "Resume-Executive-Navy",
  },
  eduardo: {
    resume: "Eduardo Acosta",
    template: "Resume-Executive-Navy",
  },
  melani: {
    resume: "Melani Carrasco Fernandez",
    template: "Resume-Executive-Navy",
  },
   mariana: {
    resume: "Mariana Soto Gomez",
    template: "Resume-Executive-Navy",
  }
};

/**
 * Get profile configuration by slug (numeric ID)
 * @param {string} slug - The numeric ID slug (e.g., "1", "2", "3")
 * @returns {object|null} - Profile configuration or null if not found
 */
export const getProfileBySlug = (slug) => {
  if (!slug) return null;
  return profileTemplateMapping[slug] || null;
};

/**
 * Get resume name (profile name) by slug
 * @param {string} slug - The numeric ID slug (e.g., "1", "2", "3")
 * @returns {string|null} - Resume name or null if not found
 */
export const slugToProfileName = (slug) => {
  const config = getProfileBySlug(slug);
  return config?.resume || null;
};

/**
 * Get template for a profile by slug
 * @param {string} slug - The numeric ID slug (e.g., "1", "2", "3")
 * @returns {string} - Template ID or "Resume" as default
 */
export const getTemplateForProfile = (slug) => {
  const config = getProfileBySlug(slug);
  return config?.template || "Resume";
};

/**
 * Get all available slug values (numeric IDs from mapping)
 * @returns {string[]} - Array of available slugs (numeric IDs)
 */
export const getAvailableSlugs = () => {
  return Object.keys(profileTemplateMapping);
};

/**
 * Get profile configuration by profile ID (numeric key)
 * @param {string} profileId - The numeric profile ID
 * @returns {object|null} - Profile configuration or null if not found
 */
export const getProfileById = (profileId) => {
  return profileTemplateMapping[profileId] || null;
};

export default profileTemplateMapping;
