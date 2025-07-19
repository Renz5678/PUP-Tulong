// static/script.js

// Handle registration
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: document.getElementById("reg-email").value,
      password: document.getElementById("reg-password").value,
      nickname: document.getElementById("reg-nickname").value
    })
  });

  const data = await res.json();
  document.getElementById("message").innerText = data.message || data.detail;

  if (res.ok && data.token) {
    localStorage.setItem("token", data.token);
    window.location.href = "/static/dashboard.html";
  }
});

// Handle login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value
    })
  });

  const data = await res.json();
  document.getElementById("message").innerText = data.message || data.detail;

  if (res.ok && data.token) {
    localStorage.setItem("token", data.token);
    window.location.href = "/static/dashboard.html";
  }
});
