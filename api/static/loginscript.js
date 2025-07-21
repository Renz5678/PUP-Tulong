document.cookie = "token=; Max-Age=0; path=/;";
console.log("✅ login.js loaded");

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
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
}

const googleLogin = document.getElementById("google-login");
if (googleLogin) {
  googleLogin.addEventListener("click", () => {
    window.location.href = "/auth/login/google";
  });
}
