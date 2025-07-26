  document.addEventListener("DOMContentLoaded", () => {
    let taskCache = null;
    const taskModal = document.getElementById("task-modal");
    const taskModalBody = document.getElementById("modal-body");
    const taskModalClose = document.getElementById("modal-close");

    const formModal = document.getElementById("task-form-modal");
    const openFormBtn = document.getElementById("open-task-form");
    const closeFormBtn = document.getElementById("close-task-form");

    // Open/Close Form Modal
    openFormBtn.addEventListener("click", () => formModal.classList.add("show"));
    closeFormBtn.addEventListener("click", () => formModal.classList.remove("show"));

    window.addEventListener("click", (e) => {
      if (e.target === formModal) formModal.classList.remove("show");
      if (e.target === taskModal) closeModal();
    });

    // Handle Form Submission
document.getElementById("taskRequestForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(this); // includes image, text, etc.

  const response = await fetch("/dashboard/request", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    alert("✅ Task submitted!");
    document.getElementById("task-form-modal").classList.remove("show");
    this.reset();
  } else {
    const error = await response.json();
    alert(`❌ Failed: ${error.detail || "Unknown error"}`);
  }
});

    // Tab navigation
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

    // Auto-load tasks tab on page load
    document.getElementById("tasks-tab").click();

    // Top buttons
    document.getElementById("notif-btn")?.addEventListener("click", () => alert("Notifications clicked!"));
    document.getElementById("profile-btn")?.addEventListener("click", () => alert("Profile clicked!"));

    // Modal Close Button
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
              <img src="${task.image_url}" alt="Task Image" style="
                width: 100%;
                height: 400px;
                border-radius: 16px;
                object-fit: cover;
                object-position: center;
              ">
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

          <button id="claim-btn" style="
            background-color: #6d090b;
            color: white;
            font-weight: bold;
            padding: 10px 20px;
            border-radius: 50px;
            border: none;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
          ">
            <span style="font-size: 18px;">★</span> Claim
          </button>
        </div>
      `;

      // Modal close (injected span)
      document.getElementById("modal-close").addEventListener("click", closeModal);

      // Claim button logic
      document.getElementById("claim-btn").addEventListener("click", async () => {
        console.log("🧪 Claiming task:", task);
        try {
          const res = await fetch(`/dashboard/request/${task.id}/accept`, {
            method: "PUT"
          });

          if (res.ok) {
            alert(`✅ You claimed: ${task.title}`);
            closeModal();
            taskCache = null;
            document.getElementById("tasks-tab").click();
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
  });

