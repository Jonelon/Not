document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    const leadersTable = document.getElementById('leaders-table');
    
    
    function loadLeaderboard() {
        fetch('/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                renderLeaderboard(data.leaders);
            })
            .catch(error => {
                console.error('Error loading leaderboard:', error);
                leadersTable.innerHTML = '<tr><td colspan="3">Error loading leaderboard. Please try again later.</td></tr>';
            });
    }
    
    
    function renderLeaderboard(leaders) {
        leadersTable.innerHTML = '';
        
        leaders.forEach((user, index) => {
            const row = document.createElement('tr');
            
           
            if (tg.initDataUnsafe.user && user.id === tg.initDataUnsafe.user.id) {
                row.style.backgroundColor = '#e3f2fd';
            }
            
            row.innerHTML = `
                <td class="user-rank">${index + 1}</td>
                <td>
                    <img src="${user.avatar || 'https://via.placeholder.com/30'}" class="user-avatar" alt="Avatar">
                    ${user.name || `User ${user.id}`}
                </td>
                <td>${user.points.toFixed(2)}</td>
            `;
            
            leadersTable.appendChild(row);
        });
    }
    
    loadLeaderboard();
});