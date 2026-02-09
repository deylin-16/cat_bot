import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

let heartbeatInterval = null;

export const monitorBot = async (conn, status = 'online') => {
    if (!conn?.user?.id) return;
    const botId = conn.user.id.split(':')[0];
    
    const sendPing = async (currentStatus, forceData = false) => {
        try {
            // Intentamos obtener chats de múltiples fuentes de Baileys
            const allChats = conn.chats ? Object.values(conn.chats) : [];
            
            let groupsCount = allChats.filter(c => c.id?.endsWith('@g.us')).length;
            let usersCount = allChats.filter(c => c.id?.endsWith('@s.whatsapp.net')).length;

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
        // 1. PIN INMEDIATO: Avisa que el bot encendió (aunque marque 0)
        await sendPing('online');

        // 2. PIN DE ESTABILIZACIÓN: Se activa cuando Baileys recibe los chats del servidor
        conn.ev.on('messaging-history.set', async () => {
            setTimeout(async () => {
                await sendPing('online');
            }, 5000); // Esperamos 5 segundos extra para que el objeto conn.chats se llene bien
        });

        // 3. LATIDO CONSTANTE: Mantiene la info actualizada cada 30 segundos
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => sendPing('online'), 30000);
    } else {
        await sendPing('offline');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
};
