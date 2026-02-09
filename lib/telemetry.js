import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

let heartbeatInterval = null;

export const monitorBot = async (conn, status = 'online') => {
    if (!conn?.user?.id) return;
    const botId = conn.user.id.split(':')[0];
    
    const getStats = () => {
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

        return {
            botId: botId,
            status: 'online',
            users: usersCount,
            groups: groupsCount,
            subBots: subBotsCount,
            lastSeen: Date.now()
        };
    };

    const sendPing = async (data) => {
        try {
            await fetch('https://deylin.xyz/api/monitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {}
    };

    if (status === 'online') {
        // 1. Aviso inmediato de conexión
        await sendPing({ ...getStats(), status: 'online' });

        // 2. Observer: Escucha eventos de carga de mensajes/chats
        const updateData = async () => {
            const stats = getStats();
            // Solo enviamos si ya hay datos reales (para no enviar 0s innecesarios)
            if (stats.users > 0 || stats.groups > 0 || stats.subBots > 0) {
                await sendPing(stats);
            }
        };

        conn.ev.on('messaging-history.set', updateData);
        conn.ev.on('chats.upsert', updateData);
        conn.ev.on('chats.update', updateData);

        // 3. Latido de seguridad cada 30s
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(async () => {
            await sendPing(getStats());
        }, 30000);

    } else {
        await sendPing({ botId, status: 'offline', lastSeen: Date.now() });
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
};
