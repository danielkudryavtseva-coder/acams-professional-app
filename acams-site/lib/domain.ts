export const SIGNUP_BLOCKED_MESSAGE =
  "Account creation is restricted to active University of Alabama students with a @crimson.ua.edu email. If you are an alumnus or having trouble, please request an invite from an executive.";

export function getAllowedSignupDomain(): string {
  return (process.env.ALLOWED_SIGNUP_DOMAIN ?? "crimson.ua.edu").trim().toLowerCase();
}

export function isEmailAllowedForSignup(email: string): boolean {
  const domain = getAllowedSignupDomain();
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const d = email.slice(at + 1).trim().toLowerCase();
  return d === domain;
}
