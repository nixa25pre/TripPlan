/*
 * Browser account store
 *
 * Each account is kept under `goaTripAccounts` in localStorage. Passwords are
 * never stored as text: Web Crypto creates a SHA-256 digest before the record
 * is written. This is appropriate for this static site; a production site
 * should move authentication to a server with salted password hashes.
 */
(function () {
  const ACCOUNT_KEY = "goaTripAccounts";

  const normalizeUsername = value => String(value || "").trim().toLowerCase();
  const read = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "[]");
      return Array.isArray(accounts) ? accounts : [];
    } catch { return []; }
  };
  const write = accounts => localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));

  async function digest(value) {
    if (!window.crypto?.subtle) throw new Error("Secure browser storage is unavailable. Please use a current browser.");
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  async function create({ name, username, password }) {
    const cleanName = String(name || "").trim();
    const cleanUsername = normalizeUsername(username);
    if (!cleanName || !cleanUsername || !password) throw new Error("Name, username and password are required.");
    if (read().some(account => account.username === cleanUsername)) throw new Error("That username is already in use on this device.");
    const account = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: cleanName,
      username: cleanUsername,
      passwordHash: await digest(password),
      role: "member",
      createdAt: new Date().toISOString()
    };
    write([...read(), account]);
    return { ...account, passwordHash: undefined };
  }

  async function authenticate({ username, password }) {
    const account = read().find(item => item.username === normalizeUsername(username));
    if (!account || account.passwordHash !== await digest(password)) throw new Error("Incorrect username or password.");
    return { id: account.id, name: account.name, username: account.username, role: account.role };
  }

  function list() {
    return read().map(({ passwordHash, ...account }) => account);
  }

  // Session helpers are additive so the existing account store/authentication
  // structure remains unchanged.
  const ANDROID_SESSION_KEY = "goaTripAndroidSession";
  const SESSION_ACTIVITY_KEY = "goaTripLastActivity";
  const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

  function isAndroidApp() {
    return Boolean(window.Capacitor?.isNativePlatform?.()) ||
      /Android/i.test(navigator.userAgent || "") && (
        /Capacitor/i.test(navigator.userAgent || "") ||
        window.location.protocol === "file:"
      );
  }

  function saveSession(data, source) {
    const role = String(data.role || "member").toLowerCase() === "admin" ? "admin" : "member";
    const session = {
      token: data.token || data.id,
      user: data.name || data.username,
      role,
      source: source || "sheet",
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    if (isAndroidApp()) {
      localStorage.setItem(ANDROID_SESSION_KEY, JSON.stringify(session));
      sessionStorage.removeItem("tripAdminToken");
      sessionStorage.removeItem("tripAdminUser");
      sessionStorage.removeItem("tripUserRole");
      sessionStorage.removeItem("tripAccountSource");
      sessionStorage.removeItem("tripLoginMessage");
    } else {
      sessionStorage.setItem("tripAdminToken", session.token);
      sessionStorage.setItem("tripAdminUser", session.user);
      sessionStorage.setItem("tripUserRole", session.role);
      sessionStorage.setItem("tripAccountSource", session.source);
      sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(session.lastActivity));
    }
    return session;
  }

  function readSession() {
    if (isAndroidApp()) {
      try {
        const session = JSON.parse(localStorage.getItem(ANDROID_SESSION_KEY) || "null");
        return session && session.token ? session : null;
      } catch { return null; }
    }
    const token = sessionStorage.getItem("tripAdminToken");
    if (!token) return null;
    const lastActivity = Number(sessionStorage.getItem(SESSION_ACTIVITY_KEY) || 0);
    if (!lastActivity || Date.now() - lastActivity >= SESSION_TIMEOUT_MS) {
      clearSession();
      return null;
    }
    return {
      token,
      user: sessionStorage.getItem("tripAdminUser") || "Member",
      role: sessionStorage.getItem("tripUserRole") || "member",
      source: sessionStorage.getItem("tripAccountSource") || "sheet",
      lastActivity
    };
  }

  function touchSession() {
    if (isAndroidApp()) return;
    if (sessionStorage.getItem("tripAdminToken")) {
      sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
    }
  }

  function clearSession() {
    sessionStorage.removeItem("tripAdminToken");
    sessionStorage.removeItem("tripAdminUser");
    sessionStorage.removeItem("tripUserRole");
    sessionStorage.removeItem("tripAccountSource");
    sessionStorage.removeItem("tripLoginMessage");
    sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
    localStorage.removeItem(ANDROID_SESSION_KEY);
  }

  window.TripAccountStore = {
    create, authenticate, list,
    isAndroidApp, saveSession, readSession, touchSession, clearSession,
    SESSION_TIMEOUT_MS
  };
}());
