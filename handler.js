import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';

const isNumber = x => typeof x === 'number' && !isNaN(x);

async function getLidFromJid(id, connection) {
    if (id?.endsWith('@lid')) return id;
    const res = await connection.onWhatsApp(id).catch(() => []);
    return res[0]?.lid || id;
}

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate || !chatUpdate.messages) return;
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    const messageTimestamp = (m.messageTimestamp?.low || m.messageTimestamp || 0) * 1000;
    if (Date.now() - messageTimestamp > 10000) return; 

    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.key.remoteJid;
    if (chatJid.endsWith('@g.us')) {
        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, primaryBot: '' };
        const chatData = global.db.data.chats[chatJid];
        const isROwner = global.owner.map(([number]) => number.replace(/\D/g, '') + '@s.whatsapp.net').includes(m.sender || m.key.participant);
        const textCommand = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase();
        const isPriorityCommand = /^(prioridad|primary|setbot)/i.test(textCommand.trim().slice(1));

        if (chatData?.primaryBot && chatData.primaryBot !== conn.user.jid) {
            if (!isROwner && !isPriorityCommand) return;
        }
    }

    const mainBotJid = global.conn?.user?.jid;
    const isSubAssistant = conn.user.jid !== mainBotJid;

    if (chatJid.endsWith('@g.us') && isSubAssistant && (!global.db.data.chats[chatJid]?.primaryBot)) {
        const groupMetadata = await conn.groupMetadata(chatJid).catch(() => null);
        if (groupMetadata?.participants?.some(p => p.id === mainBotJid)) return;
    }

    m = smsg(conn, m) || m;
    if (!m) return;

    conn.processedMessages = conn.processedMessages || new Map();
    const id = m.key.id;
    if (conn.processedMessages.has(id)) return;
    conn.processedMessages.set(id, Date.now());

    if (conn.processedMessages.size > 50) {
        const threshold = Date.now() - 9000;
        for (const [msgId, time] of conn.processedMessages) {
            if (time < threshold) conn.processedMessages.delete(msgId);
        }
    }

    try {
        m.exp = 0;
        const senderJid = m.sender;
        global.db.data.users[senderJid] ||= { exp: 0, bitcoins: 0, muto: false };
        const user = global.db.data.users[senderJid];
        const chat = global.db.data.chats[m.chat];

        const isROwner = global.owner.map(([num]) => num.replace(/\D/g, '') + (m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net')).includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        if (m.isBaileys || opts['nyimak'] || (!isROwner && opts['self'])) return;

        let isAdmin = false, isBotAdmin = false;
        if (m.isGroup) {
            const groupMetadata = (conn.chats[m.chat] || {}).metadata || await conn.groupMetadata(m.chat).catch(() => ({}));
            const participants = groupMetadata.participants || [];
            const bot = participants.find(p => p.id === conn.user.jid) || {};
            const userInGroup = participants.find(p => p.id === senderJid) || {};
            isAdmin = !!userInGroup?.admin;
            isBotAdmin = !!bot?.admin;
        }

        const prefixRegex = /^[.#/!]/;
        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            const str = m.text || '';
            const match = str.match(prefixRegex);
            const usedPrefix = match ? match[0] : '';
            const noPrefix = str.startsWith(usedPrefix) ? str.slice(usedPrefix.length).trim() : str;
            const command = noPrefix.split(/\s+/)[0].toLowerCase();

            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                             Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                             typeof plugin.command === 'string' ? plugin.command === command : false;

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, isROwner, isOwner, isAdmin, isBotAdmin, isSubAssistant, chatUpdate })) continue;
            }

            if (!isAccept) continue;
            m.plugin = name;
            global.comando = command;

            if (chat?.isBanned && !isROwner) return;
            if (chat?.modoadmin && !isAdmin && !isROwner) return;

            const check = {
                rowner: isROwner, owner: isOwner, group: m.isGroup, admin: isAdmin, botAdmin: isBotAdmin, private: !m.isGroup, subBot: isSubAssistant || isROwner
            };

            let failType = Object.keys(check).find(key => plugin[key] && !check[key]);
            if (failType) {
                global.dfail(failType, m, conn);
                return;
            }

            try {
                const args = noPrefix.split(/\s+/).slice(1);
                await plugin.call(conn, m, { conn, usedPrefix, noPrefix, args, command, text: args.join(' '), isROwner, isAdmin, isBotAdmin, isSubAssistant });
            } catch (e) {
                m.error = e;
                m.reply(`❌ *ERROR:* ${name}\n\n${format(e)}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        if (m && m.sender) {
            const u = global.db.data.users[m.sender];
            if (u?.muto) await conn.sendMessage(m.chat, { delete: m.key });
            if (m.plugin) {
                const stat = global.db.data.stats[m.plugin] ||= { total: 0, success: 0 };
                stat.total++;
                if (!m.error) stat.success++;
            }
        }
    }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `👤 *ACCESO RESTRINGIDO*\nSolo mi *Creador* puede usar esto.`,
        owner: `🛠️ *MODO OWNER*\nComando exclusivo para mis *Owners*.`,
        group: `📢 *SOLO GRUPOS*\nEste comando solo funciona en grupos.`,
        private: `📧 *CHAT PRIVADO*\nUsa este comando en el privado del bot.`,
        admin: `🛡️ *ADMIN REQUERIDO*\nDebes ser *Administrador* del grupo.`,
        botAdmin: `🤖 *BOT SIN ADMIN*\nNecesito ser *Administrador* para ejecutar esto.`,
        subBot: `🛰️ *SUB-BOT REQUERIDO*\nFunción para sub-asistentes o creador.`
    }[type];
    if (msg) conn.reply(m.chat, `*¡AVISO!* ⚠️\n\n${msg}`, m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.cyan("➜ Handler.js actualizado correctamente."));
    if (global.conns) {
        for (const u of global.conns.filter(c => c.user && c.ws?.socket?.readyState !== ws.CLOSED)) {
            u.subreloadHandler?.(false);
        }
    }
});
