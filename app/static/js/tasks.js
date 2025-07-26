let claimedTasks = {};

document.addEventListener("DOMContentLoaded", () => {
    // Fetch claimed tasks from backend
    fetch('/dashboard/claimed_tasks')
        .then(res => res.json())
        .then(data => {
            const taskList = document.getElementById('taskList');

            if (data.length === 0) {
                taskList.innerHTML = "<p style='color: #ccc;'>You haven't claimed any tasks yet.</p>";
                return;
            }

            claimedTasks = data.reduce((acc, task, index) => {
                const taskId = `task${index + 1}`;
                acc[taskId] = task;
                createTaskListItem(taskId, task);
                return acc;
            }, {});
        })
        .catch(err => {
            console.error('Failed to load claimed tasks:', err);
        });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Notification click
    document.querySelector('.notification-icon')?.addEventListener('click', () => {
        alert('Notifications clicked!');
    });

    // Profile click
    document.querySelector('.profile-section')?.addEventListener('click', () => {
        alert('Profile clicked!');
    });
});

function createTaskListItem(taskId, task) {
    const taskList = document.getElementById('taskList');
    const item = document.createElement('div');
    item.className = 'task-item';
    item.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-deadline">${task.deadline}</div>
    `;
    item.addEventListener('click', () => {
        showTaskDetail(taskId, item);
    });
    taskList.appendChild(item);
}

function showTaskDetail(taskId, clickedElement) {
    const modal = document.getElementById('taskDetailModal');
    const data = claimedTasks[taskId];

    document.querySelectorAll('.task-item, .completed-task-item').forEach(item => {
        item.classList.remove('active');
    });

    clickedElement.classList.add('active');
    modal.classList.remove('completed');
    document.getElementById('modalityLabel').textContent = 'Modality:';

    if (data) {
        document.getElementById('taskUsername').textContent = data.username || 'Anonymous';
        document.getElementById('taskTitle').textContent = data.title;
        document.getElementById('taskDescription').innerHTML = data.description;
        document.getElementById('taskImage').src = data.image || '/static/images/fallback.jpg';
        document.getElementById('taskDeadlineText').textContent = data.deadline || 'N/A';
        document.getElementById('taskModalityText').textContent = data.modality || 'N/A';
        document.getElementById('taskPaymentText').textContent = `${data.payment || '₱0'} (Negotiable)`;

        // ✅ Attach correct cancel handler
        const cancelBtn = document.querySelector('.cancel-btn');
        cancelBtn.onclick = () => {
            cancelClaimedTask(data.id);
        };
    }

    modal.classList.add('active');
}

function closeTaskDetail() {
    const modal = document.getElementById('taskDetailModal');
    modal.classList.remove('active');
    modal.classList.remove('completed');

    document.querySelectorAll('.task-item, .completed-task-item').forEach(item => {
        item.classList.remove('active');
    });
}

async function cancelClaimedTask(taskId) {
    try {
        const res = await fetch(`/dashboard/request/${taskId}/cancel`, {
            method: 'PUT'
        });

        if (res.ok) {
            alert("Task successfully cancelled.");
            closeTaskDetail();
            location.reload(); // Refresh the list
        } else {
            const data = await res.json();
            alert("Failed to cancel: " + (data.detail || "Unknown error"));
        }
    } catch (err) {
        console.error("Cancel error:", err);
        alert("An error occurred.");
    }
}
