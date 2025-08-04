console.log("✅ JS loaded!");

document.addEventListener("DOMContentLoaded", () => {
  let taskCache = null;

  const taskModal = document.getElementById("task-modal");
  const taskModalBody = document.getElementById("modal-body");
  const taskModalClose = document.getElementById("modal-close");

  const formModal = document.getElementById("task-form-modal");
  const openFormBtn = document.getElementById("open-task-form");
  const closeFormBtn = document.getElementById("close-task-form");

  const profileBtn = document.getElementById("profile-btn");

  if (openFormBtn && formModal) {
    openFormBtn.addEventListener("click", () => {
      console.log("Open Task Form button clicked!");
      formModal.classList.add("show");
    });
  }

  if (closeFormBtn && formModal) {
    closeFormBtn.addEventListener("click", () => {
      formModal.classList.remove("show");
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === formModal) formModal.classList.remove("show");
    if (e.target === taskModal) closeModal();
  });

  const modeSelect = document.querySelector('select[name="mode"]');
  const locationWrapper = document.getElementById("location-wrapper");
  const locationInput = locationWrapper.querySelector('input[name="location"]');

  modeSelect.addEventListener("change", () => {
    if (modeSelect.value === "onsite") {
      locationWrapper.style.display = "block";
      locationInput.setAttribute("required", "required");
    } else {
      locationWrapper.style.display = "none";
      locationInput.removeAttribute("required");
    }
  });

  document.getElementById("taskRequestForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    try {
      const response = await fetch("/dashboard/request", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        alert("✅ Task submitted!");
        formModal.classList.remove("show");
        this.reset();
      } else {
        const error = await response.json();
        alert("❌ Failed to submit task:\n" + JSON.stringify(error.detail, null, 2));
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("⚠️ Network error submitting form.");
    }
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");

      const tabId = item.id;
      if (tabId === "tasks-tab") {
        const container = document.getElementById("tasks-container");
        container.innerHTML = "<p style='padding: 1rem; color: #ccc;'>Loading tasks...</p>";

        if (!taskCache) {
          fetch("/dashboard/unclaimed_tasks")
            .then(res => res.json())
            .then(data => {
              taskCache = data;
              renderTasks(data);
            })
            .catch(err => {
              console.error("Error fetching tasks:", err);
              container.innerHTML = "<p style='padding: 1rem; color: red;'>Failed to load tasks.</p>";
            });
        } else {
          renderTasks(taskCache);
        }
      }
    });
  });

  document.getElementById("tasks-tab")?.click(); // ✅ Load tasks immediately

  taskModalClose.addEventListener("click", closeModal);

  function renderTasks(tasks) {
    const container = document.getElementById("tasks-container");
    container.innerHTML = "";

    tasks.forEach(task => {
      const card = document.createElement("div");
      card.className = "task-card";
      card.innerHTML = `
        <div class="task-header">
          <div class="task-avatar">👤</div>
          <div class="task-info">
            <h3>${task.title}</h3>
            <div class="task-author">
              Posted by: <strong>${task.nickname || "Anonymous"}</strong><br />
              <small>${task.email || ""}</small>
            </div>
          </div>
        </div>
        ${task.image_url ? `<img src="${task.image_url}" alt="Task Image" class="task-image" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-top: 0.5rem;">` : ""}
        <div class="task-description">${task.description}</div>
        ${task.topics?.length ? `<ul class="task-list">${task.topics.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
        ${task.tags?.length ? `<div class="task-tags">${task.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>` : ""}
        <div class="deadline"><span class="deadline-label">Deadline:</span> ${task.deadline}</div>
      `;
      card.addEventListener("click", () => openModal(task));
      container.appendChild(card);
    });
  }

  function openModal(task) {
    taskModal.classList.remove("hidden");
    taskModal.classList.add("show");

    taskModalBody.innerHTML = `
      <span class="close" id="modal-close">&times;</span>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <div style="width: 36px; height: 36px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 24px;">${task.title}</h3>
          <p style="color: #ccc; font-size: 14px; margin: 0;">${task.nickname || "Anonymous"}</p>
        </div>
      </div>
      <div style="display: flex; flex-direction: row; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
        <div style="flex: 1 1 300px;">
          <p style="margin: 20px 0; font-size: 18px; line-height: 1.6; color: #eeeeee; white-space: pre-wrap;">
            ${task.description}
          </p>
          ${task.topics?.length ? `<ul style="margin-top: 10px; padding-left: 20px;">${task.topics.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
        </div>
        ${task.image_url ? `
          <div style="flex: 1 1 400px; max-width: 500px;">
            <img src="${task.image_url}" alt="Task Image" style="width: 100%; height: 400px; border-radius: 16px; object-fit: cover; object-position: center;">
          </div>
        ` : ""}
      </div>
      ${task.tags?.length ? `<div class="task-tags" style="margin: 20px 0;">${task.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>` : ""}
      <div style="display: flex; justify-content: flex-start; align-items: center; gap: 20px; margin-top: 20px;">
        <div style="background: #750000; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px;">
          Deadline: ${task.deadline}
        </div>
        <div style="background: #222; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; border: 1px solid #444;">
          ₱${task.price || "Negotiable"} • ${task.mode === "onsite" ? `Onsite: ${task.location || "Not specified"}` : "Online"}
        </div>
        <button id="claim-btn" style="background-color: #6d090b; color: white; font-weight: bold; padding: 10px 20px; border-radius: 50px; border: none; font-size: 16px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <span style="font-size: 18px;">★</span> Claim
        </button>
      </div>
    `;

    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("claim-btn").addEventListener("click", async () => {
      try {
        const res = await fetch(`/dashboard/request/${task.id}/accept`, {
          method: "PUT"
        });

        if (res.ok) {
          alert(`✅ You claimed: ${task.title}`);
          closeModal();
          taskCache = null;
          document.getElementById("tasks-tab")?.click();
        } else {
          const data = await res.json();
          alert(`❌ Failed to claim: ${data.detail || "Unknown error"}`);
        }
      } catch (err) {
        console.error("❌ Error claiming task:", err);
        alert("⚠️ An error occurred while claiming the task.");
      }
    });
  }

  function closeModal() {
    taskModal.classList.remove("show");
    taskModal.classList.add("hidden");
  }

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

  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      const res = await fetch("/logout", {
        method: "GET",
        credentials: "include"
      });

      if (res.ok) {
        window.location.href = "/login";
      } else {
        alert("❌ Failed to logout. Please try again.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("⚠️ Network error while logging out.");
    }
  });

});
