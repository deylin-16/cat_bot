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

const mainBotJid = global.conn?.user?.jid; 

export async function handler(chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) {
        return;
    }

    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    m = smsg(conn, m) || m;
    if (!m) return;

    if (global.db.data == null) {
        await global.loadDatabase();
    }

    conn.processedMessages = conn.processedMessages || new Map();
    const now = Date.now();
    const lifeTime = 9000;
    const id = m.key.id;

    if (conn.processedMessages.has(id)) return;
    conn.processedMessages.set(id, now);

    for (const [msgId, time] of conn.processedMessages) {
        if (now - time > lifeTime) conn.processedMessages.delete(msgId);
    }

    try {
        m.exp = 0;
        m.coin = false;

        const senderJid = m.sender;
        const chatJid = m.chat;

        global.db.data.chats[chatJid] ||= {
            isBanned: false,
            sAutoresponder: '',
            welcome: true,
            autolevelup: false,
            autoresponder: true,
            delete: false,
            autoAceptar: false,
            autoRechazar: false,
            detect: true,
            antiBot: false,
            modoadmin: false,
            antiLink: true,
            nsfw: false,
            expired: 0,
            autoresponder2: false,
            per: [],
            welcomeMsg: '¡Bienvenido/a al grupo!'
        };

        const settingsJid = conn.user.jid;
        global.db.data.settings[settingsJid] ||= {
            self: false,
            restrict: true,
            jadibotmd: true,
            antiPrivate: false,
            autoread: false,
            soloParaJid: false,
            status: 0
        };

        if (typeof global.db.data.users[senderJid] !== 'object') global.db.data.users[senderJid] = {};
        const user = global.db.data.users[senderJid];
        const chat = global.db.data.chats[chatJid];
        const settings = global.db.data.settings[settingsJid];

        if (user) {
            if (!('exp' in user) || !isNumber(user.exp)) user.exp = 0;
            if (!('coin' in user) || !isNumber(user.coin)) user.coin = 0;
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
            groupMetadata = (conn.chats[m.chat] || {}).metadata || await conn.groupMetadata(m.chat).catch(_ => null) || {};
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

            const isSubAssistant = conn.user.jid !== mainBotJid;
            if (isSubAssistant && !isBotAdmin) return;

        } else {
            senderLid = m.sender;
            botLid = conn.user.jid;
            botJid = conn.user.jid;
            groupMetadata = {};
            participants = [];
            user2 = {};
            bot = {};
            isRAdmin = false;
            isAdmin = false;
            isBotAdmin = false;
        }

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
        let usedPrefix = ''; 

        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            const __filename = join(___dirname, name);

            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(conn, m, { chatUpdate, __dirname: ___dirname, __filename });
                } catch (e) {
                    if (!(e instanceof TypeError && e.message.includes('user'))) console.error(e);
                }
            }

            if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) continue;

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, chatUpdate, __dirname: ___dirname, __filename })) continue;
            }

            if (typeof plugin !== 'function') continue;

            let noPrefix = m.text.trim();
            if (!noPrefix) continue; 

            let [command, ...args] = noPrefix.split(/\s+/).filter(v => v);
            command = (command || '').toLowerCase();

            const isAccept = plugin.command instanceof RegExp ?
                plugin.command.test(command) :
                Array.isArray(plugin.command) ?
                    plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                    typeof plugin.command === 'string' ?
                        plugin.command === command :
                        false;

            if (!isAccept) continue;

            noPrefix = m.text.trim().substring(command.length).trim();
            let text = args.join(' ');
            args = noPrefix ? noPrefix.split(/\s+/).filter(v => v) : [];

            m.plugin = name;
            if (settings.soloParaJid && m.sender !== settings.soloParaJid) continue;
            if (chat?.isBanned && !isROwner) return;
            if (chat?.modoadmin && !isOwner && !isROwner && m.isGroup && !isAdmin) return;

            const checkPermissions = (perm) => ({
                rowner: isROwner, owner: isOwner, group: m.isGroup, botAdmin: isBotAdmin, admin: isAdmin, private: !m.isGroup, restrict: !opts['restrict']
            }[perm]);

            const requiredPerms = ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private', 'restrict'];
            for (const perm of requiredPerms) {
                if (plugin[perm] && !checkPermissions(perm)) {
                    global.dfail(perm, m, conn);
                    return;
                }
            }

            m.isCommand = true;
            m.exp += 'exp' in plugin ? parseInt(plugin.exp) : 10;

            try {
                await plugin.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, chatUpdate, __dirname: ___dirname, __filename });
            } catch (e) {
                m.error = e;
                m.reply(format(e));
            } finally {
                if (typeof plugin.after === 'function') {
                    try {
                        await plugin.after.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, participants, groupMetadata, user, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, chatUpdate, __dirname: ___dirname, __filename });
                    } catch (e) { console.error(e) }
                }
            }
        }
    } catch (e) { console.error(e) } finally {
        if (m && user) {
            if (user.muto) await conn.sendMessage(m.chat, { delete: m.key });
            user.exp += m.exp || 0;
            user.coin -= m.coin ? m.coin * 1 : 0;
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
    };
    if (messages[type]) conn.reply(m.chat, messages[type], m);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    if (global.conns && global.conns.length > 0) {
        for (const user of global.conns.filter(c => c.user && c.ws.socket?.readyState !== ws.CLOSED)) {
            user.subreloadHandler(false);
        }
    }
});
