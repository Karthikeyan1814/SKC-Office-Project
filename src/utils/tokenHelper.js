import toast from "react-hot-toast";

/**
 * 60-Day Token Expiration & Auto-Logout Helper
 */

export function parseJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    return true; // No expiration or invalid token -> treated as expired
  }
  // exp is in seconds; Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

export function getTokenRemainingDays(token) {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return 0;
  const msRemaining = payload.exp * 1000 - Date.now();
  if (msRemaining <= 0) return 0;
  return Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)));
}

export function clearUserSession(showToast = true, message = "Session expired (60-day limit). Please sign in again.") {
  const keysToRemove = [
    "skc-token",
    "skc-role",
    "skc-user",
    "skc-mobile",
    "skc-name",
    "skc-token-saved-at",
    "skc-session-started",
    "skc_billing_client",
  ];

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });

  if (showToast && message) {
    toast.error(message, { id: "session-expired", duration: 5000 });
  }

  // Dispatch global custom event for any listeners
  try {
    window.dispatchEvent(new Event("skc-auth-logout"));
  } catch {}
}

export function enforceTokenExpiryCheck() {
  const token = localStorage.getItem("skc-token");
  if (!token) return false;

  if (isTokenExpired(token)) {
    console.warn("[Auth] 60-day token has expired. Triggering auto-logout.");
    clearUserSession(true, "Your 60-day session has expired. You have been automatically logged out.");
    const publicPaths = ["/SignIn", "/signin", "/", "/actDetails", "/actdetails", "/Unauthorized"];
    const isPublic = publicPaths.some((p) => window.location.pathname.toLowerCase() === p.toLowerCase());
    if (!isPublic) {
      window.location.href = "/SignIn";
    }
    return true;
  }
  return false;
}
