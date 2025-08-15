async function loadProfileData() {
    console.log("🔄 Loading profile data...");
    try {
        // Show loading placeholders
        const setLoading = (id) => {
            const element = document.getElementById(id);
            if (element) element.textContent = 'Loading...';
        };
        setLoading('profile-nickname');
        setLoading('profile-email');

        // Fetch only the profile
        const profileRes = await fetch(`/dashboard/profile?nocache=${Date.now()}`, { credentials: 'include' });

        if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);

        const profileData = await profileRes.json();

        console.log('✅ Profile data:', profileData);

        // Update nickname and email
        document.getElementById('profile-nickname').textContent = profileData.nickname || 'Not set';
        document.getElementById('profile-email').textContent = profileData.email || 'Unknown';

    } catch (err) {
        console.error('❌ Error loading profile data:', err);
        ['profile-nickname', 'profile-email'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = 'Error loading';
        });
    }
}

function openProfile() {
    console.log("🔓 Opening profile modal...");
    const profileWrapper = document.getElementById('profile-wrapper');
    if (profileWrapper) {
        profileWrapper.classList.remove('hidden');
        profileWrapper.classList.add('show');
        loadProfileData();
    }
}

function closeProfile() {
    console.log("🔒 Closing profile modal...");
    const profileWrapper = document.getElementById('profile-wrapper');
    if (profileWrapper) {
        profileWrapper.classList.add('hidden');
        profileWrapper.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Profile script ready!");

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', openProfile);
    }

    const closeBtn = document.getElementById('profile-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProfile);
    }

    const profileWrapper = document.getElementById('profile-wrapper');
    if (profileWrapper) {
        profileWrapper.addEventListener('click', function(e) {
            if (e.target === profileWrapper) {
                closeProfile();
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to logout?')) {
                const response = await fetch('/logout', { credentials: 'include' });
                if (response.ok) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/login';
                }
            }
        });
    }
});

// Export functions for use in other scripts if needed
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.loadProfileData = loadProfileData;
