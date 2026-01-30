import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import fetch from 'node-fetch';

const isNumber = x => typeof x === 'number' && !isNaN(x);

const lidCache = new Map();
async function getLidFromJid(id, connection) {
    if (id.endsWith('@lid')) return id;
    if (lidCache.has(id)) return lidCache.get(id);
    const res = await connection.onWhatsApp(id).catch(() => []);
    const lid = res[0]?.lid || id;
    lidCache.set(id, lid);
    return lid;
}

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate?.messages?.[0]) return;
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m || m.isBaileys) return;

    const str = (m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || '').trim();
    const prefixRegex = /^[.#\/]/;
    const isCmd = prefixRegex.test(str);

    if (!isCmd && !Object.values(global.plugins).some(p => p.all || p.before)) return;

    if (global.db.data == null) await global.loadDatabase();
    m = smsg(conn, m) || m;

    const chatJid = m.chat;
    const senderJid = m.sender;
    let user, chat, plugin;

    try {
        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, primaryBot: '' };
        global.db.data.users[senderJid] ||= { exp: 0, bitcoins: 0, muto: false };

        user = global.db.data.users[senderJid];
        chat = global.db.data.chats[chatJid];
        
        const isROwner = global.owner.map(([num]) => num.replace(/\D/g, '') + '@s.whatsapp.net').includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        if (chat.primaryBot && chat.primaryBot !== conn.user.jid && !isROwner) {
            const isPriorityCommand = /^(prioridad|primary|setbot)/i.test(str.slice(1).trim());
            if (!isPriorityCommand) return;
        }

        let usedPrefix, noPrefixText, args, command, text;
        if (isCmd) {
            const match = str.match(prefixRegex);
            usedPrefix = match[0];
            noPrefixText = str.slice(usedPrefix.length).trim();
            args = noPrefixText.split(/\s+/).filter(v => v);
            command = (args.shift() || '').toLowerCase();
            text = args.join(' ');
        }

        const pluginName = global.plugins.has(command) ? command : global.aliases.get(command);
        plugin = global.plugins.get(pluginName);

        if (plugin && isCmd) {
            if (plugin.disabled) return;
            if (chat.isBanned && !isROwner) return;

            let isAdmin = false, isBotAdmin = false;
            if (m.isGroup && (plugin.admin || plugin.botAdmin)) {
                const groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
                const participants = groupMetadata.participants || [];
                const botJid = conn.user.jid;
                const userAdmin = participants.find(p => p.id === senderJid);
                const botAdmin = participants.find(p => p.id === botJid);
                isAdmin = userAdmin?.admin || false;
                isBotAdmin = botAdmin?.admin || false;
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
            m.plugin = pluginName;

            const runFunc = typeof plugin === 'function' ? plugin : plugin.run;
            await runFunc.call(conn, m, { 
                usedPrefix, noPrefix: text, args, command, text, 
                conn, user, chat, isROwner, isOwner, isAdmin, isBotAdmin, chatUpdate 
            });
        }

        for (const p of Object.values(global.plugins)) {
            if (p.before && typeof p.before === 'function') {
                if (await p.before.call(conn, m, { conn, isROwner, isOwner, chatUpdate })) continue;
            }
            if (p.all && typeof p.all === 'function') {
                await p.all.call(conn, m, { chatUpdate });
            }
        }

    } catch (e) {
        console.error(e);
        if (m) m.reply(format(e));
    } finally {
        if (m && m.isCommand && user) {
            user.exp += plugin?.exp || 10;
            global.db.data.stats[m.plugin] ||= { total: 0, success: 0 };
            global.db.data.stats[m.plugin].total++;
            if (!m.error) global.db.data.stats[m.plugin].success++;
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
    console.log(chalk.magentaBright("Handler updated"));
});
