console.log("✅ register.js loaded");

let pendingEmail = "";
let pendingPassword = "";
let pendingNickname = "";

const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
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
      document.getElementById("reg-email").value = "";
      document.getElementById("reg-password").value = "";
      document.getElementById("reg-nickname").value = "";
      return;
    }

    if (res.ok) {
      pendingEmail = email;
      pendingPassword = password;
      pendingNickname = nickname;

      document.getElementById("register-form").style.display = "none";
      document.getElementById("otp-form").style.display = "block";
      console.log("✅ Showing OTP form...");
    }
  });
}

const otpForm = document.getElementById("otp-form");
if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
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
      document.getElementById("otp-code").value = "";
      window.location.href = "/dashboard"; // ✅ updated route
    }
  });
}