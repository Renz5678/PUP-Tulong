let requestedTasks = {};
let completedTasks = {}; // Add storage for completed tasks

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

  // Fetch user's submitted requests (exclude completed ones)
  fetch("/dashboard/my_requests")
    .then((res) => res.json())
    .then((data) => {
      const taskList = document.getElementById("taskList");
      const completedTaskList = document.getElementById("completed_taskList");

      if (!Array.isArray(data) || data.length === 0) {
        taskList.innerHTML = "<p style='color: #ccc;'>You haven't submitted any requests yet.</p>";
        completedTaskList.innerHTML = "<p style='color: #ccc;'>No completed requests.</p>";
        return;
      }

      // Separate active and completed tasks
      const activeTasks = data.filter(task => 
        task.completion_status !== 'accepted' && task.completion_status !== 'completed'
      );
      const completedTasksData = data.filter(task => 
        task.completion_status === 'accepted' || task.completion_status === 'completed'
      );

      // Display active tasks
      if (activeTasks.length === 0) {
        taskList.innerHTML = "<p style='color: #ccc;'>No active requests.</p>";
      } else {
        requestedTasks = activeTasks.reduce((acc, task, index) => {
          const taskId = `task${index + 1}`;
          acc[taskId] = task;
          createTaskListItem(taskId, task, taskList, false); // false = not completed
          return acc;
        }, {});
      }

      // Display completed tasks with full functionality
      if (completedTasksData.length === 0) {
        completedTaskList.innerHTML = "<p style='color: #ccc;'>No completed requests.</p>";
      } else {
        completedTasks = completedTasksData.reduce((acc, task, index) => {
          const taskId = `completed_task${index + 1}`;
          acc[taskId] = task;
          createTaskListItem(taskId, task, completedTaskList, true); // true = completed
          return acc;
        }, {});
      }
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
});

// Enhanced createTaskListItem function that works for both active and completed tasks
function createTaskListItem(taskId, task, container, isCompleted = false) {
  const item = document.createElement("div");
  item.className = isCompleted ? "task-item completed" : "task-item";
  item.innerHTML = `
    <div class="task-title">${task.title}</div>
  `;
  
  if (isCompleted) {
    item.style.opacity = "0.7";
    item.style.backgroundColor = "#FFB222";
    item.style.textAlign = "left";
  }
  
  item.addEventListener("click", () => {
    console.log("Task item clicked:", taskId);
    
    // Try to hide noContent div immediately when clicked
    hideNoContentDiv();
    
    // Then show task details
    showTaskDetail(taskId, isCompleted);
    
    // Update active states
    document.querySelectorAll(".task-item").forEach(btn => btn.classList.remove("active"));
    item.classList.add("active");
  });
  container.appendChild(item);
}

// Dedicated function to hide noContent div
function hideNoContentDiv() {
  console.log("Attempting to hide noContent div...");
  
  // Try all possible selectors for the noContent div
  const selectors = [
    "#noContent",
    ".noContent", 
    "#nocontent",
    "#NoContent",
    "#no-content",
    ".no-content",
    "[class*='noContent']",
    "[id*='noContent']"
  ];
  
  let found = false;
  
  selectors.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Found element with selector: ${selector}`, element);
      element.style.display = "none";
      element.style.visibility = "hidden";
      element.classList.add("hidden");
      found = true;
    }
  });
  
  if (!found) {
    console.warn("Could not find noContent div with any selector!");
    // List all elements in the main container to help debug
    const mainContainer = document.querySelector("main") || document.querySelector(".main-container");
    if (mainContainer) {
      console.log("Elements in main container:", mainContainer.children);
    }
  }
}

// Enhanced showTaskDetail function that handles both active and completed tasks
// Enhanced showTaskDetail function that handles both active and completed tasks
// Enhanced showTaskDetail function that handles both active and completed tasks
function showTaskDetail(taskId, isCompleted = false) {
  const data = isCompleted ? completedTasks[taskId] : requestedTasks[taskId];
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

  // Display helper information if someone has accepted the task
  displayHelperInfo(data);

  // Buttons - Fixed selectors with proper class notation
  const finishButton = document.querySelector(".finish");
  const rateButton = document.querySelector(".rate-helper");
  const cancelButton = document.querySelector(".cancel");

  // Hide all buttons initially
  if (finishButton) finishButton.style.display = "none";
  if (cancelButton) cancelButton.style.display = "none";
  if (rateButton) rateButton.style.display = "none";

  // Button visibility logic based on your requirements
  if (isCompleted) {
    // COMPLETED REQUESTS: Only show rate button
    if (rateButton && data.accepted_by) {
      rateButton.style.display = "inline-block";
      rateButton.textContent = "Rate Helper";
      rateButton.onclick = () => showRatingForm(data);
    }
  } else {
    // PENDING/ACTIVE REQUESTS
    // Cancel button always appears in pending requests
    if (cancelButton) {
      cancelButton.style.display = "inline-block";
      cancelButton.onclick = async () => {
        if (!confirm("Are you sure you want to cancel this request?")) return;
        try {
          const res = await fetch(`/dashboard/request/${data.id}`, { method: "DELETE" });
          if (res.ok) {
            alert("✅ Request cancelled successfully.");
            delete requestedTasks[taskId];
            document.getElementById("taskContainer").classList.add("hidden");
            document.getElementById("taskList").innerHTML = "";
            location.reload();
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

    // Finish button appears only if someone has claimed the task
    if (data.accepted_by && finishButton) {
      if (data.completion_status === "waiting_confirmation") {
        finishButton.style.display = "inline-block";
        finishButton.textContent = "Confirm Completion";
        finishButton.onclick = () => confirmTaskCompletion(data.id);
      } else if (data.completion_status === "in_progress") {
        finishButton.style.display = "inline-block";
        finishButton.textContent = "Mark as Complete";
        finishButton.onclick = () => confirmTaskCompletion(data.id);
      }
    }
  }
}

// New function to display helper information
async function displayHelperInfo(taskData) {
  // Find or create a helper info container within the task-details section
  let helperInfoContainer = document.getElementById("helper-info-container");
  
  if (!helperInfoContainer) {
    // Create the helper info container if it doesn't exist
    helperInfoContainer = document.createElement("div");
    helperInfoContainer.id = "helper-info-container";
    helperInfoContainer.style.cssText = `
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      display: none;
    `;
    
    // Insert it after the description but before the image
    const taskDetails = document.querySelector(".task-details");
    const imageElement = document.getElementById("taskImage");
    
    if (taskDetails && imageElement) {
      taskDetails.insertBefore(helperInfoContainer, imageElement);
    } else if (taskDetails) {
      // If no image, insert before the buttons
      const buttonsDiv = document.querySelector(".buttons");
      if (buttonsDiv) {
        taskDetails.insertBefore(helperInfoContainer, buttonsDiv);
      } else {
        taskDetails.appendChild(helperInfoContainer);
      }
    }
  }

  // Clear previous content
  helperInfoContainer.innerHTML = "";
  helperInfoContainer.style.display = "none";

  // If someone has accepted the task, fetch and display their info
  if (taskData.accepted_by) {
    try {
      console.log("Fetching helper info for user ID:", taskData.accepted_by);
      
      // Show loading state
      helperInfoContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
          <div style="font-weight: bold; color: #333;">👤 Helper Information</div>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center;">
            ⏳
          </div>
          <div>
            <div style="font-weight: 600; color: #333;">Loading helper info...</div>
            <div style="font-size: 0.9em; color: #666;">Please wait</div>
          </div>
        </div>
      `;
      helperInfoContainer.style.display = "block";

      // Fetch helper information
      const response = await fetch(`/dashboard/user/${taskData.accepted_by}`);
      
      if (response.ok) {
        const helperData = await response.json();
        console.log("Helper data received:", helperData);
        
        // Display helper information
        helperInfoContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <div style="font-weight: bold; color: #333;">👤 Helper Information</div>
            <div style="font-size: 0.8em; color: #28a745; margin-left: auto;">
              ${getTaskStatusText(taskData.completion_status)}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #FFB222; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem;">
              ${(helperData.nickname || helperData.username || 'H').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight: 600; color: #333; font-size: 1rem;">
                ${helperData.nickname || helperData.username || 'Helper'}
              </div>
              <div style="font-size: 0.9em; color: #666;">
                @${helperData.username || 'anonymous'} ${helperData.email ? `• ${helperData.email}` : ''}
              </div>
            </div>
          </div>
        `;
        helperInfoContainer.style.display = "block";
      } else {
        console.warn("Failed to fetch helper info:", response.status);
        // Fallback display if user info fetch fails
        helperInfoContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
            <div style="font-weight: bold; color: #333;">👤 Helper Information</div>
            <div style="font-size: 0.8em; color: #28a745; margin-left: auto;">
              ${getTaskStatusText(taskData.completion_status)}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #FFB222; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              H
            </div>
            <div>
              <div style="font-weight: 600; color: #333;">Helper (ID: ${taskData.accepted_by})</div>
              <div style="font-size: 0.9em; color: #666;">Details unavailable</div>
            </div>
          </div>
        `;
        helperInfoContainer.style.display = "block";
      }
    } catch (error) {
      console.error("Error fetching helper info:", error);
      
      // Show error state
      helperInfoContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
          <div style="font-weight: bold; color: #333;">👤 Helper Information</div>
          <div style="font-size: 0.8em; color: #28a745; margin-left: auto;">
            ${getTaskStatusText(taskData.completion_status)}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #6c757d; display: flex; align-items: center; justify-content: center; color: white;">
            ⚠️
          </div>
          <div>
            <div style="font-weight: 600; color: #333;">Helper Information</div>
            <div style="font-size: 0.9em; color: #666;">Unable to load details</div>
          </div>
        </div>
      `;
      helperInfoContainer.style.display = "block";
    }
  }
}

// Helper function to get user-friendly status text
function getTaskStatusText(status) {
  const statusMap = {
    'pending': '📋 Pending',
    'in_progress': '🔄 In Progress',
    'waiting_confirmation': '⏳ Awaiting Confirmation',
    'completed': '✅ Completed',
    'accepted': '✅ Task Completed',
    'rejected': '❌ Completion Rejected'
  };
  
  return statusMap[status] || '📋 Status Unknown';
}

// Update hideTaskDetails function to hide helper info
function hideTaskDetails() {
  const taskContainer = document.getElementById("taskContainer");
  const noContentDiv = document.querySelector(".noContent");
  const helperInfoContainer = document.getElementById("helper-info-container");
  
  if (taskContainer) {
    taskContainer.classList.add("hidden");
  }
  
  if (noContentDiv) {
    noContentDiv.style.display = "block";
  }

  if (helperInfoContainer) {
    helperInfoContainer.style.display = "none";
  }
  
  // Remove active state from all task items
  document.querySelectorAll(".task-item").forEach(item => item.classList.remove("active"));
}

// ✅ Confirm task completion (for task owners)
async function confirmTaskCompletion(taskId) {
  const decision = confirm("Do you confirm that this task has been completed satisfactorily?\n\nOK = Accept completion\nCancel = Reject completion");
  
  if (decision === null) return; // User cancelled the dialog
  
  const confirmationDecision = decision ? "accepted" : "rejected";
  
  try {
    const formData = new FormData();
    formData.append('decision', confirmationDecision);
    
    const res = await fetch(`/dashboard/request/${taskId}/confirm_completion`, {
      method: "PUT",
      body: formData,
      credentials: 'include'
    });
    
    if (res.ok) {
      const result = await res.json();
      
      if (confirmationDecision === "accepted") {
        // Send final completion notification
        await sendTaskCompletedNotification(taskId);
        alert("✅ Task completion confirmed! The task has been moved to your completed requests.");
      } else {
        alert("❌ Task completion rejected. The helper has been notified to review the work.");
      }
      
      // Remove task from active list and refresh
      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      const error = await res.json();
      alert(`❌ Failed to confirm completion: ${error.detail || "Unknown error"}`);
    }
  } catch (err) {
    console.error("Confirmation error:", err);
    alert("⚠️ Network error. Please try again.");
  }
}

// 🔔 Send final completion notification
async function sendTaskCompletedNotification(taskId) {
  try {
    const task = Object.values(requestedTasks).find(t => t.id === taskId);
    if (!task) return;

    const notificationPayload = {
      recipient_id: task.accepted_by, // Notify the helper
      type: 'task_completion_confirmed',
      title: 'Task Completion Confirmed! 🎉',
      message: `Great news! Your completion of "${task.title}" has been confirmed and accepted.`,
      task_id: taskId,
      task_title: task.title || 'Untitled Task',
      priority: 'high',
      read_status: false,
      created_at: new Date().toISOString()
    };

    await sendNotification(notificationPayload);
  } catch (err) {
    console.error('Error sending completion confirmation notification:', err);
  }
}

// 🌟 Show rating form modal
function showRatingForm(taskData) {
  // Create modal HTML
  const ratingModal = document.createElement('div');
  ratingModal.id = 'rating-modal';
  ratingModal.className = 'rating-modal-overlay';
  ratingModal.innerHTML = `
    <div class="rating-modal-content">
      <span class="rating-close-btn" onclick="closeRatingForm()">&times;</span>
      <h2>⭐ Rate Helper</h2>
      <hr style="margin: 1rem 0; border: none; height: 1px; background: #fff;">
      
      <div style="margin-bottom: 1.5rem;">
        <h3>${taskData.title}</h3>
        <p style="color: #fff;">Rate your experience with the helper for this task</p>
      </div>

      <form id="ratingForm">
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Rating:</label>
          <div class="star-rating">
            <input type="radio" id="star5" name="rating" value="5" required>
            <label for="star5" title="5 stars">★</label>
            <input type="radio" id="star4" name="rating" value="4">
            <label for="star4" title="4 stars">★</label>
            <input type="radio" id="star3" name="rating" value="3">
            <label for="star3" title="3 stars">★</label>
            <input type="radio" id="star2" name="rating" value="2">
            <label for="star2" title="2 stars">★</label>
            <input type="radio" id="star1" name="rating" value="1">
            <label for="star1" title="1 star">★</label>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label for="feedback" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Feedback (Optional):</label>
          <textarea 
            id="feedback" 
            name="feedback" 
            rows="4" 
            placeholder="Share your experience with this helper..."
            style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"
          ></textarea>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button type="button" onclick="closeRatingForm()" style="padding: 0.75rem 1.5rem; background: #fff; border: none; border-radius: 4px; cursor: pointer; color: #6D090B;">Cancel</button>
          <button type="submit" style="padding: 0.75rem 1.5rem; background: #FFB222; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Submit Rating</button>
        </div>
      </form>
    </div>
  `;

  // Add styles for the rating modal
  const style = document.createElement('style');
  style.textContent = `
    .rating-modal-overlay {
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .rating-modal-content {
      background: #6D090B;
      padding: 2rem;
      border-radius: 2.3rem;
      color: #fff;
      width: 90%;
      max-width: 500px;
      position: relative;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .rating-close-btn {
      position: absolute;
      top: 1rem;
      right: 1.25rem;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      border: none;
      background: none;
    }

    .rating-close-btn:hover {
      color: #333;
    }

    .star-rating {
      display: flex;
      flex-direction: row-reverse;
      justify-content: flex-end;
      gap: 0.25rem;
    }

    .star-rating input[type="radio"] {
      display: none;
    }

    .star-rating label {
      font-size: 2rem;
      color: #ddd;
      cursor: pointer;
      transition: color 0.2s;
    }

    .star-rating label:hover,
    .star-rating label:hover ~ label,
    .star-rating input[type="radio"]:checked ~ label {
      color: #FFB222;
    }
  `;

  // Add the style and modal to the document
  document.head.appendChild(style);
  document.body.appendChild(ratingModal);

  // Handle form submission
document.getElementById('ratingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const rating = formData.get('rating');
  const feedback = formData.get('feedback');

  console.log('Form data extracted:', { rating, feedback, taskData: taskData.id });

  try {
    // Get user email from profile endpoint
    console.log('Getting user email from profile...');
    let userEmail = null;
    
    try {
      const profileResponse = await fetch('/dashboard/profile', {
        credentials: 'include'
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        userEmail = profileData.email;
        console.log('Got user email from profile:', userEmail);
      } else {
        console.error('Profile request failed:', profileResponse.status);
      }
    } catch (profileErr) {
      console.error('Error fetching profile:', profileErr);
    }

    // Fallback: try to get from page element
    if (!userEmail) {
      const profileEmailElement = document.getElementById('profile-email');
      if (profileEmailElement && profileEmailElement.textContent !== 'Loading...') {
        userEmail = profileEmailElement.textContent.trim();
        console.log('Got email from page element:', userEmail);
      }
    }

    if (!userEmail) {
      alert('❌ Could not determine user email. Please refresh the page and try again.');
      return;
    }

    // Prepare the request payload
    const requestPayload = {
      task_id: taskData.id,
      helper_id: taskData.accepted_by,
      rating: parseInt(rating),
      feedback: feedback || "",
      user_email: userEmail
    };

    console.log('Request payload:', requestPayload);
    console.log('Request payload as JSON:', JSON.stringify(requestPayload));

    // Submit the rating
    console.log('Submitting rating to /dashboard/rate_helper...');
    
    const response = await fetch('/dashboard/rate_helper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestPayload)
    });

    console.log('Response received:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response text first for debugging
    const responseText = await response.text();
    console.log('- Raw response text:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('Rating submitted successfully:', result);
        alert('✅ Rating submitted successfully!');
        closeRatingForm();
        location.reload();
      } catch (parseErr) {
        console.log('Response is OK but not JSON:', responseText);
        alert('✅ Rating submitted successfully!');
        closeRatingForm();
        location.reload();
      }
    } else {
      console.error('Rating submission failed:');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
      
      try {
        const error = JSON.parse(responseText);
        alert(`❌ Failed to submit rating: ${error.error || error.detail || 'Unknown error'}`);
      } catch (parseErr) {
        alert(`❌ Failed to submit rating: ${responseText || 'Server error'}`);
      }
    }
  } catch (err) {
    console.error('Rating submission network error:', err);
    alert('⚠️ Network error. Please check your connection and try again.');
  }
});

  // Close modal when clicking outside
  ratingModal.addEventListener('click', (e) => {
    if (e.target === ratingModal) {
      closeRatingForm();
    }
  });
}

// Close rating form modal
function closeRatingForm() {
  const modal = document.getElementById('rating-modal');
  if (modal) {
    modal.remove();
  }
}
async function sendNotification(notificationData) {
  try {
    const notificationRes = await fetch('/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });

    if (!notificationRes.ok) {
      const errorText = await notificationRes.text();
      console.error('Failed to send notification:', errorText);
      throw new Error(`Notification failed: ${errorText}`);
    } else {
      console.log('✅ Notification sent successfully:', notificationData.type);
      return await notificationRes.json();
    }

  } catch (err) {
    console.error('Error sending notification:', err);
    throw err;
  }
}