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

    m = smsg(conn, m) || m;
    if (!m) return;

    conn.processedMessages = conn.processedMessages || new Map();
    const now = Date.now();
    const lifeTime = 9000;
    const id = m.key.id;

    if (conn.processedMessages.has(id)) return;
    conn.processedMessages.set(id, now);

    for (const [msgId, time] of conn.processedMessages) {
        if (now - time > lifeTime) conn.processedMessages.delete(msgId);
    }

    let user; 
    try {
        m.exp = 0;
        m.bitcoins = 0;

        const senderJid = m.sender;
        const chatJid = m.chat;

        global.db.data.chats[chatJid] ||= {
            isBanned: false,
            sAutoresponder: '',
            modoadmin: false,
            welcome: true,
            detect: true,
            autoresponder: false,
            antiLink: true,
            autoresponder2: false,
            per: [],
            welcomeMsg: '¡Bienvenido/a al grupo!',
            primaryBot: ''
        };

        if (typeof global.db.data.users[senderJid] !== 'object') global.db.data.users[senderJid] = {};
        user = global.db.data.users[senderJid];
        const chat = global.db.data.chats[chatJid];

        if (user) {
            if (!('exp' in user) || !isNumber(user.exp)) user.exp = 0;
            if (!('bitcoins' in user) || !isNumber(user.bitcoins)) user.bitcoins = 0;
            if (!('muto' in user)) user.muto = false; 
        }

        const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + detectwhat).includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        if (m.isBaileys || opts['nyimak']) return;
        if (!isROwner && opts['self']) return;
        if (opts['swonly'] && m.chat !== 'status@broadcast') return;
        if (typeof m.text !== 'string') m.text = '';

        let senderLid, botLid, botJid, groupMetadata, participants, user2, bot, isRAdmin, isAdmin, isBotAdmin;

        if (m.isGroup) {
            groupMetadata = await conn.groupMetadata(m.chat).catch(_ => null) || {};
            participants = groupMetadata.participants || [];
            botJid = conn.user.jid;

            [senderLid, botLid] = await Promise.all([
                getLidFromJid(m.sender, conn),
                getLidFromJid(botJid, conn)
            ]);

            user2 = participants.find(p => p.id === senderLid || p.jid === senderJid) || {};
            bot = participants.find(p => p.id === botLid || p.id === botJid) || {};

            isRAdmin = user2?.admin === "superadmin";
            isAdmin = isRAdmin || user2?.admin === "admin";
            isBotAdmin = !!bot?.admin;
        } else {
            senderLid = m.sender;
            botLid = conn.user.jid;
            botJid = conn.user.jid;
            isRAdmin = isAdmin = isBotAdmin = false;
        }

        const prefixRegex = /^[.#\/]/;
        const match = m.text.trim().match(prefixRegex);
        if (!match) return;

        const usedPrefix = match[0];
        const noPrefixText = m.text.slice(usedPrefix.length).trim();
        const args = noPrefixText.split(/\s+/).filter(v => v);
        const command = (args.shift() || '').toLowerCase();
        const text = args.join(' ');

        const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
        const plugin = global.plugins.get(pluginName);

        if (plugin) {
            if (plugin.disabled) return;
            m.plugin = pluginName;

            if (chat?.isBanned && !isROwner) return;
            if (chat?.modoadmin && !isOwner && !isROwner && m.isGroup && !isAdmin) return;

            const checkPermissions = (perm) => ({
                rowner: isROwner, 
                owner: isOwner, 
                group: m.isGroup, 
                botAdmin: isBotAdmin, 
                admin: isAdmin, 
                private: !m.isGroup, 
                restrict: !opts['restrict'],
                subBot: isSubAssistant || isROwner
            }[perm]);

            const requiredPerms = ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private', 'restrict', 'subBot'];
            for (const perm of requiredPerms) {
                if (plugin[perm] && !checkPermissions(perm)) {
                    global.dfail(perm, m, conn);
                    return;
                }
            }

            m.isCommand = true;
            m.exp += 'exp' in plugin ? parseInt(plugin.exp) : 10;

            try {
                const runFunc = typeof plugin === 'function' ? plugin : plugin.run;
                await runFunc.call(conn, m, { usedPrefix, noPrefix: text, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate });
            } catch (e) {
                m.error = e;
                m.reply(format(e));
            } finally {
                if (typeof plugin.after === 'function') {
                    try {
                        await plugin.after.call(conn, m, { usedPrefix, noPrefix: text, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isSubAssistant, chatUpdate });
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
    const messages = {
        rowner: `Solo con Deylin-Eliac hablo de eso w.`,
        owner: `Solo con Deylin-Eliac hablo de eso w.`,
        group: `Si quieres hablar de eso solo en grupos bro.`,
        private: `De ésto solo habló en privado güey.`,
        admin: `Solo los administradores me pueden decir que hacer.`,
        botAdmin: `Dame admin bro para seguir.`,
        subBot: `Esta función solo la puede usar un sub-asistente o mi creador.`
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    if (global.conns && global.conns.length > 0) {
        for (const u of global.conns.filter(c => c.user && c.ws.socket?.readyState !== ws.CLOSED)) {
            u.subreloadHandler(false);
        }
    }
})
