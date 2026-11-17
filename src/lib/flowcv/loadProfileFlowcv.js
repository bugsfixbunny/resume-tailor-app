import fs from "fs";
import path from "path";
import { resolveFlowcvCredentialsFromProfile } from "@/lib/flowcv/flowcvCredentials";
import { getProfileBySlug } from "@/lib/profile/profile-template-mapping";
import { RESUMES_DIR } from "@/lib/server-paths";

/**
 * @param {string} profileSlug
 * @param {{ email?: string, password?: string } | null} [bodyOverride]
 * @returns {{ profileData: object, resumeName: string, email: string, password: string }}
 */
export function loadProfileWithFlowcvCredentials(profileSlug, bodyOverride) {
  const slug = String(profileSlug || "").trim();
  if (!slug) {
    throw new Error("profile slug is required");
  }
  const config = getProfileBySlug(slug);
  if (!config) {
    throw new Error(`Unknown profile: ${slug}`);
  }
  const resumeName = config.resume;
  const profilePath = path.join(RESUMES_DIR, `${resumeName}.json`);
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Profile file not found: ${resumeName}.json`);
  }
  const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
  const { email, password } = resolveFlowcvCredentialsFromProfile(
    profileData,
    bodyOverride,
  );
  if (!email || !password) {
    const err = new Error(
      'FlowCV credentials are required. Add "username" and "password" to this profile\'s JSON (resumes folder), or a "flowcv" object with email and password, or pass them in the request body.',
    );
    err.code = "FLOWCV_CREDENTIALS_MISSING";
    throw err;
  }
  return { profileData, resumeName, email, password };
}
