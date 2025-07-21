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
      window.location.href = "/dashboard"; // ✅ updated route
    }
  });
}

const googleLogin = document.getElementById("google-login");
if (googleLogin) {
  googleLogin.addEventListener("click", () => {
    window.location.href = "/auth/login/google";
  });
}

// Handle forgot password click
function handleForgotPassword() {
  // You can customize this behavior based on your needs
  const email = document.getElementById("login-email").value;
  
  if (!email) {
    alert("Please enter your email first, then click forgot password.");
    document.getElementById("login-email").focus();
    return;
  }
  
  // For now, show an alert - you can replace this with your forgot password logic
  alert("Forgot password functionality will be implemented here for: " + email);
  
  // Example: You could redirect to a forgot password page or make an API call
  // window.location.href = "/forgot-password?email=" + encodeURIComponent(email);
}