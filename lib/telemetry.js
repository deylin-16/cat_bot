import fetch from 'node-fetch';

let heartbeatInterval = null;

export const monitorBot = async (conn, status = 'online') => {
    if (!conn?.user?.id) return;
    const botId = conn.user.id.split(':')[0];
    
    const sendPing = async (currentStatus) => {
        try {
            // Obtenemos todos los JIDs de las conversaciones actuales
            const chats = Object.values(conn.chats || {});
            
            // Conteo de Grupos: Filtramos los que terminan en @g.us
            const groupsCount = chats.filter(c => c.id.endsWith('@g.us')).length;
            
            // Conteo de Usuarios (Chats privados): Filtramos los que terminan en @s.whatsapp.net
            const usersCount = chats.filter(c => c.id.endsWith('@s.whatsapp.net')).length;

            const stats = {
                botId: botId,
                status: currentStatus,
                users: usersCount,
                groups: groupsCount,
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
