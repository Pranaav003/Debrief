const TOKEN_KEY = "debrief_owner_token";

export function getOwnerToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `owner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

