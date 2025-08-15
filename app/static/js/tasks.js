let claimedTasks = {};

document.addEventListener("DOMContentLoaded", () => {
  const taskList = document.getElementById('taskList');
  const completedTaskList = document.getElementById('completedTaskList'); // Keep this for backward compatibility

  // ✅ Load claimed tasks (both active and completed)
  fetch('/dashboard/claimed_tasks')
    .then(res => res.json())
    .then(allData => {
      // Also fetch completed tasks separately
      return Promise.all([
        Promise.resolve(allData),
        fetch('/dashboard/completed_tasks').then(res => res.json()).catch(() => [])
      ]);
    })
    .then(([allClaimedData, separateCompletedData]) => {
      // Filter active tasks (exclude completed/accepted ones)
      const activeData = allClaimedData.filter(task => 
        task.completion_status !== 'accepted' && 
        task.completion_status !== 'completed'
      );

      // Get completed tasks (from both sources)
      const completedFromClaimed = allClaimedData.filter(task => 
        task.completion_status === 'accepted' || 
        task.completion_status === 'completed'
      );
      const allCompletedData = [...completedFromClaimed, ...separateCompletedData];
      
      // Remove duplicates from completed tasks
      const uniqueCompletedData = allCompletedData.filter((task, index, self) => 
        index === self.findIndex(t => t.id === task.id)
      );

      // Combine all tasks for live view
      const allTasksForLiveView = [...activeData, ...uniqueCompletedData];

      // Handle active tasks in main task list
      if (!activeData || activeData.length === 0) {
        taskList.innerHTML = "<p style='color: #ccc;'>You haven't claimed any active tasks yet.</p>";
      } else {
        // Process active tasks and add them to claimedTasks object
        claimedTasks = activeData.reduce((acc, task, index) => {
          const taskId = `task${index + 1}`;
          acc[taskId] = task;
          const item = document.createElement('div');
          item.className = 'task-item';
          item.innerHTML = `
            <div class="task-title">${task.title || 'No Title'}</div>
          `;
          item.addEventListener('click', () => showTaskDetail(taskId, item));
          taskList.appendChild(item);
          return acc;
        }, {});
      }

      // Handle completed tasks in separate section with live view capability
      if (completedTaskList) {
        if (!uniqueCompletedData || uniqueCompletedData.length === 0) {
          completedTaskList.innerHTML = "<p style='color: #ccc;'>No completed tasks yet.</p>";
        } else {
          completedTaskList.innerHTML = ''; // Clear existing content
          
          uniqueCompletedData.forEach((task, index) => {
            // Add completed tasks to claimedTasks object for live view access
            const completedTaskId = `completed_task${index + 1}`;
            claimedTasks[completedTaskId] = task;
            
            const item = document.createElement('div');
            item.className = 'task-item completed clickable-completed';
            item.innerHTML = `
              <div class="task-title">${task.title || 'No Title'}</div>
            `;
            
            // Enhanced styling for interactive completed tasks
            item.style.opacity = '0.9';
            item.style.backgroundColor = '#FFB222';
            item.style.borderLeft = '4px solid #6D090B';
            item.style.cursor = 'pointer';
            item.style.transition = 'all 0.3s ease';
            item.style.position = 'relative';
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
              item.style.backgroundColor = '#dcfce7';
              item.style.transform = 'translateX(2px)';
            });
            
            item.addEventListener('mouseleave', () => {
              item.style.backgroundColor = '#f0fdf4';
              item.style.transform = 'translateX(0px)';
            });
            
            // Make completed tasks clickable for live view
            item.addEventListener('click', () => showTaskDetail(completedTaskId, item));
            
            completedTaskList.appendChild(item);
          });
        }
      }
    })
    .catch(err => {
      console.error('❌ Failed to load claimed tasks:', err);
      taskList.innerHTML = "<p style='color: #ff6b6b;'>Failed to load tasks. Please refresh the page.</p>";
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

// 📊 Get task status text
function getTaskStatusText(task) {
  if (task.completion_status === 'accepted') {
    return '<span style="color: #22c55e; font-weight: bold;">✅ Confirmed Complete</span>';
  } else if (task.completion_status === 'completed') {
    return '<span style="color: #22c55e; font-weight: bold;">✅ Completed</span>';
  } else if (task.completion_status === 'waiting_confirmation') {
    return '<span style="color: #f59e0b;">⏳ Awaiting Confirmation</span>';
  } else if (task.completion_status === 'rejected') {
    return '<span style="color: #ef4444;">❌ Completion Rejected</span>';
  } else if (!task.completion_status) {
    return '<span style="color: #3b82f6;">📋 In Progress</span>';
  } else {
    return '<span style="color: #6b7280;">Status: ' + task.completion_status + '</span>';
  }
}

// 🔍 Show task detail
function showTaskDetail(taskId, clickedElement) {
  const data = claimedTasks[taskId];
  const modal = document.getElementById('taskDetailModal');
  if (!data) return;

  const isCompleted = data.completion_status === 'accepted' || data.completion_status === 'completed';

  // Highlight
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('active'));
  clickedElement.classList.add('active');

  // Populate detail pane
  modal.classList.remove('completed');
  if (isCompleted) {
    modal.classList.add('completed');
  }
  modal.classList.add('active');
  
  document.getElementById('modalityLabel').textContent = 'Modality:';
  document.getElementById('taskUsername').textContent = data.username || data.nickname || 'Anonymous';
  document.getElementById('taskTitle').textContent = data.title || 'No Title';
  document.getElementById('taskDescription').innerHTML = data.description || '';
  document.getElementById('taskImage').src = data.image || data.image_url || '/static/images/fallback.jpg';
  document.getElementById('taskDeadlineText').textContent = data.deadline || 'N/A';
  document.getElementById('taskModalityText').textContent = data.modality || data.mode || 'N/A';
  document.getElementById('taskPaymentText').textContent = `${data.payment || data.price || '₱0'} (Negotiable)`;

  // Handle buttons based on completion status
  const cancelBtn = document.querySelector('.cancel-btn');
  const completeBtn = document.querySelector('.complete-btn');

  if (isCompleted) {
    // For completed tasks, show read-only interface
    if (cancelBtn) {
      cancelBtn.style.display = 'none'; // Hide cancel button for completed tasks
    }
    if (completeBtn) {
      completeBtn.textContent = data.completion_status === 'accepted' ? 'Confirmed Complete ✅' : 'Task Completed ✅';
      completeBtn.disabled = true;
      completeBtn.style.opacity = '0.6';
      completeBtn.style.cursor = 'not-allowed';
      completeBtn.style.backgroundColor = '#22c55e';
      completeBtn.style.color = 'white';
    }
    
    // Add a subtle indicator that this is a completed task view
    const taskHeader = modal.querySelector('.task-header');
    if (taskHeader && !taskHeader.querySelector('.completed-indicator')) {
      const completedIndicator = document.createElement('div');
      completedIndicator.className = 'completed-indicator';
      completedIndicator.innerHTML = `
        <div style="background: #22c55e; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; display: inline-block; margin-top: 10px;">
          ✅ TASK COMPLETED
        </div>
      `;
      taskHeader.appendChild(completedIndicator);
    }
  } else {
    // For active tasks, show normal interactive buttons
    if (cancelBtn) {
      cancelBtn.style.display = 'block';
      cancelBtn.onclick = () => cancelClaimedTask(data.id);
    }
    if (completeBtn) {
      completeBtn.textContent = 'Mark as Complete';
      completeBtn.disabled = false;
      completeBtn.style.opacity = '1';
      completeBtn.style.cursor = 'pointer';
      completeBtn.style.backgroundColor = '';
      completeBtn.style.color = '';
      completeBtn.onclick = () => completeClaimedTask(data.id);
    }
    
    // Remove completed indicator if it exists
    const completedIndicator = modal.querySelector('.completed-indicator');
    if (completedIndicator) {
      completedIndicator.remove();
    }
  }
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

// ✅ Complete claimed task
async function completeClaimedTask(taskId) {
  const confirmed = confirm("Are you sure you want to mark this task as completed?");
  if (!confirmed) return;

  try {
    const res = await fetch(`/dashboard/request/${taskId}/mark_completed`, { 
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      
      // Send notification to task poster about completion request
      await sendTaskCompletionNotification(taskId, {
        completer_name: 'You', // Since this is the claimer's action
        status: 'waiting_confirmation'
      });
      
      alert("✅ Task marked as completed! Waiting for requester to confirm.");
      
      // Update UI to show waiting state
      const modal = document.getElementById('taskDetailModal');
      modal.classList.add('completed');
      
      // Update button to show waiting status
      const completeBtn = document.querySelector('.complete-btn');
      if (completeBtn) {
        completeBtn.textContent = 'Awaiting Confirmation ⏳';
        completeBtn.disabled = true;
        completeBtn.style.opacity = '0.6';
      }
      
      // Refresh the task list to reflect changes
      setTimeout(() => {
        closeTaskDetail();
        location.reload();
      }, 1500);
      
    } else {
      const errorData = await res.json();
      alert("❌ Complete failed: " + (errorData.detail || errorData.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Complete task error:", err);
    alert("⚠️ An error occurred while completing the task.");
  }
}

// 🔔 Send notification to task poster about completion
async function sendTaskCompletionNotification(taskId, completionData) {
  try {
    const currentTask = Object.values(claimedTasks).find(task => task.id === taskId);
    if (!currentTask) {
      console.warn("Task not found for notification");
      return;
    }

    const notificationPayload = {
      recipient_id: currentTask.user_id || currentTask.email, // Use email as ID since that's what you use
      type: completionData.status === 'waiting_confirmation' ? 'task_completion_request' : 'task_completed',
      title: completionData.status === 'waiting_confirmation' ? 'Task Completion Requested! 🕐' : 'Task Completed! 🎉',
      message: completionData.status === 'waiting_confirmation' 
        ? `"${currentTask.title || 'Untitled Task'}" has been marked as completed by ${completionData.completer_name}. Please review and confirm.`
        : `Your task "${currentTask.title || 'Untitled Task'}" has been confirmed as completed!`,
      task_id: taskId,
      task_title: currentTask.title || 'Untitled Task',
      completer_name: completionData.completer_name || 'Someone',
      priority: 'high',
      read_status: false,
      created_at: new Date().toISOString()
    };

    await sendNotification(notificationPayload);

  } catch (err) {
    console.error('Error sending completion notification:', err);
    // Don't throw error here - notification failure shouldn't break task completion
  }
}

// 📬 Generic notification sender
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