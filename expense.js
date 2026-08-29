const EXPENSE_API_URL = window.EXPENSE_API_URL || "";
const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
function getLocalExpenses() {
  try { const records = JSON.parse(localStorage.getItem("goaTripLocalExpenses") || "[]"); return Array.isArray(records) ? records : []; } catch { return []; }
}

function showAlert(message, type = "success") {
  const el = document.getElementById("expenseAlert");
  if (!el) return;
  el.className = "alert " + type;
  el.textContent = message;
}

async function apiRequest(action, payload = {}) {
  if (!EXPENSE_API_URL) throw new Error("Expense API URL is not configured.");
  const url = new URL(EXPENSE_API_URL);
  url.searchParams.set("action", action);
  Object.entries(payload).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not reach the expense service. Please try again.");
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data;
}

function groupExpenses(expenses) {
  const groups = {};
  expenses.forEach(item => { const date = item.date || "Unknown date"; (groups[date] ||= []).push(item); });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function setSavingsSummary(expenses, totalSavings = null) {
  const totalSpent = expenses.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  document.getElementById("overallTotal").textContent = money(totalSpent);
  document.getElementById("expenseCount").textContent = expenses.length;
  const savings = Number(totalSavings);
  const hasSavings = totalSavings !== null && totalSavings !== undefined && Number.isFinite(savings);
  document.getElementById("totalSavings").textContent = hasSavings ? money(savings) : "—";
  const balance = document.getElementById("balanceAmount");
  balance.textContent = hasSavings ? money(savings - totalSpent) : "—";
  balance.closest(".expense-card")?.classList.toggle("negative", hasSavings && savings - totalSpent < 0);
  const latest = groupExpenses(expenses)[0];
  const latestTotal = latest ? latest[1].reduce((sum, x) => sum + Number(x.amount || 0), 0) : 0;
  document.getElementById("latestDayTotal").textContent = money(latestTotal);
}

function categoryIcon(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("food")) return "bi-cup-hot";
  if (value.includes("hotel") || value.includes("accommodation")) return "bi-buildings";
  if (value.includes("petrol")) return "bi-fuel-pump";
  if (value.includes("train")) return "bi-train-front";
  if (value.includes("travel") || value.includes("transport")) return "bi-car-front";
  return "bi-three-dots";
}

function renderCategoryBreakdown(expenses) {
  const container = document.getElementById("categoryBreakdown");
  const total = expenses.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  if (!total) { container.innerHTML = '<p class="section-subtitle">Expense categories will appear here once records are added.</p>'; return; }
  const categories = Object.entries(expenses.reduce((result, item) => {
    const name = item.type || "Other";
    result[name] = (result[name] || 0) + Number(item.amount || 0);
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);
  container.innerHTML = categories.map(([name, amount]) => {
    const percent = Math.round((amount / total) * 100);
    return `<div class="breakdown-item"><div class="breakdown-icon"><i class="bi ${categoryIcon(name)}"></i></div><div><div class="breakdown-label">${escapeHtml(name)}</div><div class="breakdown-bar"><span style="width:${percent}%"></span></div></div><div class="breakdown-amount">${money(amount)}<br><small>${percent}%</small></div></div>`;
  }).join("");
}

function renderExpenses(expenses, totalSavings = null) {
  const container = document.getElementById("expenseGroups");
  container.setAttribute("aria-busy", "false");
  if (!expenses.length) {
    container.innerHTML = '<div class="expense-card empty-expenses"><i class="bi bi-receipt-cutoff"></i><p>No expenses have been recorded yet.</p></div>';
    setSavingsSummary([], totalSavings);
    renderCategoryBreakdown([]);
    return;
  }
  container.innerHTML = groupExpenses(expenses).map(([date, items]) => {
    const daily = items.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const rows = items.map(x => `<tr><td><span class="expense-badge"><i class="bi ${categoryIcon(x.type)}"></i>${escapeHtml(x.type)}</span></td><td class="expense-amount">${money(x.amount)}</td><td>${escapeHtml(x.updatedBy || "—")}</td><td>${escapeHtml(x.updatedAt || "—")}</td></tr>`).join("");
    return `<section class="expense-day"><div class="expense-day-head"><div><strong><i class="bi bi-calendar3"></i> ${escapeHtml(date)}</strong><span class="date-count">${items.length} ${items.length === 1 ? "entry" : "entries"}</span></div><span class="daily-total">${money(daily)}</span></div><div class="expense-table-wrap"><table class="expense-table"><thead><tr><th>Expense type</th><th>Amount</th><th>Added by</th><th>Updated</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }).join("");
  setSavingsSummary(expenses, totalSavings);
  renderCategoryBreakdown(expenses);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

document.addEventListener("DOMContentLoaded", () => {
  const refresh = document.getElementById("refreshExpenses");
  const search = document.getElementById("expenseSearch");
  let allExpenses = [], totalSavings = null;
  async function refreshData(showSuccess = false) {
    const container = document.getElementById("expenseGroups");
    container.setAttribute("aria-busy", "true");
    container.innerHTML = '<div class="expense-card empty-expenses">Loading expenses…</div>';
    refresh.disabled = true;
    try {
      const data = await apiRequest("list");
      allExpenses = [...(Array.isArray(data.expenses) ? data.expenses : []), ...getLocalExpenses()];
      totalSavings = data.totalSavings ?? data.savings ?? null;
      renderExpenses(allExpenses, totalSavings);
      if (showSuccess) showAlert("Expense records refreshed.");
    } catch (error) {
      container.setAttribute("aria-busy", "false");
      container.innerHTML = `<div class="expense-card empty-expenses"><i class="bi bi-exclamation-triangle"></i><p>${escapeHtml(error.message)}</p></div>`;
      showAlert(error.message, "error");
    } finally { refresh.disabled = false; }
  }
  refresh.addEventListener("click", () => refreshData(true));
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    renderExpenses(allExpenses.filter(item => [item.date, item.type, item.updatedBy].join(" ").toLowerCase().includes(query)), totalSavings);
  });
  refreshData();
});
