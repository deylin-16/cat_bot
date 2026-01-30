import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import fetch from 'node-fetch';

const isNumber = x => typeof x === 'number' && !isNaN(x);

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate?.messages?.[0]) return;
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.key.remoteJid;
    let user, chat, plugin;

    const mainBotJid = global.conn?.user?.jid;
    const isSubAssistant = conn.user.jid !== mainBotJid;

    if (chatJid.endsWith('@g.us')) {
        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, primaryBot: '' };
        chat = global.db.data.chats[chatJid];
        
        const isROwner = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net').includes(m.sender || m.key.participant);
        const textRaw = (m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || '').trim();
        const isPriorityCommand = /^[.#\/](prioridad|primary|setbot)/i.test(textRaw);

        if (chat?.primaryBot && chat.primaryBot !== conn.user.jid) {
            if (!isROwner && !isPriorityCommand) return;
        }

        if (isSubAssistant && !chat?.primaryBot) {
            const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
            const participants = groupMetadata?.participants || [];
            if (participants.some(p => p.id === mainBotJid)) return;
        }
    }

    m = smsg(conn, m) || m;
    if (!m || m.isBaileys) return;

    const senderJid = m.sender;
    global.db.data.users[senderJid] ||= { exp: 0, bitcoins: 0, muto: false };
    user = global.db.data.users[senderJid];
    chat ||= global.db.data.chats[chatJid];

    const prefixRegex = /^[.#\/]/;
    const isCmd = prefixRegex.test(m.text || '');

    if (!isCmd) {
        for (const p of Object.values(global.plugins)) {
            if (p.before && typeof p.before === 'function') {
                if (await p.before.call(conn, m, { conn, chatUpdate })) return;
            }
            if (p.all && typeof p.all === 'function') {
                await p.all.call(conn, m, { chatUpdate });
            }
        }
        return;
    }

    const match = m.text.trim().match(prefixRegex);
    const usedPrefix = match[0];
    const noPrefixText = m.text.slice(usedPrefix.length).trim();
    const args = noPrefixText.split(/\s+/).filter(v => v);
    const command = (args.shift() || '').toLowerCase();
    const text = args.join(' ');

    const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
    plugin = global.plugins.get(pluginName);

    if (plugin) {
        if (plugin.disabled) return;
        const isROwner = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net').includes(senderJid);
        const isOwner = isROwner || m.fromMe;
        
        let isAdmin = false, isBotAdmin = false;
        if (m.isGroup) {
            const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
            const participants = groupMetadata.participants || [];
            const user2 = participants.find(p => p.id === senderJid) || {};
            const bot = participants.find(p => p.id === conn.user.jid) || {};
            isAdmin = user2?.admin || false;
            isBotAdmin = bot?.admin || false;
        }

        const checkPermissions = (perm) => ({
            rowner: isROwner, owner: isOwner, group: m.isGroup, 
            botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup
        }[perm]);

        for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private']) {
            if (plugin[perm] && !checkPermissions(perm)) {
                global.dfail(perm, m, conn);
                return;
            }
        }

        m.isCommand = true;
        try {
            const runFunc = typeof plugin === 'function' ? plugin : plugin.run;
            await runFunc.call(conn, m, { usedPrefix, noPrefix: text, args, command, text, conn, user, chat, isROwner, isOwner, isAdmin, isBotAdmin, isSubAssistant, chatUpdate });
        } catch (e) {
            console.error(e);
            m.reply(format(e));
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
        botAdmin: `Dame admin bro para seguir.`
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    if (global.conns) {
        for (const u of global.conns.filter(c => c.user && c.ws?.readyState === ws.OPEN)) {
            if (u.subreloadHandler) u.subreloadHandler(false);
        }
    }
});
