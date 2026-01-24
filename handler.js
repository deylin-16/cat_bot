import { smsg } from './lib/message.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';

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
    if (!m) return;
    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.key.remoteJid;
    if (chatJid.endsWith('@g.us')) {
        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, primaryBot: '' };
        const chatData = global.db.data.chats[chatJid];
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender || m.key.participant);
        const textCommand = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase();
        const isPriorityCommand = /^(prioridad|primary|setbot)/i.test(textCommand.trim().slice(1));
        if (chatData?.primaryBot && chatData.primaryBot !== conn.user.jid) {
            if (!isROwner || !isPriorityCommand) return;
        }
    }

    const mainBotJid = global.conn?.user?.jid;
    const isSubAssistant = conn.user.jid !== mainBotJid;

    if (chatJid.endsWith('@g.us') && isSubAssistant && (!global.db.data.chats[chatJid]?.primaryBot)) {
        const groupMetadata = await conn.groupMetadata(chatJid).catch(_ => null);
        const participants = groupMetadata?.participants || [];
        if (participants.some(p => p.id === mainBotJid)) return;
    }

    m = smsg(conn, m);
    if (!m) return;

    conn.processedMessages = conn.processedMessages || new Map();
    const now = Date.now();
    const id = m.key.id;
    if (conn.processedMessages.has(id)) return;
    conn.processedMessages.set(id, now);
    for (const [msgId, time] of conn.processedMessages) {
        if (now - time > 9000) conn.processedMessages.delete(msgId);
    }

    let user; 
    try {
        const senderJid = m.sender;
        const chatJid = m.chat;

        global.db.data.chats[chatJid] ||= {
            isBanned: false,
            welcome: true,
            antiLink: true,
            primaryBot: ''
        };

        if (typeof global.db.data.users[senderJid] !== 'object') global.db.data.users[senderJid] = {};
        user = global.db.data.users[senderJid];
        const chat = global.db.data.chats[chatJid];

        if (user) {
            if (!isNumber(user.exp)) user.exp = 0;
            if (!isNumber(user.bitcoins)) user.bitcoins = 0;
            if (!('muto' in user)) user.muto = false; 
        }

        const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + detectwhat).includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        if (m.isBaileys || opts['nyimak']) return;
        if (!isROwner && opts['self']) return;
        if (typeof m.text !== 'string') m.text = '';

        let groupMetadata, participants, user2, bot, isRAdmin, isAdmin, isBotAdmin;

        if (m.isGroup) {
            groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}));
            participants = groupMetadata.participants || [];
            const [senderLid, botLid] = await Promise.all([
                getLidFromJid(m.sender, conn),
                getLidFromJid(conn.user.jid, conn)
            ]);
            user2 = participants.find(p => p.id === senderLid || p.jid === senderJid) || {};
            bot = participants.find(p => p.id === botLid || p.id === conn.user.jid) || {};
            isRAdmin = user2?.admin === "superadmin";
            isAdmin = isRAdmin || user2?.admin === "admin";
            isBotAdmin = !!bot?.admin;
        } else {
            isRAdmin = isAdmin = isBotAdmin = false;
        }

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
        const botSettings = global.db.data.settings?.[conn.user.jid] || { prefix: ['.', '#', '/'] };
        const currentPrefixes = Array.isArray(botSettings.prefix) ? botSettings.prefix : ['.', '#', '/'];
        const escapedPrefixes = currentPrefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const prefixRegex = new RegExp(`^(${escapedPrefixes})`);

        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;
            const __filename = join(___dirname, name);

            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(conn, m, { chatUpdate, __dirname: ___dirname, __filename });
                } catch (e) { console.error(e); }
            }

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate, __dirname: ___dirname, __filename })) continue;
            }

            if (typeof plugin !== 'function') continue;

            let str = m.text.trim();
            let usedPrefix = '';
            let command = '';
            let text = '';
            let args = [];

            const match = str.match(prefixRegex);
            if (match) {
                usedPrefix = match[1];
                let fullAfterPrefix = str.slice(usedPrefix.length).trim();
                command = fullAfterPrefix.split(/\s+/)[0].toLowerCase();
                text = fullAfterPrefix.slice(command.length).trim();
                args = text ? text.split(/\s+/).filter(v => v) : [];
            } else {
                continue;
            }

            if (!command) continue;

            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                typeof plugin.command === 'string' ? plugin.command === command : false;

            if (!isAccept) continue;

            const noPrefix = text;
            m.plugin = name;

            if (chat?.isBanned && !isROwner) return;
            if (chat?.modoadmin && !isOwner && !isROwner && m.isGroup && !isAdmin) return;

            const checkPermissions = (perm) => ({
                rowner: isROwner, owner: isOwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup, subBot: isSubAssistant || isROwner
            }[perm]);

            for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private', 'subBot']) {
                if (plugin[perm] && !checkPermissions(perm)) {
                    global.dfail(perm, m, conn);
                    return;
                }
            }

            m.isCommand = true;
            try {
                await plugin.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate, __dirname: ___dirname, __filename });
            } catch (e) {
                m.error = e;
                m.reply(format(e));
            } finally {
                if (typeof plugin.after === 'function') {
                    try {
                        await plugin.after.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate, __dirname: ___dirname, __filename });
                    } catch (e) { console.error(e) }
                }
            }
        }
    } catch (e) { console.error(e) } finally {
        if (m && user) {
            if (user.muto) await conn.sendMessage(m.chat, { delete: m.key });
            user.exp += m.exp || 0;
            user.bitcoins += m.bitcoins || 0;
            if (m.plugin) {
                global.db.data.stats[m.plugin] ||= { total: 0, success: 0, last: 0, lastSuccess: 0 };
                const stat = global.db.data.stats[m.plugin];
                stat.total++;
                stat.last = Date.now();
                if (!m.error) { stat.success++; stat.lastSuccess = Date.now(); }
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

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.redBright("Update 'handler.js'"));
    if (global.conns && global.conns.length > 0) {
        for (const u of global.conns.filter(c => c.user && c.ws?.readyState !== 3)) {
            try { u.subreloadHandler(false); } catch (e) { console.error(e); }
        }
    }
});
