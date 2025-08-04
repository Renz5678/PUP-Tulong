// 📌 Helper to get JWT token from cookies
function getTokenFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

document.addEventListener("DOMContentLoaded", () => {
  const profileModal = document.getElementById("profile-wrapper");
  const closeBtn = document.getElementById("profile-close");

  document.getElementById("profile-btn")?.addEventListener("click", async () => {
    profileModal.classList.remove("hidden");
    profileModal.classList.add("show");

    const token = getTokenFromCookie();
    if (!token) {
      alert("⚠️ You are not logged in.");
      return;
    }

    try {
      const [profileRes, tasksRes] = await Promise.all([
        fetch("/dashboard/profile", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/dashboard/my_requests", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const profileData = await profileRes.json();
      const myTasks = await tasksRes.json();

      const completedTasks = Array.isArray(myTasks)
        ? myTasks.filter(task => task.completion_status === "completed")
        : [];

      document.getElementById("profile-nickname").textContent = profileData.nickname || "N/A";
      document.getElementById("profile-email").textContent = profileData.email || "N/A";
      document.getElementById("profile-completed").textContent = completedTasks.length;
    } catch (err) {
      console.error("❌ Failed to load profile info:", err);
      alert("⚠️ Failed to load your profile.");
    }
  });

  closeBtn?.addEventListener("click", () => {
    profileModal.classList.add("hidden");
    profileModal.classList.remove("show");
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const notifBtn = document.getElementById('notif-btn');
  const notifDot = document.getElementById('notifDot');
  const notifDropdown = document.getElementById('notif-dropdown');
  const notifList = document.getElementById('notif-list');

  let unseenCount = 0;
  const token = getTokenFromCookie();
  if (!token) return console.warn("⚠️ No token found in cookies");

  // Fetch notifications from backend
  try {
    const res = await fetch("/dashboard/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifications = await res.json();

    if (Array.isArray(notifications) && notifications.length > 0) {
      notifList.innerHTML = notifications.map(n => `
        <div style="padding: 0.5rem 0; border-bottom: 1px solid #555;">
          <p style="margin: 0 0 4px;">${n.message}</p>
          <small style="color: #aaa;">${new Date(n.timestamp).toLocaleString()}</small>
        </div>
      `).join("");

      unseenCount = notifications.filter(n => !n.seen).length;
      if (unseenCount > 0) notifDot.classList.remove("hidden");
    } else {
      notifList.innerHTML = "<p>No notifications yet.</p>";
    }
  } catch (err) {
    console.error("❌ Failed to load notifications:", err);
    notifList.innerHTML = "<p style='color: red;'>Failed to load notifications</p>";
  }

  notifBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle("hidden");

    if (unseenCount > 0) {
      notifDot.classList.add("hidden");
      try {
        await fetch("/dashboard/notifications/mark_seen", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.warn("⚠️ Failed to mark notifications as seen");
      }
    }
  });

  notifDropdown.addEventListener("click", (e) => e.stopPropagation());
  window.addEventListener("click", () => notifDropdown.classList.add("hidden"));
});
