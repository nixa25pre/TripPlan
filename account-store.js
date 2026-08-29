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

  window.TripAccountStore = { create, authenticate, list };
}());
