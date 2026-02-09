import fetch from 'node-fetch';

let heartbeatInterval = null;

export const monitorBot = async (conn, status = 'online') => {
    if (!conn?.user?.id) return;
    const botId = conn.user.id.split(':')[0];
    
    const sendPing = async (currentStatus) => {
        try {
            
            const usersCount = Object.keys(global.db?.data?.users || {}).length;

            
            const groupsCount = Object.keys(global.db?.data?.chats || {})
                .filter(id => id.endsWith('@g.us')).length;

            const subBotsCount = (global.conns || [])
                .filter(c => c.ws?.readyState === 1).length;

            const stats = {
                botId: botId,
                status: currentStatus,
                users: usersCount,
                groups: groupsCount,
                subBots: subBotsCount,
                lastSeen: Date.now()
            };

            await fetch('https://deylin.xyz/api/monitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stats)
            });
        } catch (e) {
            
        }
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
