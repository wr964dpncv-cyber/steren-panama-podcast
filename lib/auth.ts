export const ADMIN_COOKIE = "admin_session";

export function getAdminToken() {
  return process.env.ADMIN_SESSION_TOKEN || "";
}

export function isAuthorized(cookieValue: string | undefined): boolean {
  const expected = getAdminToken();
  if (!expected || !cookieValue) return false;
  if (cookieValue.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ cookieValue.charCodeAt(i);
  }
  return diff === 0;
}
