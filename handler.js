import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './lib/identifier.js';

export async function handler(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!m) return;
    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.chat;
    const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

    const senderJid = await getRealJid(conn, m.sender, m);
    const botJid = jidNormalizedUser(conn.user.id);

    const isSubBot = (global.conns || []).some(c => c.user && cleanId(c.user.id) === cleanId(botJid));
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
    let groupMetadata = {};

    if (m.isGroup) {
        groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
        participants = groupMetadata.participants || [];
    }

    if (m.isGroup && !isMainBot && chat.antisub) return;

    if (m.isBaileys) return;

    global.db.data.users[m.sender] ||= { exp: 0, muto: false, warnAntiLink: 0 };
    const user = global.db.data.users[m.sender];

    const isROwner = global.owner.some(([num]) => {
        return num.replace(/\D/g, '') === cleanId(senderJid);
    }) || m.fromMe;
    const isOwner = isROwner;

        let isAdmin = false, isBotAdmin = false;
    if (m.isGroup) {
        
        const getAdminStatus = (targetJid, targetAuthor) => {
            const p = participants.find(p => 
                jidNormalizedUser(p.id) === jidNormalizedUser(targetJid) || 
                jidNormalizedUser(p.id) === jidNormalizedUser(targetAuthor) ||
                (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(targetJid)) ||
                (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(targetAuthor))
            );
            return !!(p?.admin || p?.isCommunityAdmin);
        };

        isAdmin = getAdminStatus(m.sender, m.author);
        isBotAdmin = getAdminStatus(conn.user.id, conn.user.lid || conn.user.id);
    }


    if (!m.command) return;

    const pluginName = global.plugins.has(m.command) ? m.command : global.aliases.get(m.command);
    const plugin = pluginName ? global.plugins.get(pluginName) : null;

    if (plugin) {
        if (plugin.disabled || (chat?.isBanned && !isROwner)) return;

        if (m.isGroup && ((plugin.admin && !isAdmin) || (plugin.botAdmin && !isBotAdmin))) {
            groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
            participants = groupMetadata.participants || [];
            
            isAdmin = participants.some(p => (jidNormalizedUser(p.id) === jidNormalizedUser(senderJid) || (p.lid && jidNormalizedUser(p.lid) === jidNormalizedUser(senderJid))) && p.admin);
            isBotAdmin = participants.some(p => jidNormalizedUser(p.id) === jidNormalizedUser(botJid) && p.admin);
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
        botAdmin: `> ╰✰ Necesito ser administrador.`,
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bold.greenBright(`Actualización detectada en handler.js`));
});
