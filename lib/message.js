import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import { events } from './events.js';
import { uploadError } from './db_logs.js';
import NodeCache from 'node-cache';

const groupCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const requestQueue = new Map();

async function getGroupMetadata(conn, jid) {
    if (!jid || !jid.endsWith('@g.us')) return {};
    let metadata = groupCache.get(jid);
    if (metadata) return metadata;

    if (requestQueue.has(jid)) return requestQueue.get(jid);

    const fetchPromise = (async () => {
        try {
            const data = await conn.groupMetadata(jid);
            if (data && data.id) {
                groupCache.set(jid, data);
                return data;
            }
        } catch (e) {
            if (e.id === 'rate-overlimit' || e.statusCode === 429) {
                console.warn(`[Rate Limit] Ignorando ${jid} para evitar reinicio.`);
            }
            return {};
        } finally {
            requestQueue.delete(jid);
        }
        return {};
    })();

    requestQueue.set(jid, fetchPromise);
    return fetchPromise;
}

export async function message(m, chatUpdate) {
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
        groupMetadata = await getGroupMetadata(conn, chatJid);
        participants = groupMetadata.participants || [];
    }
    if (m.messageStubType) {
        const metadata = m.isGroup ? await getGroupMetadata(conn, m.chat) : {};
        const parts = metadata.participants || [];
        await events(conn, m, parts);
        return;
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
    if (m.isGroup && participants.length > 0) {
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
            groupMetadata = await getGroupMetadata(conn, chatJid);
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
            const supportUrl = await uploadError(e);
            const errorId = supportUrl.split('=')[1] || 'N/A';
            const errorMessage = e.stack || e.message || e;
            const report = `*───「 ⚠️ FALLO DE SISTEMA 」───*\n\n` +
                           `*ID de Log:* #${errorId}\n` +
                           `*Soporte:* ${supportUrl}\n\n` +
                           `*LOG TÉCNICO:*\n\`\`\`${errorMessage}\`\`\``;
            await conn.sendMessage(m.chat, { text: report }, { quoted: m }).catch(() => null);
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
    if (messages[type]) conn.reply(m.chat, messages[type], m).catch(() => null);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.bold.greenBright(`Actualización detectada...`));
});
