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
    if (!id) return '';
    if (id.endsWith('@lid')) return id;
    const res = await connection.onWhatsApp(id).catch(() => []);
    return res[0]?.lid || id;
}

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate?.messages?.[0]) return;
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    if (global.db.data == null) await global.loadDatabase();

    const chatJid = m.key.remoteJid;
    const MAIN_NUMBER = '50432569059';
    const currentJid = conn.user.jid;
    const currentNumber = currentJid.replace(/[^0-9]/g, '');
    const isMainBot = currentNumber === MAIN_NUMBER;

    global.db.data.chats[chatJid] ||= { 
        isBanned: false, 
        welcome: true, 
        detect: true, 
        antisub: false,
        customWelcome: '',
        mutos: []
    };

    const chat = global.db.data.chats[chatJid];
    if (!('welcome' in chat)) chat.welcome = true;
    if (!('detect' in chat)) chat.detect = true;
    if (!('mutos' in chat)) chat.mutos = [];

    if (chatJid.endsWith('@g.us')) {
        if (!isMainBot && chat.antisub) return;
        const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
        const participantsList = groupMetadata?.participants || [];

        if (isMainBot && !chat.antisub) {
            const activeSubBots = (global.conns || [])
                .filter(c => c.user && c.ws?.readyState === ws.OPEN)
                .map(c => c.user.jid.replace(/[^0-9]/g, ''));
            const isAnySubPresent = participantsList.some(p => activeSubBots.includes(p.id.replace(/[^0-9]/g, '')));
            if (isAnySubPresent) return;
        } else if (!isMainBot && !chat.antisub) {
            const isMainPresent = participantsList.some(p => p.id.replace(/[^0-9]/g, '') === MAIN_NUMBER);
            if (isMainPresent) return;
        }
    }

    m = smsg(conn, m) || m;
    if (!m || m.isBaileys) return;

    let user, plugin;
    const senderJid = m.sender;
    global.db.data.users[senderJid] ||= { exp: 0, muto: false, warnAntiLink: 0 };
    user = global.db.data.users[senderJid];

    const isROwner = global.owner.map(([num]) => num.replace(/\D/g, '') + (senderJid.includes('@lid') ? '@lid' : '@s.whatsapp.net')).includes(senderJid);
    const isOwner = isROwner || m.fromMe;

    let isAdmin = false, isBotAdmin = false, participants = [];
    if (m.isGroup) {
        const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
        participants = groupMetadata.participants || [];
        const [senderLid, botLid] = await Promise.all([
            getLidFromJid(senderJid, conn),
            getLidFromJid(currentJid, conn)
        ]);
        const userInGroup = participants.find(p => p.id === senderLid || p.id === senderJid) || {};
        const botInGroup = participants.find(p => p.id === botLid || p.id === currentJid) || {};
        isAdmin = userInGroup?.admin === 'admin' || userInGroup?.admin === 'superadmin';
        isBotAdmin = !!botInGroup?.admin;
    }

    if (m.isGroup && chat.mutos.includes(m.sender) && !isAdmin && !isOwner) {
        return await conn.sendMessage(m.chat, { delete: m.key });
    }

    const prefixRegex = /^[.#\/]/;
    const textRaw = m.text || '';
    const isCmd = prefixRegex.test(textRaw);

    for (const name in global.plugins) {
        let p = global.plugins[name];
        if (p.before && typeof p.before === 'function') {
            if (await p.before.call(conn, m, { conn, participants, isROwner, isOwner, isAdmin, isBotAdmin, chat })) continue;
        }
    }

    if (!isCmd) return;

    const match = textRaw.match(prefixRegex);
    const usedPrefix = match[0];
    const noPrefixText = textRaw.slice(usedPrefix.length).trim();
    const args = noPrefixText.split(/\s+/).filter(v => v);
    const command = (args.shift() || '').toLowerCase();
    const text = args.join(' ');

    plugin = global.plugins[command] || Object.values(global.plugins).find(p => p.alias && p.alias.includes(command));

    if (plugin) {
        if (plugin.disabled) return;
        if (chat?.isBanned && !isROwner) return;

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
        rowner: `> ╰❒ Solo mí creador puede usar esté comando.`,
        owner: `> ╰❒ Solo mí creador puede usar esté comando.`,
        group: `> ╰✎ Esté comando sólo se puede usar en grupos.`,
        private: `De ésto solo habló en privado güey.`,
        admin: `> ╰♛ Sólo los administradores pueden ejecutar este comando.`,
        botAdmin: `> ╰✰ Necesito tener administrador para ejercitar está acción.`
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m);
};
