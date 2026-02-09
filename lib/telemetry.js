import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

let heartbeatInterval = null;

export const monitorBot = async (conn, status = 'online') => {
    if (!conn?.user?.id) return;
    const botId = conn.user.id.split(':')[0];
    
    const sendPing = async (currentStatus) => {
        try {
            
            const allChats = conn.chats ? Object.values(conn.chats) : [];
            
            const groupsCount = allChats.filter(c => c.id?.endsWith('@g.us')).length;
            const usersCount = allChats.filter(c => c.id?.endsWith('@s.whatsapp.net')).length;

            const jadibtsDir = path.join(process.cwd(), 'jadibts');
            let subBotsCount = 0;
            if (fs.existsSync(jadibtsDir)) {
                subBotsCount = fs.readdirSync(jadibtsDir).filter(f => 
                    fs.statSync(path.join(jadibtsDir, f)).isDirectory() && 
                    fs.existsSync(path.join(jadibtsDir, f, 'creds.json'))
                ).length;
            }

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
        } catch (e) {}
    };

    if (status === 'online') {
        await sendPing('online');
        
        conn.ev.on('messaging-history.set', () => {
            sendPing('online'); 
        });

        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => sendPing('online'), 30000);
    } else {
        await sendPing('offline');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
};
