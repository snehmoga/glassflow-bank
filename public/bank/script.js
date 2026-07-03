// ============================================================
// Bank Management System — Main Logic
// Pure vanilla JS with LocalStorage persistence.
// ============================================================

// --- Auth gate ---
if (localStorage.getItem("bankAdminLoggedIn") !== "true") {
  window.location.href = "index.html";
}

// --- Constants ---
const MIN_BALANCE = 500;
const LS_ACCOUNTS = "bankAccounts";
const LS_TX = "bankTransactions";

// --- Storage helpers ---
function getAccounts() {
  return JSON.parse(localStorage.getItem(LS_ACCOUNTS) || "[]");
}
function saveAccounts(list) {
  localStorage.setItem(LS_ACCOUNTS, JSON.stringify(list));
}
function getTx() {
  return JSON.parse(localStorage.getItem(LS_TX) || "[]");
}
function saveTx(list) {
  localStorage.setItem(LS_TX, JSON.stringify(list));
}
function findAccount(accNo) {
  return getAccounts().find(a => a.accountNumber === String(accNo).trim());
}
function updateAccount(updated) {
  const list = getAccounts().map(a => a.accountNumber === updated.accountNumber ? updated : a);
  saveAccounts(list);
}

// --- Utils ---
function money(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function nowStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function nextTxId() {
  const list = getTx();
  const n = list.length + 1;
  return "TXN" + String(n).padStart(4, "0");
}
function addTransaction(accountNumber, type, amount) {
  const list = getTx();
  list.push({
    id: nextTxId(),
    accountNumber,
    type,
    amount: Number(amount),
    dateTime: nowStr(),
  });
  saveTx(list);
}

// --- Toast ---
function toast(msg, type = "info") {
  const wrap = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(-10px)"; }, 2500);
  setTimeout(() => el.remove(), 3000);
}

// --- Modal (Promise-based confirm) ---
function confirmModal(title, body) {
  return new Promise(resolve => {
    const back = document.getElementById("modal");
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalBody").textContent = body;
    back.classList.add("open");
    const ok = document.getElementById("modalOk");
    const cancel = document.getElementById("modalCancel");
    function close(v){ back.classList.remove("open"); ok.onclick=null; cancel.onclick=null; resolve(v); }
    ok.onclick = () => close(true);
    cancel.onclick = () => close(false);
  });
}

// ============================================================
// Navigation
// ============================================================
const sections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll("#nav a[data-target]");
const pageTitle = document.getElementById("pageTitle");

const TITLES = {
  home: "Dashboard", create: "Create Account", view: "All Accounts",
  search: "Search Account", deposit: "Deposit Money", withdraw: "Withdraw Money",
  update: "Update Account", delete: "Delete Account", tx: "Transaction History",
  txByAcc: "Transactions by Account", interest: "Simple Interest Calculator",
};

function goTo(target) {
  sections.forEach(s => s.classList.toggle("active", s.id === target));
  navLinks.forEach(a => a.classList.toggle("active", a.dataset.target === target));
  pageTitle.textContent = TITLES[target] || "Dashboard";
  document.getElementById("sidebar").classList.remove("open");
  // Refresh section-specific views
  if (target === "home") renderHome();
  if (target === "view") renderAccountsTable();
  if (target === "tx") renderAllTx();
}
navLinks.forEach(a => a.addEventListener("click", () => goTo(a.dataset.target)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => goTo(b.dataset.go)));

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  const ok = await confirmModal("Logout", "Are you sure you want to logout?");
  if (ok) {
    localStorage.removeItem("bankAdminLoggedIn");
    window.location.href = "index.html";
  }
});

// Hamburger (mobile)
document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ============================================================
// HOME — summary cards & recent transactions
// ============================================================
function renderHome() {
  const accs = getAccounts();
  const txs = getTx();
  const totalBal = accs.reduce((s,a) => s + Number(a.balance), 0);
  const savings = accs.filter(a => a.accountType === "Savings").length;
  const current = accs.filter(a => a.accountType === "Current").length;

  const cards = [
    { label: "Total Accounts", value: accs.length, icon: "👥" },
    { label: "Total Bank Balance", value: money(totalBal), icon: "💎" },
    { label: "Total Transactions", value: txs.length, icon: "📜" },
    { label: "Savings Accounts", value: savings, icon: "🏦" },
    { label: "Current Accounts", value: current, icon: "💼" },
  ];
  document.getElementById("summaryCards").innerHTML = cards.map(c => `
    <div class="card">
      <div class="ico-wrap"></div>
      <div class="icon">${c.icon}</div>
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
    </div>
  `).join("");

  // Recent transactions preview
  const recent = [...txs].reverse().slice(0, 5);
  const box = document.getElementById("recentTx");
  if (recent.length === 0) {
    box.innerHTML = `<div class="empty"><div class="big">📭</div>No transactions yet.</div>`;
  } else {
    box.innerHTML = `<div class="table-wrap"><table class="data">
      <thead><tr><th>ID</th><th>Account</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
      <tbody>${recent.map(t => `
        <tr>
          <td>${t.id}</td>
          <td>${t.accountNumber}</td>
          <td><span class="badge ${t.type==='Deposit'?'dep':'wdr'}">${t.type}</span></td>
          <td>${money(t.amount)}</td>
          <td>${t.dateTime}</td>
        </tr>`).join("")}
      </tbody></table></div>`;
  }
}

// ============================================================
// CREATE ACCOUNT
// ============================================================
document.getElementById("createForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const acc = document.getElementById("c_acc").value.trim();
  const name = document.getElementById("c_name").value.trim();
  const age = parseInt(document.getElementById("c_age").value, 10);
  const mobile = document.getElementById("c_mobile").value.trim();
  const addr = document.getElementById("c_addr").value.trim();
  const type = document.getElementById("c_type").value;
  const bal = parseFloat(document.getElementById("c_bal").value);

  if (!acc || !name || !mobile || !addr) return toast("Please fill all required fields.", "error");
  if (isNaN(age) || age < 10 || age > 120) return toast("Enter a valid age.", "error");
  if (!/^\d{10}$/.test(mobile)) return toast("Mobile must be a 10-digit number.", "error");
  if (isNaN(bal) || bal < MIN_BALANCE) return toast(`Initial balance must be at least ${money(MIN_BALANCE)}.`, "error");
  if (findAccount(acc)) return toast("Account number already exists.", "error");

  const list = getAccounts();
  list.push({ accountNumber: acc, name, age, mobile, address: addr, accountType: type, balance: bal });
  saveAccounts(list);
  toast("Account created successfully.", "success");
  e.target.reset();
  renderHome();
});

// ============================================================
// VIEW ALL
// ============================================================
function renderAccountsTable() {
  const q = (document.getElementById("v_search")?.value || "").toLowerCase();
  const filter = document.getElementById("v_filter")?.value || "";
  let list = getAccounts();
  if (filter) list = list.filter(a => a.accountType === filter);
  if (q) list = list.filter(a => a.name.toLowerCase().includes(q) || a.accountNumber.includes(q));

  const box = document.getElementById("viewTable");
  if (list.length === 0) {
    box.innerHTML = `<div class="empty"><div class="big">🗂️</div>No accounts found.</div>`;
    return;
  }
  box.innerHTML = `<table class="data">
    <thead><tr><th>Acc No</th><th>Name</th><th>Age</th><th>Mobile</th><th>Address</th><th>Type</th><th>Balance</th><th>Actions</th></tr></thead>
    <tbody>${list.map(a => `
      <tr>
        <td><b>${a.accountNumber}</b></td>
        <td>${a.name}</td>
        <td>${a.age}</td>
        <td>${a.mobile}</td>
        <td>${a.address}</td>
        <td><span class="badge ${a.accountType==='Savings'?'sav':'cur'}">${a.accountType}</span></td>
        <td>${money(a.balance)}</td>
        <td class="row-actions">
          <button class="btn ghost small" data-action="view" data-acc="${a.accountNumber}">👁</button>
          <button class="btn ghost small" data-action="edit" data-acc="${a.accountNumber}">✏️</button>
          <button class="btn danger small" data-action="del" data-acc="${a.accountNumber}">🗑</button>
        </td>
      </tr>`).join("")}
    </tbody></table>`;

  box.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const accNo = btn.dataset.acc;
      const action = btn.dataset.action;
      if (action === "view") { document.getElementById("s_acc").value = accNo; goTo("search"); doSearch(); }
      if (action === "edit") { document.getElementById("u_acc").value = accNo; goTo("update"); loadUpdate(); }
      if (action === "del")  { document.getElementById("del_acc").value = accNo; goTo("delete"); doDelete(); }
    });
  });
}
document.getElementById("v_search").addEventListener("input", renderAccountsTable);
document.getElementById("v_filter").addEventListener("change", renderAccountsTable);

// ============================================================
// SEARCH
// ============================================================
function doSearch() {
  const acc = document.getElementById("s_acc").value.trim();
  const box = document.getElementById("s_result");
  if (!acc) { box.innerHTML = ""; return toast("Enter an account number.", "error"); }
  const a = findAccount(acc);
  if (!a) { box.innerHTML = `<div class="alert error">Account not found.</div>`; return; }
  box.innerHTML = `<div class="result">
    <div class="kv"><span>Account Number</span><span>${a.accountNumber}</span></div>
    <div class="kv"><span>Name</span><span>${a.name}</span></div>
    <div class="kv"><span>Age</span><span>${a.age}</span></div>
    <div class="kv"><span>Mobile</span><span>${a.mobile}</span></div>
    <div class="kv"><span>Address</span><span>${a.address}</span></div>
    <div class="kv"><span>Type</span><span>${a.accountType}</span></div>
    <div class="kv"><span>Balance</span><span>${money(a.balance)}</span></div>
  </div>`;
}
document.getElementById("s_btn").addEventListener("click", doSearch);

// ============================================================
// DEPOSIT
// ============================================================
document.getElementById("d_btn").addEventListener("click", () => {
  const acc = document.getElementById("d_acc").value.trim();
  const amt = parseFloat(document.getElementById("d_amt").value);
  const box = document.getElementById("d_result");
  if (!acc) return toast("Enter account number.", "error");
  if (isNaN(amt) || amt <= 0) return toast("Amount must be greater than 0.", "error");
  const a = findAccount(acc);
  if (!a) { box.innerHTML = `<div class="alert error">Account not found.</div>`; return; }
  a.balance = Number(a.balance) + amt;
  updateAccount(a);
  addTransaction(acc, "Deposit", amt);
  box.innerHTML = `<div class="alert success">Deposit successful.</div>
    <div class="result"><div class="kv"><span>New Balance</span><span class="big-num">${money(a.balance)}</span></div></div>`;
  toast("Deposit successful.", "success");
  document.getElementById("d_amt").value = "";
});

// ============================================================
// WITHDRAW
// ============================================================
document.getElementById("w_btn").addEventListener("click", () => {
  const acc = document.getElementById("w_acc").value.trim();
  const amt = parseFloat(document.getElementById("w_amt").value);
  const box = document.getElementById("w_result");
  if (!acc) return toast("Enter account number.", "error");
  if (isNaN(amt) || amt <= 0) return toast("Amount must be greater than 0.", "error");
  const a = findAccount(acc);
  if (!a) { box.innerHTML = `<div class="alert error">Account not found.</div>`; return; }
  if (Number(a.balance) - amt < MIN_BALANCE) {
    box.innerHTML = `<div class="alert error">Withdrawal denied. Minimum balance of ${money(MIN_BALANCE)} must remain. Current: ${money(a.balance)}.</div>`;
    return;
  }
  a.balance = Number(a.balance) - amt;
  updateAccount(a);
  addTransaction(acc, "Withdraw", amt);
  box.innerHTML = `<div class="alert success">Withdrawal successful.</div>
    <div class="result"><div class="kv"><span>New Balance</span><span class="big-num">${money(a.balance)}</span></div></div>`;
  toast("Withdrawal successful.", "success");
  document.getElementById("w_amt").value = "";
});

// ============================================================
// UPDATE
// ============================================================
function loadUpdate() {
  const acc = document.getElementById("u_acc").value.trim();
  const form = document.getElementById("u_form");
  if (!acc) { form.innerHTML = ""; return toast("Enter account number.", "error"); }
  const a = findAccount(acc);
  if (!a) { form.innerHTML = `<div class="alert error">Account not found.</div>`; return; }
  form.innerHTML = `
    <div class="grid-2" style="margin-top:14px;">
      <div class="field"><label>Account Number (Fixed)</label><input class="input" value="${a.accountNumber}" disabled /></div>
      <div class="field"><label>Full Name</label><input class="input" id="u_name" value="${a.name}" /></div>
      <div class="field"><label>Age</label><input class="input" id="u_age" type="number" value="${a.age}" /></div>
      <div class="field"><label>Mobile</label><input class="input" id="u_mobile" value="${a.mobile}" /></div>
      <div class="field" style="grid-column:1/-1;"><label>Address</label><input class="input" id="u_addr" value="${a.address}" /></div>
      <div class="field"><label>Account Type</label>
        <select id="u_type">
          <option value="Savings" ${a.accountType==='Savings'?'selected':''}>Savings</option>
          <option value="Current" ${a.accountType==='Current'?'selected':''}>Current</option>
        </select>
      </div>
    </div>
    <div class="row-actions" style="margin-top:12px;">
      <button class="btn" id="u_save">💾 Save Changes</button>
    </div>`;
  document.getElementById("u_save").addEventListener("click", () => {
    const name = document.getElementById("u_name").value.trim();
    const age = parseInt(document.getElementById("u_age").value, 10);
    const mobile = document.getElementById("u_mobile").value.trim();
    const addr = document.getElementById("u_addr").value.trim();
    const type = document.getElementById("u_type").value;
    if (!name || !mobile || !addr) return toast("All fields required.", "error");
    if (!/^\d{10}$/.test(mobile)) return toast("Mobile must be a 10-digit number.", "error");
    if (isNaN(age) || age < 10) return toast("Enter a valid age.", "error");
    const updated = { ...a, name, age, mobile, address: addr, accountType: type };
    updateAccount(updated);
    toast("Account updated successfully.", "success");
  });
}
document.getElementById("u_load").addEventListener("click", loadUpdate);

// ============================================================
// DELETE
// ============================================================
async function doDelete() {
  const acc = document.getElementById("del_acc").value.trim();
  const box = document.getElementById("del_result");
  if (!acc) return toast("Enter account number.", "error");
  const a = findAccount(acc);
  if (!a) { box.innerHTML = `<div class="alert error">Account not found.</div>`; return; }
  box.innerHTML = `<div class="result">
    <div class="kv"><span>Account</span><span>${a.accountNumber} · ${a.name}</span></div>
    <div class="kv"><span>Type</span><span>${a.accountType}</span></div>
    <div class="kv"><span>Balance</span><span>${money(a.balance)}</span></div>
  </div>`;
  const ok = await confirmModal("Delete Account?", `Permanently delete account ${a.accountNumber} (${a.name})? This cannot be undone.`);
  if (!ok) return;
  const list = getAccounts().filter(x => x.accountNumber !== a.accountNumber);
  saveAccounts(list);
  box.innerHTML = `<div class="alert success">Account ${a.accountNumber} deleted.</div>`;
  toast("Account deleted.", "success");
  document.getElementById("del_acc").value = "";
}
document.getElementById("del_btn").addEventListener("click", doDelete);

// ============================================================
// TRANSACTIONS (all)
// ============================================================
function renderTxTable(target, txs) {
  const box = document.getElementById(target);
  if (txs.length === 0) {
    box.innerHTML = `<div class="empty"><div class="big">📭</div>No transactions found.</div>`;
    return;
  }
  box.innerHTML = `<table class="data">
    <thead><tr><th>Tx ID</th><th>Account</th><th>Type</th><th>Amount</th><th>Date & Time</th></tr></thead>
    <tbody>${[...txs].reverse().map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.accountNumber}</td>
        <td><span class="badge ${t.type==='Deposit'?'dep':'wdr'}">${t.type}</span></td>
        <td>${money(t.amount)}</td>
        <td>${t.dateTime}</td>
      </tr>`).join("")}
    </tbody></table>`;
}
function renderAllTx() { renderTxTable("txTable", getTx()); }

// TX BY ACCOUNT
document.getElementById("tba_btn").addEventListener("click", () => {
  const acc = document.getElementById("tba_acc").value.trim();
  if (!acc) return toast("Enter account number.", "error");
  const filtered = getTx().filter(t => t.accountNumber === acc);
  renderTxTable("tba_table", filtered);
});

// ============================================================
// INTEREST CALCULATOR
// ============================================================
document.getElementById("i_btn").addEventListener("click", () => {
  const p = parseFloat(document.getElementById("i_p").value);
  const r = parseFloat(document.getElementById("i_r").value);
  const t = parseFloat(document.getElementById("i_t").value);
  const box = document.getElementById("i_result");
  if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0 || r <= 0 || t <= 0) {
    box.innerHTML = `<div class="alert error">Please enter valid positive numbers.</div>`;
    return;
  }
  const si = (p * r * t) / 100;
  const total = p + si;
  box.innerHTML = `<div class="result">
    <div class="kv"><span>Principal</span><span>${money(p)}</span></div>
    <div class="kv"><span>Rate</span><span>${r}% p.a.</span></div>
    <div class="kv"><span>Time</span><span>${t} year(s)</span></div>
    <div class="kv"><span>Simple Interest</span><span class="big-num">${money(si)}</span></div>
    <div class="kv"><span>Total Amount</span><span>${money(total)}</span></div>
  </div>`;
});

// ============================================================
// DEMO DATA
// ============================================================
document.getElementById("seedBtn").addEventListener("click", async () => {
  const ok = await confirmModal("Load Demo Data?", "This will replace all existing accounts and transactions with sample data.");
  if (!ok) return;
  const demo = [
    { accountNumber: "101", name: "Rahul Patel", age: 20, mobile: "9876543210", address: "Ahmedabad", accountType: "Savings", balance: 15000 },
    { accountNumber: "102", name: "Priya Shah", age: 22, mobile: "9123456780", address: "Mumbai", accountType: "Current", balance: 42000 },
    { accountNumber: "103", name: "Arjun Mehta", age: 25, mobile: "9988776655", address: "Pune", accountType: "Savings", balance: 8500 },
    { accountNumber: "104", name: "Neha Sharma", age: 28, mobile: "9012345678", address: "Delhi", accountType: "Current", balance: 65000 },
  ];
  saveAccounts(demo);
  saveTx([
    { id: "TXN0001", accountNumber: "101", type: "Deposit", amount: 5000, dateTime: nowStr() },
    { id: "TXN0002", accountNumber: "102", type: "Deposit", amount: 12000, dateTime: nowStr() },
    { id: "TXN0003", accountNumber: "103", type: "Withdraw", amount: 1500, dateTime: nowStr() },
    { id: "TXN0004", accountNumber: "104", type: "Deposit", amount: 20000, dateTime: nowStr() },
  ]);
  toast("Demo data loaded.", "success");
  renderHome();
  renderAccountsTable();
  renderAllTx();
});

// ============================================================
// Initial render
// ============================================================
renderHome();
renderAccountsTable();
renderAllTx();
