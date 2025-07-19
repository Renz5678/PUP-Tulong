// 🔐 Handle login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value
    })
  });

  const data = await res.json();
  document.getElementById("message").textContent = data.message || data.detail;

  if (res.ok) {
    window.location.href = "/static/dashboard.html";
  }
});

// 📝 Handle registration
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("reg-email").value,
      password: document.getElementById("reg-password").value,
      nickname: document.getElementById("reg-nickname").value
    })
  });

  const data = await res.json();
  document.getElementById("message").textContent = data.message || data.detail;

  if (res.ok) {
    window.location.href = "/static/dashboard.html";
  }
});

// 🔗 Google OAuth
document.getElementById("google-login").addEventListener("click", () => {
  window.location.href = "/auth/login/google";
});
