import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import fetch from 'node-fetch';

const isNumber = x => typeof x === 'number' && !isNaN(x);

async function getLidFromJid(id, connection) {
    if (id.endsWith('@lid')) return id;
    const res = await connection.onWhatsApp(id).catch(() => []);
    return res[0]?.lid || id;
}

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) return;

    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m || m.isBaileys || opts['nyimak']) return;

    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.key.remoteJid;
    m = smsg(conn, m) || m;
    if (!m) return;

    conn.processedMessages = conn.processedMessages || new Map();
    const now = Date.now();
    const id = m.key.id;

    if (conn.processedMessages.has(id)) return;
    conn.processedMessages.set(id, now);

    if (conn.processedMessages.size > 100) {
        for (const [msgId, time] of conn.processedMessages) {
            if (now - time > 9000) conn.processedMessages.delete(msgId);
        }
    }

    const mainBotJid = global.conn?.user?.jid;
    const isSubAssistant = conn.user.jid !== mainBotJid;

    let user, chat;
    try {
        const senderJid = m.sender;
        
        global.db.data.chats[chatJid] ||= {
            isBanned: false, welcome: true, antiLink: true, primaryBot: ''
        };
        chat = global.db.data.chats[chatJid];

        if (m.isGroup && isSubAssistant && !chat?.primaryBot) {
            const groupMetadata = await conn.groupMetadata(chatJid).catch(() => null);
            if (groupMetadata?.participants.some(p => p.id === mainBotJid)) return;
        }

        if (chat?.primaryBot && chat.primaryBot !== conn.user.jid) {
            const isROwner = global.owner.some(([num]) => (num.replace(/[^0-9]/g, '') + '@s.whatsapp.net') === senderJid);
            const isPriority = /^(prioridad|primary|setbot)/i.test(m.text?.trim().slice(1));
            if (!isROwner || !isPriority) return;
        }

        global.db.data.users[senderJid] ||= { exp: 0, coin: 0, muto: false };
        user = global.db.data.users[senderJid];

        const isROwner = global.owner.some(([num]) => (num.replace(/[^0-9]/g, '') + (senderJid.includes('@lid') ? '@lid' : '@s.whatsapp.net')) === senderJid);
        const isOwner = isROwner || m.fromMe;

        if (!isROwner && opts['self']) return;
        if (opts['swonly'] && m.chat !== 'status@broadcast') return;

        let isRAdmin = false, isAdmin = false, isBotAdmin = false;
        if (m.isGroup) {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({}));
            const participants = groupMetadata.participants || [];
            const botJid = conn.user.jid;

            const userInGroup = participants.find(p => p.id === senderJid || p.jid === senderJid);
            const botInGroup = participants.find(p => p.id === botJid);

            isRAdmin = userInGroup?.admin === "superadmin";
            isAdmin = isRAdmin || userInGroup?.admin === "admin";
            isBotAdmin = botInGroup?.admin === "admin" || botInGroup?.admin === "superadmin";
        }

        const pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');

        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            if (typeof plugin.all === 'function') {
                try { await plugin.all.call(conn, m, { chatUpdate }); } catch (e) { console.error(e); }
            }

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate })) continue;
            }

            if (typeof plugin !== 'function') continue;

            let text = m.text || '';
            let usedPrefix = '';
            let noPrefix = text.trim();
            let [command, ...args] = noPrefix.split(/\s+/).filter(v => v);
            command = (command || '').toLowerCase();

            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                typeof plugin.command === 'string' ? plugin.command === command : false;

            if (!isAccept) continue;

            m.plugin = name;
            if (chat?.isBanned && !isROwner) return;
            if (chat?.modoadmin && !isOwner && !isROwner && m.isGroup && !isAdmin) return;

            const perms = {
                rowner: isROwner, owner: isOwner, group: m.isGroup, botAdmin: isBotAdmin, 
                admin: isAdmin, private: !m.isGroup, subBot: isSubAssistant || isROwner
            };

            for (const perm in perms) {
                if (plugin[perm] && !perms[perm]) {
                    global.dfail(perm, m, conn);
                    return;
                }
            }

            m.isCommand = true;
            try {
                await plugin.call(conn, m, { usedPrefix, noPrefix, args, command, text: args.join(' '), conn, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate });
            } catch (e) {
                m.error = e;
                m.reply(format(e));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        if (m && user) {
            if (user.muto) await conn.sendMessage(m.chat, { delete: m.key });
            user.exp += m.exp || 0;
            if (m.plugin) {
                global.db.data.stats[m.plugin] ||= { total: 0, success: 0 };
                global.db.data.stats[m.plugin].total++;
                if (!m.error) global.db.data.stats[m.plugin].success++;
            }
        }
    }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `Solo con Deylin-Eliac hablo de eso w.`,
        owner: `Solo con Deylin-Eliac hablo de eso w.`,
        group: `Si quieres hablar de eso solo en grupos bro.`,
        private: `De ésto solo habló en privado güey.`,
        admin: `Solo los administradores me pueden decir que hacer.`,
        botAdmin: `Dame admin bro para seguir.`,
        subBot: `Esta función solo la puede usar un sub-asistente o mi creador.`
    }[type];
    if (msg) conn.reply(m.chat, msg, m);
};
