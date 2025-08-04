let claimedTasks = {};

document.addEventListener("DOMContentLoaded", () => {
  const taskList = document.getElementById('taskList');

  // ✅ Load claimed tasks
  fetch('/dashboard/claimed_tasks')
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        taskList.innerHTML = "<p style='color: #ccc;'>You haven't claimed any tasks yet.</p>";
        return;
      }

      claimedTasks = data.reduce((acc, task, index) => {
        const taskId = `task${index + 1}`;
        acc[taskId] = task;
        const item = document.createElement('div');
        item.className = 'task-item';
        item.innerHTML = `
          <div class="task-title">${task.title || 'No Title'}</div>
          <div class="task-deadline">${task.deadline || 'No Deadline'}</div>
        `;
        item.addEventListener('click', () => showTaskDetail(taskId, item));
        taskList.appendChild(item);
        return acc;
      }, {});
    })
    .catch(err => {
      console.error('❌ Failed to load claimed tasks:', err);
    });

  // 🧍 Profile modal
  const profileBtn = document.getElementById("profile-btn");
  profileBtn?.addEventListener("click", async () => {
    const modal = document.getElementById("profile-modal");
    modal.classList.remove("hidden");
    modal.classList.add("show");

    try {
      const [profileRes, tasksRes] = await Promise.all([
        fetch("/dashboard/profile"),
        fetch("/dashboard/my_requests")
      ]);

      const profileData = await profileRes.json();
      const myTasks = await tasksRes.json();
      const completed = Array.isArray(myTasks) ? myTasks.filter(t => t.completion_status === "completed") : [];

      document.getElementById("profile-nickname").textContent = profileData.nickname || "N/A";
      document.getElementById("profile-email").textContent = profileData.email || "N/A";
      document.getElementById("profile-completed").textContent = completed.length;
    } catch (err) {
      console.error("❌ Failed to load profile:", err);
      alert("⚠️ Failed to load your profile.");
    }
  });

  // 🚪 Logout
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    try {
      const res = await fetch("/logout", { method: "GET", credentials: "include" });
      if (res.ok) {
        window.location.href = "/login";
      } else {
        alert("❌ Logout failed.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("⚠️ Network error during logout.");
    }
  });

  // 🧭 Nav active states
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // 🔔 Notification & 👤 Profile shortcut (optional alerts)
});

// 🔍 Show task detail
function showTaskDetail(taskId, clickedElement) {
  const data = claimedTasks[taskId];
  const modal = document.getElementById('taskDetailModal');
  if (!data) return;

  // Highlight
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('active'));
  clickedElement.classList.add('active');

  // Populate detail pane
  modal.classList.remove('completed');
  modal.classList.add('active');
  document.getElementById('modalityLabel').textContent = 'Modality:';
  document.getElementById('taskUsername').textContent = data.username || data.nickname || 'Anonymous';
  document.getElementById('taskTitle').textContent = data.title || 'No Title';
  document.getElementById('taskDescription').innerHTML = data.description || '';
  document.getElementById('taskImage').src = data.image || data.image_url || '/static/images/fallback.jpg';
  document.getElementById('taskDeadlineText').textContent = data.deadline || 'N/A';
  document.getElementById('taskModalityText').textContent = data.modality || data.mode || 'N/A';
  document.getElementById('taskPaymentText').textContent = `${data.payment || data.price || '₱0'} (Negotiable)`;

  // Cancel button
  const cancelBtn = document.querySelector('.cancel-btn');
  cancelBtn.onclick = () => cancelClaimedTask(data.id);
}

// ❌ Close task detail
function closeTaskDetail() {
  const modal = document.getElementById('taskDetailModal');
  modal.classList.remove('active', 'completed');
  document.querySelectorAll('.task-item').forEach(item => item.classList.remove('active'));
}

// 🔄 Cancel claimed task
async function cancelClaimedTask(taskId) {
  const confirmed = confirm("Are you sure you want to cancel this claimed task?");
  if (!confirmed) return;

  try {
    const res = await fetch(`/dashboard/request/${taskId}/cancel`, { method: 'PUT' });
    if (res.ok) {
      alert("Task successfully cancelled.");
      closeTaskDetail();
      location.reload();
    } else {
      const data = await res.json();
      alert("❌ Cancel failed: " + (data.detail || "Unknown error"));
    }
  } catch (err) {
    console.error("Cancel error:", err);
    alert("An error occurred.");
  }
}
