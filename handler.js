import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

export async function handler(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!m) return;
    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.chat;
    
    // Función de limpieza extrema para evitar conflictos de caracteres (:24, @lid, etc)
    const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

    const senderLid = m.sender;
    const senderPn = m.key.participantAlt || m.key.remoteJidAlt || m.sender;
    
    // IDs del Bot Normalizados
    const botJid = jidNormalizedUser(conn.user.id);
    const botLid = conn.user.lid || '';
    const botClean = cleanId(botJid);
    const botLidClean = cleanId(botLid);

    const isSubBot = (global.conns || []).some(c => c.user && cleanId(c.user.id) === botClean);
    const isMainBot = !isSubBot;

    global.db.data.chats[chatJid] ||= { 
        isBanned: false, 
        welcome: true, 
        detect: true, 
        antisub: false,
        mutos: []
    };

    const chat = global.db.data.chats[chatJid];
    let participants = [];
    if (m.isGroup) {
        const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
        participants = groupMetadata.participants || [];
    }

    if (m.isGroup) {
        if (!isMainBot && chat.antisub) return;
        if (isMainBot && !chat.antisub) {
            const activeSubBots = (global.conns || [])
                .filter(c => c.user && c.ws?.readyState === ws.OPEN)
                .map(c => cleanId(c.user.id));
            if (participants.some(p => activeSubBots.includes(cleanId(p.id)) || activeSubBots.includes(cleanId(p.lid)))) return;
        }
    }

    if (m.isBaileys) return;

    global.db.data.users[m.sender] ||= { exp: 0, muto: false, warnAntiLink: 0 };
    const user = global.db.data.users[m.sender];

    const isROwner = global.owner.some(([num]) => {
        const ownerClean = num.replace(/\D/g, '');
        return ownerClean === cleanId(senderPn) || ownerClean === cleanId(senderLid);
    }) || m.fromMe;
    const isOwner = isROwner;

    let isAdmin = false, isBotAdmin = false;
    if (m.isGroup) {
        // Comparación por ID limpio para ignorar @lid, :dispositivo o @s.whatsapp.net
        const userInGroup = participants.find(p => cleanId(p.id) === cleanId(senderLid) || cleanId(p.id) === cleanId(senderPn));
        const botInGroup = participants.find(p => cleanId(p.id) === botClean || cleanId(p.id) === botLidClean);

        isAdmin = !!(userInGroup?.admin || userInGroup?.isCommunityAdmin);
        isBotAdmin = !!(botInGroup?.admin || botInGroup?.isCommunityAdmin);
    }

    if (m.isGroup && chat.mutos.includes(m.sender) && !isAdmin && !isOwner) {
        return await conn.sendMessage(m.chat, { delete: m.key });
    }

    for (const p of Array.from(global.plugins.values())) {
        if (p.before && typeof p.before === 'function') {
            if (await p.before.call(conn, m, { conn, participants, isROwner, isOwner, isAdmin, isBotAdmin, chat })) continue;
        }
    }

    if (!m.command) return;

    const pluginName = global.plugins.has(m.command) ? m.command : global.aliases.get(m.command);
    const plugin = pluginName ? global.plugins.get(pluginName) : null;

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;

        // Doble verificación: Si falla la caché, refrescamos info del grupo
        if (m.isGroup && ((plugin.admin && !isAdmin) || (plugin.botAdmin && !isBotAdmin))) {
            const groupMetadata = await conn.groupMetadata(chatJid, false).catch(() => ({}));
            participants = groupMetadata.participants || [];
            const userInGroup = participants.find(p => cleanId(p.id) === cleanId(senderLid) || cleanId(p.id) === cleanId(senderPn));
            const botInGroup = participants.find(p => cleanId(p.id) === botClean || cleanId(p.id) === botLidClean);
            isAdmin = !!(userInGroup?.admin || userInGroup?.isCommunityAdmin);
            isBotAdmin = !!(botInGroup?.admin || botInGroup?.isCommunityAdmin);
        }

        const checkPermissions = (perm) => ({
            rowner: isROwner,
            owner: isOwner,
            group: m.isGroup,
            botAdmin: isBotAdmin,
            admin: isAdmin,
            private: !m.isGroup
        }[perm]);

        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[perm] && !checkPermissions(perm)) {
                global.dfail(perm, m, conn);
                return;
            }
        }

        try {
            await plugin.run.call(conn, m, { 
                usedPrefix: m.prefix, noPrefix: m.text.replace(m.prefix + m.command, '').trim(), 
                args: m.args, command: m.command, text: m.args.join(' '), 
                conn, user, chat, isROwner, isOwner, isAdmin, 
                isBotAdmin, isMainBot, isSubAssistant: !isMainBot, chatUpdate, participants
            });
        } catch (e) {
            console.error(e);
            m.reply(format(e));
        }
    }
}

global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `> ╰❒ Solo mi creador puede usar este comando.`,
        owner: `> ╰❒ Solo mi creador puede usar este comando.`,
        group: `> ╰✎ Este comando sólo se puede usar en grupos.`,
        private: `De esto solo hablo en privado.`,
        admin: `> ╰♛ Sólo los administradores pueden ejecutar este comando.`,
        botAdmin: `> ╰✰ Necesito ser administrador.`
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bold.greenBright(`Actualización detectada en handler.js`));
});
