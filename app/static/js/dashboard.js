document.addEventListener("DOMContentLoaded", () => {
  // Handle nav selection
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // Handle profile and notification clicks
  document.getElementById("notif-btn").addEventListener("click", () => alert("Notifications clicked!"));
  document.getElementById("profile-btn").addEventListener("click", () => alert("Profile clicked!"));

  // Load tasks from backend
  fetch("/api/tasks")
    .then(res => res.json())
    .then(data => renderTasks(data))
    .catch(err => console.error("Error fetching tasks:", err));

  // Modal Elements
  const modal = document.getElementById("task-modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

  function openModal(task) {
    modal.classList.remove("hidden");
    modal.classList.add("show");
    modalBody.innerHTML = `
      <span class="close" id="modal-close">&times;</span>
      <h3>${task.title}</h3>
      <p><strong>Posted by:</strong> ${task.nickname || "Anonymous"} (${task.email || ""})</p>
      ${task.image_url ? `<img src="${task.image_url}" alt="Task Image" style="max-width: 100%; border-radius: 8px; margin: 1rem 0;">` : ""}
      <p>${task.description}</p>
      ${task.topics?.length ? `<ul>${task.topics.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
      ${task.tags?.length ? `<div class="task-tags">${task.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>` : ""}
      <p><strong>Deadline:</strong> ${task.deadline}</p>
    `;

    // Re-attach close event after innerHTML change
    document.getElementById("modal-close").addEventListener("click", closeModal);
  }

  function closeModal() {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }

  modalClose.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Render tasks
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
});
