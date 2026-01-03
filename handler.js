import { smsg } from './lib/simple.js';
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
    
    // Lógica de Prioridad para Grupos
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

    m = smsg(conn, m) || m;
    if (!m) return;

    conn.processedMessages = conn.processedMessages || new Map();
    const now = Date.now();
    const id = m.key.id;

    if (conn.processedMessages.has(id)) return;
    conn.processedMessages.set(id, now);

    // Limpieza de caché de mensajes procesados para no saturar RAM
    if (conn.processedMessages.size > 500) {
        const firstKey = conn.processedMessages.keys().next().value;
        conn.processedMessages.delete(firstKey);
    }

    let user; 
    try {
        const senderJid = m.sender;
        global.db.data.chats[chatJid] ||= { isBanned: false, welcome: true, antiLink: true, primaryBot: '' };
        if (typeof global.db.data.users[senderJid] !== 'object') global.db.data.users[senderJid] = {};
        
        user = global.db.data.users[senderJid];
        const chat = global.db.data.chats[chatJid];

        if (user) {
            if (!isNumber(user.exp)) user.exp = 0;
            if (!isNumber(user.coin)) user.coin = 0;
            if (!('muto' in user)) user.muto = false; 
        }

        const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
        const isROwner = global.owner.map(([number]) => number.replace(/[^0-9]/g, '') + detectwhat).includes(senderJid);
        const isOwner = isROwner || m.fromMe;

        if (m.isBaileys || (opts['nyimak'] && !isOwner)) return;
        if (!isROwner && opts['self']) return;
        if (typeof m.text !== 'string') m.text = '';

        let groupMetadata, participants, user2, bot, isAdmin, isBotAdmin;

        if (m.isGroup) {
            groupMetadata = await conn.groupMetadata(m.chat).catch(_ => null) || {};
            participants = groupMetadata.participants || [];
            user2 = participants.find(p => p.id === senderJid) || {};
            bot = participants.find(p => p.id === conn.user.jid) || {};
            isAdmin = user2?.admin || false;
            isBotAdmin = !!bot?.admin;
        }

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
        
        // Ejecución de Plugins
        for (const name in global.plugins) {
            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            if (typeof plugin.all === 'function') {
                try { await plugin.all.call(conn, m, { chatUpdate }); } catch (e) { console.error(e); }
            }

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(conn, m, { conn, participants, isROwner, isOwner, isAdmin, isBotAdmin, isSubAssistant })) continue;
            }

            if (typeof plugin !== 'function') continue;

            // Lógica de prefijos corregida
            const str2RegExp = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
            const _prefix = global.prefix || /^[#!./]/;
            const match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] : Array.isArray(_prefix) ? _prefix.map(p => {
                const reg = p instanceof RegExp ? p : new RegExp(str2RegExp(p));
                return [reg.exec(m.text), reg];
            }) : Object.entries(_prefix).map(([name, p]) => {
                const reg = p instanceof RegExp ? p : new RegExp(str2RegExp(p));
                return [reg.exec(m.text), reg];
            })).find(p => p[1]);

            let usedPrefix = (match[0] || [''])[0];
            let noPrefix = m.text.replace(usedPrefix, '');
            let [command, ...args] = noPrefix.trim().split(/\s+/).filter(v => v);
            command = (command || '').toLowerCase();

            const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
                             Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                             typeof plugin.command === 'string' ? plugin.command === command : false;

            if (!isAccept) continue;

            m.plugin = name;
            if (chat?.isBanned && !isROwner) return;

            // Verificación de Permisos
            if (plugin.rowner && !isROwner) { global.dfail('rowner', m, conn); continue; }
            if (plugin.owner && !isOwner) { global.dfail('owner', m, conn); continue; }
            if (plugin.group && !m.isGroup) { global.dfail('group', m, conn); continue; }
            if (plugin.admin && !isAdmin) { global.dfail('admin', m, conn); continue; }
            if (plugin.botAdmin && !isBotAdmin) { global.dfail('botAdmin', m, conn); continue; }
            if (plugin.subBot && !isSubAssistant && !isROwner) { global.dfail('subBot', m, conn); continue; }

            m.isCommand = true;
            let text = args.join(' ');

            try {
                await plugin.call(conn, m, { usedPrefix, noPrefix, args, command, text, conn, participants, isROwner, isOwner, isAdmin, isBotAdmin, isSubAssistant });
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
            if (m.plugin) {
                global.db.data.stats[m.plugin] ||= { total: 0, success: 0, last: 0 };
                global.db.data.stats[m.plugin].total++;
                global.db.data.stats[m.plugin].last = Date.now();
            }
        }
    }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `Solo con Deylin-Eliac hablo de eso w.`,
        owner: `Solo con Deylin-Eliac hablo de eso w.`,
        group: `Si quieres hablar de eso solo en grupos bro.`,
        admin: `Solo los administradores me pueden decir que hacer.`,
        botAdmin: `Dame admin bro para seguir.`,
        subBot: `Esta función solo la puede usar un sub-asistente o mi creador.`
    }[type];
    if (msg) conn.reply(m.chat, msg, m);
};
