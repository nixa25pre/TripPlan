
(() => {
"use strict";

const API_URL = window.EXPENSE_API_URL || "";

const money = value =>
  "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const byId = id => document.getElementById(id);

const userColors = [
  { bg: "#102d4b", border: "#38bdf8", accent: "#7dd3fc" },
  { bg: "#302047", border: "#c084fc", accent: "#d8b4fe" },
  { bg: "#153b31", border: "#34d399", accent: "#6ee7b7" },
  { bg: "#472d20", border: "#fb923c", accent: "#fdba74" },
  { bg: "#48242e", border: "#fb7185", accent: "#fda4af" },
  { bg: "#3b3b1d", border: "#d4d94b", accent: "#e5e7a1" },
  { bg: "#1e3152", border: "#818cf8", accent: "#a5b4fc" },
  { bg: "#174047", border: "#2dd4bf", accent: "#99f6e4" }
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));
}

function showError(message) {
  const el = byId("pageAlert");
  el.textContent = message;
  el.style.display = "block";
}

function getSession() {
  const store = window.TripAccountStore;

  const session =
    store && typeof store.readSession === "function"
      ? store.readSession()
      : null;

  if (!session || !session.token) {
    window.location.replace("/admin-login.html");
    return null;
  }

  if (typeof store.touchSession === "function") {
    store.touchSession();
  }

  return session;
}

async function fetchExpenses(token) {
  if (!API_URL) {
    throw new Error("Expense API URL is not configured.");
  }

  const url = new URL(API_URL);

  url.searchParams.set("action", "list");
  url.searchParams.set("token", token);

  const response = await fetch(url.toString(), {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not connect to the expense service.");
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || "Could not load expenses.");
  }

  return Array.isArray(data.expenses)
    ? data.expenses
    : [];
}

// Existing backend stores the submitter's display name
// in the "Updated By" column.
function expenseOwner(item) {
  return String(item.updatedBy || "").trim() || "Unknown user";
}

function render(expenses) {
  const grandTotal = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const owners = new Map();

  expenses.forEach(item => {
    const owner = expenseOwner(item);

    if (!owners.has(owner)) {
      owners.set(owner, []);
    }

    owners.get(owner).push(item);
  });

  const sortedOwners = [...owners.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]));

  byId("userName").textContent =
    String(sortedOwners.length);

  byId("userSubtitle").textContent =
    "All users' expenses, grouped by user and date.";

  byId("entryCount").textContent =
    String(expenses.length);

  byId("userTotal").textContent =
    money(grandTotal);

  byId("grandTotal").textContent =
    money(grandTotal);

  if (!expenses.length) {
    byId("dateGroups").innerHTML =
      '<div class="panel empty">No expense records were found.</div>';
    return;
  }

  byId("dateGroups").innerHTML =
    sortedOwners.map(([owner, items], index) => {

      const color = userColors[index % userColors.length];

      const userTotal = items.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      const dates = new Map();

      items.forEach(item => {
        const date = String(item.date || "Unknown date");

        if (!dates.has(date)) {
          dates.set(date, []);
        }

        dates.get(date).push(item);
      });

      const dateSections = [...dates.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, dayItems]) => {

          const dayTotal = dayItems.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          );

          const rows = dayItems.map(item => `
            <tr>
              <td>${escapeHtml(item.type || "Other")}</td>
              <td>${escapeHtml(item.comments || "")}</td>
              <td class="amount">${money(item.amount)}</td>
            </tr>
          `).join("");

          return `
            <div style="margin-top:16px">

              <div class="date-head">
                <h2>
                  <i class="bi bi-calendar3"></i>
                  ${escapeHtml(date)}
                </h2>

                <span class="day-total">
                  ${money(dayTotal)}
                </span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Expense type</th>
                    <th>Comments</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>${rows}</tbody>
              </table>

            </div>
          `;
        }).join("");

      return `
        <section class="panel"
          style="
            background:${color.bg};
            border:1px solid ${color.border};
            border-left:6px solid ${color.border};
          ">

          <div class="date-head">

            <div>
              <div style="
                color:${color.accent};
                font-size:.78rem;
                text-transform:uppercase;
                letter-spacing:.1em;
                font-weight:700;
              ">
                User ${index + 1}
              </div>

              <h2 style="font-size:1.25rem;margin-top:4px">
                ${escapeHtml(owner)}
              </h2>

              <div style="color:var(--muted);font-size:.85rem">
                ${items.length}
                expense ${items.length === 1 ? "entry" : "entries"}
              </div>
            </div>

            <div style="text-align:right">
              <div class="label">User total</div>

              <div class="day-total" style="font-size:1.35rem">
                ${money(userTotal)}
              </div>
            </div>

          </div>

          ${dateSections}

        </section>
      `;
    }).join("");
}

async function refresh() {
  const session = getSession();

  if (!session) {
    return;
  }

  const button = byId("refreshButton");

  button.disabled = true;

  byId("dateGroups").innerHTML =
    '<div class="panel empty">Loading all users’ expenses...</div>';

  byId("pageAlert").style.display = "none";

  try {
    // Intentionally show all users, not just the logged-in user.
    const allExpenses = await fetchExpenses(session.token);

    render(allExpenses);

  } catch (error) {
    byId("dateGroups").innerHTML = "";

    showError(error.message || "Unable to load expenses.");

  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {

  byId("refreshButton").addEventListener("click", refresh);

  byId("logoutButton").addEventListener("click", () => {
    window.TripAccountStore?.clearSession?.();
    window.location.replace("/admin-login.html");
  });

  refresh();
});

})();
