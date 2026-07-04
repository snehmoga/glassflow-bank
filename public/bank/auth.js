// ============================================================
// auth.js — Login handling for Bank Management System
// ============================================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "snehmoga";

// If already logged in, jump straight to dashboard
if (localStorage.getItem("bankAdminLoggedIn") === "true") {
  window.location.href = "dashboard.html";
}

const form = document.getElementById("loginForm");
const alertBox = document.getElementById("loginAlert");

function showAlert(message, type) {
  alertBox.innerHTML = `<div class="alert ${type}">${message}</div>`;
  if (type === "success") {
    setTimeout(() => (alertBox.innerHTML = ""), 2500);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();

  if (!u || !p) {
    showAlert("Please enter both username and password.", "error");
    return;
  }
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    localStorage.setItem("bankAdminLoggedIn", "true");
    showAlert("Login successful. Redirecting…", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 600);
  } else {
    showAlert("Invalid username or password.", "error");
  }
});
