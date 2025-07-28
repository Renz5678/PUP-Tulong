console.log("✅ register.js loaded");

let pendingEmail = "";
let pendingPassword = "";
let pendingNickname = "";

// Registration form handler
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      Creating account...
    `;

    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();
    const nickname = document.getElementById("register-nickname").value.trim();

    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
        redirect: "follow"
      });

      // If backend sends a redirect (303), just follow it
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      let rawText = await res.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error("❌ Failed to parse JSON:", rawText);
        showMessage("Server error. Please try again later.", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
      }

      showMessage(data.message || data.detail || "Unknown error", res.ok ? 'success' : 'error');

      if (res.status === 400 && data.detail === "Email already registered") {
        alert("🚫 This email is already registered.");
        registerForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
      }

      if (res.ok) {
        pendingEmail = email;
        pendingPassword = password;
        pendingNickname = nickname;
        window.location.href = `/verify?email=${encodeURIComponent(email)}`;
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    } catch (error) {
      console.error("Registration error:", error);
      showMessage("Network error. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Show feedback message
function showMessage(text, type = 'info') {
  const messageEl = document.getElementById("register-message");
  if (!messageEl) return;

  messageEl.textContent = '';
  messageEl.className = '';

  let alertClass = 'alert alert-dismissible fade show position-fixed';
  switch (type) {
    case 'success':
      alertClass += ' alert-success';
      break;
    case 'error':
      alertClass += ' alert-danger';
      break;
    case 'warning':
      alertClass += ' alert-warning';
      break;
    default:
      alertClass += ' alert-info';
  }

  messageEl.className = alertClass;
  messageEl.style.cssText = `
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1050;
    max-width: 90vw;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  messageEl.innerHTML = `
    ${text}
    <button type="button" class="btn-close" onclick="hideMessage()" aria-label="Close"></button>
  `;

  setTimeout(hideMessage, 5000);
}

// Hide feedback message
function hideMessage() {
  const messageEl = document.getElementById("register-message");
  if (messageEl) {
    messageEl.classList.remove('show');
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = '';
      messageEl.style.cssText = 'display: none;';
    }, 150);
  }
}

// Dark mode toggle and persistence
function initDarkMode() {
  const darkModeBtn = document.getElementById('dark-mode-toggle');
  if (!darkModeBtn) return;

  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    toggleDarkModeClasses(true);
    darkModeBtn.textContent = '☀️';
  }

  darkModeBtn.addEventListener('click', function () {
    const currentlyDark = document.body.classList.contains('dark-mode');
    const newDarkMode = !currentlyDark;

    toggleDarkModeClasses(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    darkModeBtn.textContent = newDarkMode ? '☀️' : '🌙';

    document.body.style.transition = 'all 0.3s ease';
  });
}

function toggleDarkModeClasses(isDark) {
  const elements = [
    document.body,
    document.querySelector('.register-card'),
    document.querySelector('.register-title'),
    document.getElementById('dark-mode-toggle'),
    ...document.querySelectorAll('input'),
    ...document.querySelectorAll('.btn'),
  ];

  elements.forEach(el => {
    if (el) {
      if (isDark) {
        el.classList.add('dark-mode');
      } else {
        el.classList.remove('dark-mode');
      }
    }
  });
}

// Field validation (optional)
function enhanceFormValidation() {
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');

  if (emailInput) {
    emailInput.addEventListener('blur', function () {
      const email = this.value.trim();
      if (email && !isValidEmail(email)) {
        this.classList.add('is-invalid');
        showFieldError(this, 'Please enter a valid email address.');
      } else {
        this.classList.remove('is-invalid');
        hideFieldError(this);
      }
    });

    emailInput.addEventListener('input', function () {
      if (this.classList.contains('is-invalid')) {
        this.classList.remove('is-invalid');
        hideFieldError(this);
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', function () {
      if (this.classList.contains('is-invalid')) {
        this.classList.remove('is-invalid');
        hideFieldError(this);
      }
    });
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showFieldError(field, message) {
  let errorDiv = field.parentNode.querySelector('.invalid-feedback');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    field.parentNode.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
}

function hideFieldError(field) {
  const errorDiv = field.parentNode.querySelector('.invalid-feedback');
  if (errorDiv) {
    errorDiv.remove();
  }
}

// Init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  enhanceFormValidation();
});
