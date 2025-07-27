let requestedTasks = {};

document.addEventListener("DOMContentLoaded", () => {

    
  // Modal controls for task request form
  const formModal = document.getElementById("task-form-overlay");
  const openFormBtn = document.getElementById("open-task-form");
  const closeFormBtn = document.getElementById("close-task-form");

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
    if (e.target === formModal) {
      formModal.classList.remove("show");
    }
  });

  // Fetch user's submitted requests
  fetch("/dashboard/my_requests")
    .then((res) => res.json())
    .then((data) => {
      const taskList = document.getElementById("taskList");

      if (!Array.isArray(data) || data.length === 0) {
        taskList.innerHTML = "<p style='color: #ccc;'>You haven't submitted any requests yet.</p>";
        return;
      }

      requestedTasks = data.reduce((acc, task, index) => {
        const taskId = `task${index + 1}`;
        acc[taskId] = task;
        createTaskListItem(taskId, task);
        return acc;
      }, {});
    })
    .catch((err) => {
      console.error("Failed to load your requests:", err);
    });

  // Navigation highlighting
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // UI button handlers
  document.querySelector(".notification-icon")?.addEventListener("click", () => {
    alert("Notifications clicked!");
  });

  document.querySelector(".profile-section")?.addEventListener("click", () => {
    alert("Profile clicked!");
  });
});

// Create each request item in the list (title only)
function createTaskListItem(taskId, task) {
  const taskList = document.getElementById("taskList");
  const item = document.createElement("div");
  item.className = "task-item";
  item.innerHTML = `<div class="task-title">${task.title}</div>`;
  item.addEventListener("click", () => {
    showTaskDetail(taskId);
  });
  taskList.appendChild(item);
}

// Show details in modal when a request is clicked
function showTaskDetail(taskId) {
  const data = requestedTasks[taskId];
  if (!data) return;

  openTaskDetail({
    username: data.nickname || "Anonymous",
    deadline: data.deadline,
    modality: data.mode,
    payment: data.price || "Negotiable",
    title: data.title,
    description: data.description,
    image: data.image_url || ""
  });
}

// Open task detail modal
function openTaskDetail(taskData) {
  document.getElementById("taskUsername").innerText = taskData.username || "Anonymous";
  document.getElementById("taskDeadlineText").innerText = taskData.deadline || "N/A";
  document.getElementById("taskModalityText").innerText = taskData.modality || "N/A";
  document.getElementById("taskPaymentText").innerText = taskData.payment || "N/A";
  document.getElementById("taskTitle").innerText = taskData.title || "Untitled";
  document.getElementById("taskDescription").innerText = taskData.description || "No description provided.";
  document.getElementById("taskImage").src = taskData.image || "";

  document.getElementById("taskDetailModal").classList.add("active");
}

// Close task detail modal
function closeTaskDetail() {
  document.getElementById("taskDetailModal").classList.remove("active");
}
