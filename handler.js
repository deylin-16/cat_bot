import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';

const isNumber = x => typeof x === 'number' && !isNaN(x);

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate || !chatUpdate.messages) return;
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    const messageTimestamp = (m.messageTimestamp?.low || m.messageTimestamp || 0) * 1000;
    if (Date.now() - messageTimestamp > 10000) return; 

    m = smsg(conn, m) || m;
    if (!m) return;

    if (global.db.data == null) await global.loadDatabase();

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
        const chatJid = m.chat;

        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, detect: true, antiLink: true, modoadmin: false };
        let chat = global.db.data.chats[chatJid];

        const settingsJid = conn.user.jid;
        global.db.data.settings[settingsJid] ||= { self: false, restrict: true };
        const settings = global.db.data.settings[settingsJid];

        global.db.data.users[senderJid] ||= { exp: 0, coin: 0, muto: false };
        const user = global.db.data.users[senderJid];

        const isROwner = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net').includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        if (m.isBaileys || opts['nyimak'] || (!isROwner && opts['self'])) return;

        let isAdmin = false, isBotAdmin = false;
        if (m.isGroup) {
            const groupMetadata = (conn.chats[chatJid] || {}).metadata || await conn.groupMetadata(chatJid).catch(() => ({}));
            const participants = groupMetadata.participants || [];
            const bot = participants.find(p => p.id === conn.user.jid) || {};
            const userInGroup = participants.find(p => p.id === senderJid) || {};
            isAdmin = !!userInGroup?.admin;
            isBotAdmin = !!bot?.admin;
        }

        const prefixRegex = /[.#/!]/;

        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            const str = m.text || '';
            const match = prefixRegex.exec(str);
            const usedPrefix = match ? match[0] : '';
            const noPrefix = str.startsWith(usedPrefix) ? str.slice(usedPrefix.length).trim() : str;
            const [command] = noPrefix.split(/\s+/);
            
            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                             Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                             typeof plugin.command === 'string' ? plugin.command === command : false;

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, isROwner, isOwner, isAdmin, isBotAdmin, chatUpdate })) continue;
            }

            if (!isAccept) continue;
            m.plugin = name;
            global.comando = command;

            if (chat.isBanned && !isROwner) return;
            if (chat.modoadmin && !isAdmin && !isROwner) return;

            const check = {
                rowner: isROwner, owner: isOwner, group: m.isGroup, admin: isAdmin, botAdmin: isBotAdmin, private: !m.isGroup
            };

            let failType = Object.keys(check).find(key => plugin[key] && !check[key]);
            if (failType) {
                global.dfail(failType, m, conn);
                return;
            }

            try {
                await plugin.call(conn, m, { 
                    conn, usedPrefix, noPrefix, 
                    args: noPrefix.split(/\s+/).slice(1), 
                    command, 
                    text: noPrefix.split(/\s+/).slice(1).join(' '), 
                    isROwner, isAdmin, isBotAdmin 
                });
            } catch (e) {
                m.error = e;
                console.error(e);
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
        owner: `🛠️ *MODO OWNER*\nComando exclusivo para mis *Dueños*.`,
        group: `📢 *SOLO GRUPOS*\nEste comando solo funciona en grupos.`,
        private: `📧 *CHAT PRIVADO*\nUsa este comando en el privado del bot.`,
        admin: `🛡️ *ADMIN REQUERIDO*\nDebes ser *Administrador* del grupo.`,
        botAdmin: `🤖 *BOT SIN ADMIN*\nNecesito ser *Administrador* para ejecutar esto.`,
        restrict: `🚫 *RESTRICCIÓN*\nEsta función está desactivada.`
    }[type];
    if (msg) conn.reply(m.chat, `*¡AVISO!* ⚠️\n\n${msg}`, m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.cyan("➜ Handler.js actualizado correctamente."));
});
