document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    const userId = tg.initDataUnsafe.user?.id || 'test_user';
    const tasksContainer = document.getElementById('tasks-container');
    
    // Доступные задания
    const tasks = [
        {
            id: 'subscribe_channel',
            title: 'Subscribe to our channel',
            description: 'Subscribe to our Telegram channel and get 10 points',
            reward: 10,
            action: 'subscribe',
            target: 't.me/Not_Picture_Official' 
        },
        {
            id: 'invite_friend',
            title: 'Invite a friend',
            description: 'Invite one friend and get 20 points when they join',
            reward: 20,
            action: 'invite'
        },
        {
            id: 'daily_login',
            title: 'Daily login',
            description: 'Visit the app every day to get 5 points',
            reward: 5,
            action: 'daily'
        },
        {
            id: 'watch_ad',
            title: 'Watch advertisement',
            description: 'Watch a short video ad and get 3 points',
            reward: 3,
            action: 'watch_ad'
        }
    ];
    
    // Проверка выполненных заданий
    function checkCompletedTasks() {
        fetch(`/api/user/tasks?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                renderTasks(data.completed_tasks || []);
            })
            .catch(error => {
                console.error('Error loading tasks:', error);

                renderTasks([]);
            });
    }
    
    function renderTasks(completedTasks) {
        tasksContainer.innerHTML = '';
        
        tasks.forEach(task => {
            const isCompleted = completedTasks.includes(task.id);
            const taskElement = document.createElement('div');
            taskElement.className = 'task-card';
            taskElement.innerHTML = `
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description}</div>
                </div>
                <div class="task-reward">+${task.reward} points</div>
                <button class="task-button ${isCompleted ? 'completed' : ''}"
                        data-task-id="${task.id}"
                        data-action="${task.action}"
                        data-target="${task.target || ''}"
                        ${isCompleted ? 'disabled' : ''}>
                    ${isCompleted ? 'Completed' : 'Start'}
                </button>
            `;
            tasksContainer.appendChild(taskElement);
        });
        
        document.querySelectorAll('.task-button:not(.completed)').forEach(button => {
            button.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                const action = this.getAttribute('data-action');
                const target = this.getAttribute('data-target');
                
                completeTask(taskId, action, target, this);
            });
        });
    }
    

    function completeTask(taskId, action, target, buttonElement) {
        switch(action) {
            case 'subscribe':
                tg.openTelegramLink(`https://t.me/${target}`);
                verifyTaskCompletion(taskId, buttonElement);
                break;
                
            case 'invite':
                tg.shareApp({
                    title: 'Join this awesome app!',
                    text: 'Earn points together with me!',
                    url: `https://t.me/YOUR_BOT_NAME?start=ref_${userId}`
                });
                break;
                
            case 'daily':
            case 'watch_ad':
                verifyTaskCompletion(taskId, buttonElement);
                break;
        }
    }
    
    function verifyTaskCompletion(taskId, buttonElement) {
        fetch('/api/complete_task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                task_id: taskId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                buttonElement.classList.add('completed');
                buttonElement.textContent = 'Completed ✓';
                buttonElement.disabled = true;
                alert(`You earned ${data.reward} points!`);
            }
        })
        .catch(error => {
            console.error('Error completing task:', error);
            alert('Error completing task. Please try again.');
        });
    }
    

    checkCompletedTasks();
});