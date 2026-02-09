import fetch from 'node-fetch';

let heartbeatInterval = null;

export const monitorBot = async (conn, status = 'online') => {
    if (!conn?.user?.id) return;
    const botId = conn.user.id.split(':')[0];
    
    const sendPing = async (currentStatus) => {
        try {
            const stats = {
                botId: botId,
                status: currentStatus,
                users: Object.keys(conn.store?.contacts || {}).length || 0,
                groups: Object.keys(conn.store?.chats || {}).filter(id => id.endsWith('@g.us')).length || 0,
                lastSeen: Date.now()
            };

            await fetch('https://deylin.xyz/api/monitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stats)
            });
        } catch (e) {}
    };

    if (status === 'online') {
        await sendPing('online');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => sendPing('online'), 30000);
    } else {
        await sendPing('offline');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
};
