document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.replace("/", "") || "dashboard";

  // Highlight current nav tab
  document.querySelectorAll(".nav-item").forEach(item => {
    const tab = item.getAttribute("data-tab");
    if (tab === currentPath) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }

    item.addEventListener("click", () => {
      window.location.href = `/${tab}`;
    });
  });

  // Notifications and profile click handlers
  const notifBtn = document.getElementById("notif-btn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => alert("Notifications clicked!"));
  }

  const profileBtn = document.getElementById("profile-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => alert("Profile clicked!"));
  }

  // Load tasks dynamically
  const container = document.getElementById("tasks-container");
  if (container) {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => renderTasks(data))
      .catch(err => console.error("Error fetching tasks:", err));

    function renderTasks(tasks) {
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
  <div class="task-details">
    <div class="task-description">${task.description}</div>
    ${task.image_url ? `<img class="task-image" src="${task.image_url}" alt="task image" />` : ""}
    ${task.tags?.length ? `<div class="task-tags">${task.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>` : ""}
    <div class="deadline"><span class="deadline-label">Deadline:</span> ${task.deadline}</div>
    <button class="claim-btn">Claim</button>
  </div>
`;

        // Click to expand/collapse (excluding the claim button)
        card.addEventListener("click", (e) => {
  console.log("Card clicked:", card); // ✅ ADD THIS
  if (!e.target.classList.contains("claim-btn")) {
    card.classList.toggle("expanded");

    if (card.classList.contains("expanded")) {
      setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }
});


        container.appendChild(card);
      });
    }
  }
});
