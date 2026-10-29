/** Staging gates; no server Auth verification setting is weakened. */
export const emailFeaturesEnabled = import.meta.env.VITE_EMAIL_FEATURES_ENABLED === "true";
export const signupEnabled = emailFeaturesEnabled && import.meta.env.VITE_SIGNUP_ENABLED === "true";
export const pushEnabled = import.meta.env.VITE_PUSH_ENABLED === "true";
export const mcpEnabled = import.meta.env.VITE_MCP_ENABLED === "true";
