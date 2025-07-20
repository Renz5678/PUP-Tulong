// 🧼 Clear any existing token when the page loads
document.cookie = "token=; Max-Age=0; path=/;";
console.log("✅ script.js loaded");

let pendingEmail = "";
let pendingPassword = "";
let pendingNickname = "";

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
    // ✅ Redirect only after successful login
    window.location.href = "/static/dashboard.html";
  }
});

// 📝 Handle registration (Step 1: send OTP)
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const nickname = document.getElementById("reg-nickname").value;

  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nickname })
  });

  const data = await res.json();
  document.getElementById("message").textContent = data.message || data.detail;

  if (res.status === 400 && data.detail === "Email already registered") {
    alert("🚫 This email is already registered.");
    // ❌ Clear input fields
    document.getElementById("reg-email").value = "";
    document.getElementById("reg-password").value = "";
    document.getElementById("reg-nickname").value = "";
    return;
  }

  if (res.ok) {
    // Save data for OTP step
    pendingEmail = email;
    pendingPassword = password;
    pendingNickname = nickname;

    // Switch to OTP form
    document.getElementById("register-form").style.display = "none";
    document.getElementById("otp-form").style.display = "block";
    console.log("✅ Showing OTP form...");
  }
});

// ✅ Handle OTP verification (Step 2: verify and redirect)
document.getElementById("otp-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const otp = document.getElementById("otp-code").value;

  const formData = new FormData();
  formData.append("email", pendingEmail);
  formData.append("otp", otp);

  const res = await fetch("/auth/verify-otp", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  document.getElementById("message").textContent = data.message || data.detail;

  if (res.ok) {
    // ✅ Only redirect to dashboard after OTP is correct
    document.getElementById("otp-code").value = ""; // clean up
    window.location.href = "/static/dashboard.html";
  }
});

// 🔗 Google OAuth
document.getElementById("google-login").addEventListener("click", () => {
  window.location.href = "/auth/login/google";
});
