let requestedTasks = {};

document.addEventListener("DOMContentLoaded", () => {
  // Hide task container initially
  const taskContainer = document.getElementById("taskContainer");
  taskContainer.classList.add("hidden");

  // Modal controls for task request form
  const formModal = document.getElementById("task-form-overlay");
  const openFormBtn = document.getElementById("open-task-form");
  const closeFormBtn = document.getElementById("close-task-form");

  if (openFormBtn && formModal) {
    openFormBtn.addEventListener("click", () => {
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
});

// Create each request item in the list (title only)
function createTaskListItem(taskId, task) {
  const taskList = document.getElementById("taskList");
  const item = document.createElement("div");
  item.className = "task-item";
  item.innerHTML = `
    <div class="task-title">${task.title}</div>
    <div class="task-deadline">${task.deadline}</div>
  `;
  item.addEventListener("click", () => {
    showTaskDetail(taskId);
    document.querySelectorAll(".task-item").forEach(btn => btn.classList.remove("active"));
    item.classList.add("active");
  });
  taskList.appendChild(item);
}

// Show details in the container when a request is clicked
function showTaskDetail(taskId) {
  const data = requestedTasks[taskId];
  if (!data) return;

  // Show task container
  const taskContainer = document.getElementById("taskContainer");
  taskContainer.classList.remove("hidden");

  // Populate task details
  document.getElementById("injectedTitle").innerText = data.title || "Untitled";
  document.getElementById("injectedPoster").innerText = data.nickname || "Anonymous";
  document.getElementById("injectedDescription").innerText = data.description || "No description provided.";
  document.getElementById("injectedDeadline").innerText = data.deadline || "N/A";
  document.getElementById("injectedModality").innerText = data.mode || "N/A";
  document.getElementById("injectedPayment").innerText = data.price || "N/A";

  const imageElement = document.getElementById("taskImage");
  if (data.image_url) {
    imageElement.src = data.image_url;
    imageElement.style.display = "block";
  } else {
    imageElement.src = "";
    imageElement.style.display = "none";
  }

  // Show/hide finish button based on whether the task is claimed
  const finishButton = document.querySelector(".finish");
  if (data.claimed_by) {
    finishButton.style.display = "inline-block";
  } else {
    finishButton.style.display = "none";
  }

    const rateButton = document.querySelector(".rate-helper");
  if (data.claimed_by) {
    rateButton.style.display = "inline-block";
  } else {
    rateButton.style.display = "none";
  }

  document.querySelector(".cancel").onclick = async () => {
  const data = requestedTasks[taskId];
  if (!data || !confirm("Are you sure you want to cancel this request?")) return;

  try {
    const res = await fetch(`/dashboard/request/${data.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("✅ Request cancelled successfully.");
      // Remove from cache and UI
      delete requestedTasks[taskId];
      document.getElementById("taskContainer").classList.add("hidden");
      document.getElementById("taskList").innerHTML = "";
      // Optionally: reload requests from server again
      location.reload(); // or call fetch again to update list
    } else {
      const error = await res.json();
      alert(`❌ Failed to cancel: ${error.detail || "Unknown error"}`);
    }
  } catch (err) {
    console.error("Cancel error:", err);
    alert("⚠️ Network error. Please try again.");
  }
};
}
