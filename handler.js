import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';

export async function handler(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!m) return;
    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.chat;
    const MAIN_NUMBER = conn.user.jid;
    
    const senderLid = m.sender;
    const senderPn = m.key.participantAlt || m.key.remoteJidAlt || m.sender;
    const botLid = conn.user.lid || '';
    const botPn = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const isMainBot = conn.user.jid;

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
                .map(c => (c.user.id.split(':')[0]));
            if (participants.some(p => activeSubBots.includes(p.id.split('@')[0]) || activeSubBots.includes(p.lid?.split('@')[0]))) return;
        } else if (!isMainBot && !chat.antisub) {
            if (participants.some(p => p.id.replace(/\D/g, '') === MAIN_NUMBER || p.pn?.replace(/\D/g, '') === MAIN_NUMBER)) return;
        }
    }

    if (m.isBaileys) return;

    global.db.data.users[m.sender] ||= { exp: 0, muto: false, warnAntiLink: 0 };
    const user = global.db.data.users[m.sender];

    const isROwner = global.owner.some(([num]) => {
        let jid = num.replace(/\D/g, '') + '@s.whatsapp.net';
        return jid === senderPn || jid === senderLid;
    }) || m.fromMe;
    const isOwner = isROwner;

    let isAdmin = false, isBotAdmin = false;
    if (m.isGroup) {
        const userInGroup = participants.find(p => p.id === senderLid || p.id === senderPn);
        const botInGroup = participants.find(p => p.id === botPn || p.id === botLid);
        
        isAdmin = !!userInGroup?.admin;
        isBotAdmin = !!botInGroup?.admin;
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
                isBotAdmin, isSubAssistant: !isMainBot, chatUpdate, participants
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
