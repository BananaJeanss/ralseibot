async function checkBotStatus() {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const uptimeElement = document.getElementById('uptime');
    const lastCheckElement = document.getElementById('last-check');

    try {
        const response = await fetch('/health');
        
        if (response.ok) {
            const data = await response.json();
            
            // Update status indicator
            statusDot.className = 'status-dot online';
            statusText.textContent = 'Online';
            
            // Format uptime
            const uptimeSeconds = Math.floor(data.uptime);
            const days = Math.floor(uptimeSeconds / 86400);
            const hours = Math.floor((uptimeSeconds % 86400) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            
            let uptimeString = '';
            if (days > 0) uptimeString += `${days}d `;
            if (hours > 0) uptimeString += `${hours}h `;
            if (minutes > 0) uptimeString += `${minutes}m `;
            uptimeString += `${seconds}s`;
            
            uptimeElement.textContent = uptimeString;
            
            // Update last check time
            const now = new Date();
            lastCheckElement.textContent = now.toLocaleTimeString();
            
        } else {
            throw new Error('Health check failed');
        }
    } catch (error) {
        console.error('Error checking bot status:', error);
        
        // Update status indicator for offline
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Offline';
        uptimeElement.textContent = 'N/A';
        
        const now = new Date();
        lastCheckElement.textContent = `${now.toLocaleTimeString()} (Error)`;
    }
}

// Check status immediately when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkBotStatus();
    
    // Check status every 30 seconds
    setInterval(checkBotStatus, 30000);
});