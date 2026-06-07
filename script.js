// ====== CONFIG ======
const CSV_URL = "https://docs.google.com/spreadsheets/d/1EELxeBDFyC_Xye3tYct_YvVELuph6AbgFZ9y_vWt_ww/export?format=csv";
const GOAL_AMOUNT = 111000;
const PER_MEMBER_TARGET = 12000;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_EMOJI = ["❄️","💝","🌸","🌷","🌻","☀️","🏖️","🌊","🍂","🎃","🪔","🎄"];

const EMOJI_MAP = {
  "Arulanand":"🌴","Edward":"🏝️","Nixan":"🌊","Kithiyon":"🥥","Jacques":"🍹",
  "Joseph":"🐚","Fredrik":"⛱️","Shaja":"🌺","Santhosh":"🦀","Raj":"🐠"
};
const FALLBACK_EMOJIS = ["🌴","🏝️","🌊","🥥","🍹","🐚","⛱️","🌺","🦀","🐠","🌅","🦜"];
const emojiFor = (name, i) => EMOJI_MAP[name] || FALLBACK_EMOJIS[i % FALLBACK_EMOJIS.length];

const fmt = (n) => "₹" + Number(n||0).toLocaleString("en-IN");

fetch(CSV_URL)
  .then(r => r.text())
  .then(csv => {
    const rows = csv.split("\n");
    const members = [];
    const monthlyTotals = new Array(12).fill(0);
    for (let i = 1; i < 11; i++) {
      if (!rows[i]) continue;
      const cols = rows[i].replace(/\r/g, "").split(",");
      const name = cols[0]?.trim();
      if (!name) continue;
      const monthly = [];
      for (let m = 0; m < 12; m++) {
        const v = Number(cols[2 + m]) || 0;
        monthly.push(v);
        monthlyTotals[m] += v;
      }
      const paid = Number(cols[14]) || monthly.reduce((s,v)=>s+v,0);
      members.push({ name, paid, target: PER_MEMBER_TARGET, emoji: emojiFor(name, i-1), monthly });
    }
    render(members, monthlyTotals);
  })
  .catch(err => {
    console.error("CSV fetch failed:", err);
    document.getElementById("stats").innerHTML =
      `<div class="stat"><div class="stat-value accent">⚠️ Could not load sheet data</div></div>`;
  });

function render(members, monthlyTotals) {
  const totalPaid = members.reduce((s,m)=>s+m.paid,0);
  const totalTarget = members.reduce((s,m)=>s+m.target,0);
  const progress = (totalPaid/GOAL_AMOUNT)*100;
  const remaining = Math.max(0, GOAL_AMOUNT - totalPaid);

  document.getElementById("goalChip").textContent = fmt(GOAL_AMOUNT);
  document.getElementById("totalTarget").textContent = fmt(totalTarget);

  const stats = [
    { label:"Total Saved", value:fmt(totalPaid), emoji:"💰", cls:"g-sunset" },
    { label:"Progress", value:progress.toFixed(1)+"%", emoji:"🚀", cls:"g-ocean" },
    { label:"Remaining", value:fmt(remaining), emoji:"⏳", cls:"accent" },
    { label:"Crew", value:String(members.length), emoji:"🧑‍🤝‍🧑", cls:"primary" },
  ];
  document.getElementById("stats").innerHTML = stats.map((s,i)=>`
    <div class="stat pop-in" style="animation-delay:${i*80}ms">
      <div class="stat-head"><span class="stat-label">${s.label}</span><span class="stat-emoji">${s.emoji}</span></div>
      <div class="stat-value ${s.cls}">${s.value}</div>
    </div>`).join("");

  const r=90, c=2*Math.PI*r;
  const ring = document.getElementById("ringFill");
  ring.setAttribute("stroke-dasharray", c);
  const pctClamped = Math.min(progress, 100);
  requestAnimationFrame(()=> ring.setAttribute("stroke-dashoffset", c-(pctClamped/100)*c));
  document.getElementById("ringPct").textContent = progress.toFixed(1)+"%";
  document.getElementById("savedPill").textContent = fmt(totalPaid);
  document.getElementById("goalPill").textContent = fmt(GOAL_AMOUNT);

  const medals = ["🥇","🥈","🥉"];
  const sorted = [...members].sort((a,b)=>b.paid-a.paid);
  document.getElementById("topList").innerHTML = sorted.slice(0,5).map((m,i)=>{
    const pct = Math.min(100, (m.paid/m.target)*100);
    return `<li class="top-item pop-in" style="animation-delay:${i*90}ms">
      <div class="medal">${medals[i] ?? "#"+(i+1)}</div>
      <div style="flex:1;min-width:0">
        <div class="top-name"><span>${m.emoji}</span><span>${m.name}</span></div>
        <div class="top-bar"><div style="width:${pct}%"></div></div>
      </div>
      <div class="top-amount g-sunset">${fmt(m.paid)}</div>
    </li>`;
  }).join("");

  // ====== MONTHLY COLLECTION ======
  const maxMonth = Math.max(1, ...monthlyTotals);
  const monthlyExpected = members.length * 1000; // share per month
  document.getElementById("monthlyMeta").textContent =
    `Target ${fmt(monthlyExpected)}/month · 12 months`;

  document.getElementById("monthlyGrid").innerHTML = monthlyTotals.map((amt, i) => {
    const pct = Math.round((amt / monthlyExpected) * 100);
    const barPct = Math.round((amt / maxMonth) * 100);
    const contributors = members.filter(m => m.monthly[i] > 0).length;
    const status = amt >= monthlyExpected
      ? { label:"Full", cls:"g-sunset" }
      : amt > 0
      ? { label:"Partial", cls:"primary" }
      : { label:"Pending", cls:"muted" };
    return `<div class="month-card pop-in" style="animation-delay:${i*45}ms">
      <div class="month-head">
        <span class="month-emoji">${MONTH_EMOJI[i]}</span>
        <span class="month-name">${MONTHS[i]}</span>
        <span class="month-tag ${status.cls}">${status.label}</span>
      </div>
      <div class="month-amount g-sunset">${fmt(amt)}</div>
      <div class="month-bar"><div style="width:${barPct}%"></div></div>
      <div class="month-foot tiny muted">
        <span>${contributors}/${members.length} paid</span>
        <span>${pct}%</span>
      </div>
    </div>`;
  }).join("");

  const monthlyTotal = monthlyTotals.reduce((s,v)=>s+v,0);
  const bestIdx = monthlyTotals.indexOf(Math.max(...monthlyTotals));
  document.getElementById("monthlySummary").innerHTML = `
    <div class="m-sum"><span class="tiny muted">Collected</span><strong class="g-sunset">${fmt(monthlyTotal)}</strong></div>
    <div class="m-sum"><span class="tiny muted">Best month</span><strong class="primary">${MONTH_EMOJI[bestIdx]} ${MONTHS[bestIdx]}</strong></div>
    <div class="m-sum"><span class="tiny muted">Avg / month</span><strong class="accent">${fmt(Math.round(monthlyTotal/12))}</strong></div>
  `;

  document.getElementById("crewMeta").textContent = `${members.length} travelers · ${fmt(PER_MEMBER_TARGET)} each`;
  document.getElementById("membersGrid").innerHTML = sorted.map((m,i)=>{
    const pct = Math.round((m.paid/m.target)*100);
    const pending = Math.max(0, m.target-m.paid);
    const s = statusFor(pct);
    return `<article class="member pop-in" style="animation-delay:${i*60}ms">
      <div class="member-head">
        <div class="member-left">
          <div class="avatar">${m.emoji}</div>
          <div><div class="member-name">${m.name}</div><div class="member-status">${s.label}</div></div>
        </div>
        <div class="member-pct g-sunset">${pct}%</div>
      </div>
      <div class="member-bar"><div style="width:${Math.min(pct,100)}%;background:linear-gradient(90deg,${s.from},${s.to})"></div></div>
      <div class="member-stats">
        <div class="stat-cell"><span class="tiny muted">Paid</span><span class="val primary">${fmt(m.paid)}</span></div>
        <div class="stat-cell"><span class="tiny muted">Pending</span><span class="val" style="color:var(--secondary)">${fmt(pending)}</span></div>
        <div class="stat-cell"><span class="tiny muted">Target</span><span class="val accent">${fmt(m.target)}</span></div>
      </div>
    </article>`;
  }).join("");
}

function statusFor(pct){
  if(pct>=100) return { from:"#5fd991", to:"#7ee4b0", label:"🎉 Done" };
  if(pct>=50)  return { from:"#4ed8e8", to:"#5fc8c0", label:"🌊 On track" };
  if(pct>0)    return { from:"#f7a83a", to:"#ff6b4a", label:"☀️ Catching up" };
  return { from:"#5a6b80", to:"#3f4d5f", label:"💤 Not started" };
}
