// Clear any existing tokens
document.cookie = "token=; Max-Age=0; path=/;";
console.log("✅ login.js loaded");

// Login form handler
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      Logging in...
    `;
    
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("login-email").value,
          password: document.getElementById("login-password").value
        })
      });

      const data = await res.json();
      showMessage(data.message || data.detail, res.ok ? 'success' : 'error');

      if (res.ok) {
        // Delay redirect slightly to show success message
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        // Reset button state on error
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Network error. Please try again.', 'error');
      
      // Reset button state on error
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Google login handler
const googleLogin = document.getElementById("google-login");
if (googleLogin) {
  googleLogin.addEventListener("click", () => {
    // Show loading state
    const originalContent = googleLogin.innerHTML;
    googleLogin.disabled = true;
    googleLogin.innerHTML = `
      <div class="spinner-border spinner-border-sm me-2" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span>Connecting...</span>
    `;
    
    // Redirect to Google auth
    window.location.href = "/auth/login/google";
  });
}

// Enhanced forgot password handler
function handleForgotPassword() {
  const email = document.getElementById("login-email").value.trim();
  
  if (!email) {
    // Use Bootstrap toast for better UX
    showMessage("Please enter your email first, then click forgot password.", 'warning');
    document.getElementById("login-email").focus();
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage("Please enter a valid email address.", 'warning');
    document.getElementById("login-email").focus();
    return;
  }
  
  // For now, show confirmation message - replace with actual forgot password logic
  showMessage(`Password reset instructions will be sent to: ${email}`, 'info');
  
  // Example: Redirect to forgot password page
  // window.location.href = "/forgot-password?email=" + encodeURIComponent(email);
  
  // Example: Make API call for forgot password
  /*
  fetch("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email })
  })
  .then(res => res.json())
  .then(data => {
    showMessage(data.message, res.ok ? 'success' : 'error');
  })
  .catch(error => {
    showMessage('Network error. Please try again.', 'error');
  });
  */
}

// Enhanced message display with Bootstrap classes
function showMessage(text, type = 'info') {
  const messageEl = document.getElementById("message");
  if (!messageEl) return;
  
  // Clear any existing message
  messageEl.textContent = '';
  messageEl.className = '';
  
  // Add Bootstrap alert classes based on type
  let alertClass = 'alert alert-dismissible fade show position-fixed';
  switch(type) {
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
  
  // Auto-hide after 5 seconds
  setTimeout(hideMessage, 5000);
}

// Hide message function
function hideMessage() {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.classList.remove('show');
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = '';
      messageEl.style.cssText = 'display: none;'; // Hide the element completely
    }, 150);
  }
}

// Dark mode functionality with localStorage persistence
function initDarkMode() {
  const darkModeBtn = document.getElementById('dark-mode-toggle');
  if (!darkModeBtn) return;
  
  // Check for saved dark mode preference or default to light mode
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    toggleDarkModeClasses(true);
    darkModeBtn.textContent = '☀️';
  }
  
  darkModeBtn.addEventListener('click', function() {
    const currentlyDark = document.body.classList.contains('dark-mode');
    const newDarkMode = !currentlyDark;
    
    toggleDarkModeClasses(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    darkModeBtn.textContent = newDarkMode ? '☀️' : '🌙';
    
    // Smooth transition effect
    document.body.style.transition = 'all 0.3s ease';
  });
}

// Toggle dark mode classes on all relevant elements
function toggleDarkModeClasses(isDark) {
  const elements = [
    document.body,
    document.querySelector('.login-card'),
    document.querySelector('.login-title'),
    document.querySelector('.mobile-branding h1'),
    document.querySelector('.bottom-left-text'),
    document.querySelector('.divider span'),
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

// Form validation enhancements
function enhanceFormValidation() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      const email = this.value.trim();
      if (email && !isValidEmail(email)) {
        this.classList.add('is-invalid');
        showFieldError(this, 'Please enter a valid email address.');
      } else {
        this.classList.remove('is-invalid');
        hideFieldError(this);
      }
    });
    
    emailInput.addEventListener('input', function() {
      if (this.classList.contains('is-invalid')) {
        this.classList.remove('is-invalid');
        hideFieldError(this);
      }
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      if (this.classList.contains('is-invalid')) {
        this.classList.remove('is-invalid');
        hideFieldError(this);
      }
    });
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Field error display helpers
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

// Keyboard accessibility
function enhanceKeyboardNavigation() {
  // Allow Enter key on forgot password
  document.querySelector('.forgot-password')?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleForgotPassword();
    }
  });
  
  // Escape key to close messages
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hideMessage();
    }
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initDarkMode();
  enhanceFormValidation();
  enhanceKeyboardNavigation();
  
  // Add loading state to page transitions
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.href && !this.href.includes('#') && !this.target) {
        const text = this.textContent;
        this.innerHTML = `
          <div class="spinner-border spinner-border-sm me-2" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          Loading...
        `;
      }
    });
  });
  
  console.log("✅ All login enhancements loaded");
});

// Reset continue button on pageshow
window.addEventListener('pageshow', function(event) {
  // Reset the continue button if user navigates back to login page
  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg class="continue-icon" width="20" height="20" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M17 12l-5-5v4H7v2h5v4l5-5z" fill="currentColor"/>
      </svg>
      Continue
    `;
  }
  // Reset the Google button if user navigates back to login page
  const googleBtn = document.getElementById('google-login');
  if (googleBtn) {
    googleBtn.disabled = false;
    googleBtn.innerHTML = `
      <svg class="google-icon" width="24" height="24" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>Continue with Google</span>
    `;
  }
});