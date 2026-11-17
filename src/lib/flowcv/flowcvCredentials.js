/**
 * Resolve FlowCV login credentials from a profile JSON file (resumes/*.json).
 * Supports top-level `username` + `password`, nested `flowcv` / `flowCV`, and request overrides.
 */

function pickString(...values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * @param {object|null|undefined} profileData
 * @param {{ email?: string, password?: string } | null} [bodyOverride]
 * @returns {{ email: string, password: string }}
 */
export function resolveFlowcvCredentialsFromProfile(profileData, bodyOverride) {
  const root =
    profileData && typeof profileData === "object" ? profileData : {};
  const fc = root.flowcv || root.flowCV;

  const email = pickString(
    bodyOverride?.email,
    fc?.email,
    fc?.username,
    root.username,
  );

  const password =
    (bodyOverride?.password != null && String(bodyOverride.password)) ||
    (fc?.password != null && String(fc.password)) ||
    (root.password != null && String(root.password)) ||
    "";

  return { email, password };
}

/**
 * @param {object|null|undefined} profileData
 */
export function profileHasFlowcvCredentials(profileData) {
  const { email, password } = resolveFlowcvCredentialsFromProfile(
    profileData,
    null,
  );
  return Boolean(email && password);
}

/**
 * Strip secrets before sending profile JSON to the browser.
 * @param {object} profileData
 */
export function sanitizeProfileJsonForClient(profileData) {
  if (!profileData || typeof profileData !== "object") return profileData;

  const { email } = resolveFlowcvCredentialsFromProfile(profileData, null);
  const configured = profileHasFlowcvCredentials(profileData);

  const safe = { ...profileData };
  delete safe.password;
  delete safe.username;
  if (safe.flowCV) delete safe.flowCV;

  safe.flowcv = {
    email,
    configured,
  };

  return safe;
}
