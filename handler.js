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
    const MAIN_BOT_JID = global.conn?.user?.jid || '';
    const MAIN_BOT_NUMBER = MAIN_BOT_JID.split('@')[0];
    const currentBotJid = conn.user.jid;
    const isSubAssistant = currentBotJid !== MAIN_BOT_JID;

    if (m.key.remoteJid.endsWith('@g.us') && isSubAssistant) {
        const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
        const participants = groupMetadata?.participants || [];
        const isMainBotPresent = participants.some(p => p.id === MAIN_BOT_JID);
        if (isMainBotPresent) return;
    }

    m = smsg(conn, m) || m;
    if (!m || m.isBaileys) return;

    let user, chat, plugin;
    const senderJid = m.sender;

    global.db.data.users[senderJid] ||= { exp: 0, muto: false };
    global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, detect: true };

    user = global.db.data.users[senderJid];
    chat = global.db.data.chats[chatJid];

    const prefixRegex = /^[.#\/]/;
    const textRaw = m.text || '';
    const isCmd = prefixRegex.test(textRaw);

    if (!isCmd) {
        for (const p of Array.from(global.plugins.values())) {
            if (p.before && typeof p.before === 'function') {
                if (await p.before.call(conn, m, { conn, chatUpdate })) return;
            }
        }
        return;
    }

    const match = textRaw.match(prefixRegex);
    const usedPrefix = match[0];
    const noPrefixText = textRaw.slice(usedPrefix.length).trim();
    const args = noPrefixText.split(/\s+/).filter(v => v);
    const command = (args.shift() || '').toLowerCase();
    const text = args.join(' ');

    const pluginName = global.plugins.has(command) ? command : (global.aliases.get(command) || null);
    plugin = pluginName ? global.plugins.get(pluginName) : null;

    if (plugin) {
        if (plugin.disabled) return;
        const isROwner = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net').includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        let isAdmin = false, isBotAdmin = false;
        if (m.isGroup) {
            const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
            const participants = groupMetadata.participants || [];
            const user2 = participants.find(p => p.id === senderJid) || {};
            const bot = participants.find(p => p.id === currentBotJid) || {};
            isAdmin = user2?.admin || false;
            isBotAdmin = bot?.admin || false;
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

        m.isCommand = true;
        try {
            await plugin.run.call(conn, m, { 
                usedPrefix, noPrefix: text, args, command, text, 
                conn, user, chat, isROwner, isOwner, isAdmin, 
                isBotAdmin, isSubAssistant, chatUpdate, participants: m.isGroup ? (await conn.groupMetadata(chatJid)).participants : []
            });
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
