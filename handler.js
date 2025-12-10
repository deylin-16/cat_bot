import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { randomBytes, createHash } from 'crypto';
import fetch from 'node-fetch';

const isNumber = x => typeof x === 'number' && !isNaN(x);
const MAX_EXECUTION_TIME = 6000000000;

async function sendUniqueError(conn, error, origin, m) {
    if (typeof global.sentErrors === 'undefined') {
        global.sentErrors = new Set();
    }
    
    let errorText = format(error);
    if (global.APIKeys && Object.values(global.APIKeys).length > 0) {
        const regex = new RegExp(Object.values(global.APIKeys).join('|'), 'g');
        errorText = errorText.replace(regex, 'KEY_CENSURADA');
    }
    const hash = createHash('sha256').update(errorText).digest('hex');

    if (global.sentErrors.has(hash)) {
        return;
    }

    const targetJid = '50432955554@s.whatsapp.net';
    const messageBody = `
🚨 *ERROR CRÍTICO DETECTADO* 🚨

*Origen:* ${origin}
*Chat:* ${m?.chat || 'N/A'}
*Comando:* ${m?.plugin || 'N/A'}

*Detalles del Error:*
${errorText.substring(0, 1500)}
    `;

    try {
        await conn.sendMessage(targetJid, { text: messageBody });
        global.sentErrors.add(hash);
        console.log(`Error único enviado a ${targetJid}. Hash: ${hash}`);
    } catch (sendError) {
        console.error(`Fallo al enviar el error de notificación:`, sendError);
    }
}

async function getLidFromJid(id, connection) {
    if (!connection || typeof connection.onWhatsApp !== 'function') return id; 
    if (id.endsWith('@lid')) return id;
    const res = await connection.onWhatsApp(id).catch(() => []);
    return res[0]?.lid || id;
}

function smsg(conn, m, store) {
    if (!m) return m;

    try {
        let k;
        try {
            k = m.key?.id ? m.key.id : randomBytes(16).toString('hex').toUpperCase();
        } catch (e) {
            k = randomBytes(16).toString('hex').toUpperCase();
        }

        m.id = k;
        m.isBaileys = m.id?.startsWith('BAE5') && m.id?.length === 16;
        
        const normalizeJidSafe = (conn?.normalizeJid && typeof conn.normalizeJid === 'function') ? conn.normalizeJid : ((jid) => jid);

        const remoteJid = m.key?.remoteJid || '';
        if (!remoteJid || !remoteJid.includes('@')) {
             console.log(`[smsg FAIL] Descartado: remoteJid inválido o nulo. Mensaje ID: ${m.id}`);
             return null; 
        }

        m.chat = normalizeJidSafe(remoteJid); 
        m.fromMe = m.key?.fromMe;
        
        const botJid = conn?.user?.jid || ''; 
        if (!botJid) {
             console.warn("[smsg FAIL] No se pudo obtener el JID del bot. Serialización incompleta.");
        }
        
        m.sender = normalizeJidSafe(m.key?.fromMe ? botJid : m.key?.participant || remoteJid);

        m.text = m.message?.extendedTextMessage?.text || m.message?.conversation || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
        m.text = m.text ? m.text.replace(/[\u200e\u200f]/g, '').trim() : ''; 
        m.mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []; 
        m.isGroup = m.chat.endsWith('@g.us');
        m.isMedia = !!(m.message?.imageMessage || m.message?.videoMessage || m.message?.audioMessage || m.message?.stickerMessage || m.message?.documentMessage);
        m.timestamp = typeof m.messageTimestamp === 'number' ? m.messageTimestamp * 1000 : null;

        if (m.isGroup) {
            m.metadata = conn.chats[m.chat]?.metadata || {};
        }

        if (m.quoted) {
            let q = m.quoted;
            q.isBaileys = q.id?.startsWith('BAE5') && q.id?.length === 16;
            q.chat = normalizeJidSafe(q.key?.remoteJid || '');
            q.fromMe = q.key?.fromMe;
            q.sender = normalizeJidSafe(q.key?.fromMe ? botJid : q.key?.participant || q.key?.remoteJid || '');
            q.text = q.message?.extendedTextMessage?.text || q.message?.conversation || q.message?.imageMessage?.caption || q.message?.videoMessage?.caption || '';
        }

        return m;

    } catch (e) {
        console.error("Error grave en smsg - Objeto 'm' inválido (descartado):", m, e); 
        return null; 
    }
}

function getSafeChatData(jid) {
    if (!global.db.data || !global.db.data.chats) return null;
    if (!global.db.data.chats[jid]) {
        global.db.data.chats[jid] = {
            isBanned: false,
            sAutoresponder: '',
            welcome: true,
            autolevelup: false,
            autoresponder: false,
            delete: false,
            autoAceptar: false,
            autoRechazar: false,
            detect: true,
            antiBot: false,
            modoadmin: false,
            antiLink: true,
            nsfw: false,
            expired: 0,
            autoresponder2: true,
            per: [],
        };
    }
    return global.db.data.chats[jid];
}

export async function handler(chatUpdate, store) {
    const startTime = Date.now();
    this.uptime = this.uptime || Date.now();
    const conn = this;

    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) {
        return;
    }

    let m = chatUpdate.messages[chatUpdate.messages.length - 1];

    if (!m || !m.key || !m.message || !m.key.remoteJid) return;

    if (m.message) {
        m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message;
        if (m.message.extendedTextMessage) {
            m.message.extendedTextMessage.text = m.message.extendedTextMessage.text?.replace(/[\u200e\u200f]/g, '').trim();
        }
    }

    m = smsg(conn, m, store) || m; 
    if (!m) return; 

    if (global.db.data == null) {
        try {
            await global.loadDatabase();
        } catch (e) {
            console.error("Fallo crítico al cargar la base de datos:", e);
            await sendUniqueError(conn, e, 'Handler Init LoadDB', m);
            return;
        }
    }
    
    if (global.db.data == null) return;
    
    if (typeof global.db.data.users !== 'object' || global.db.data.users === null) {
        global.db.data.users = {};
    }
    if (typeof global.db.data.chats !== 'object' || global.db.data.chats === null) {
        global.db.data.chats = {};
    }
    if (typeof global.db.data.settings !== 'object' || global.db.data.settings === null) {
        global.db.data.settings = {};
    }
    if (typeof global.db.data.stats !== 'object' || global.db.data.stats === null) {
        global.db.data.stats = {};
    }

    conn.processedMessages = conn.processedMessages || new Map();
    const now = Date.now();
    const lifeTime = 9000;
    const id = m.key.id;

    if (conn.processedMessages.has(id)) {
        return;
    }
    conn.processedMessages.set(id, now);
    for (const [msgId, time] of conn.processedMessages) {
        if (now - time > lifeTime) {
            conn.processedMessages.delete(msgId);
        }
    }

    try {
        m.exp = 0;
        m.coin = false;

        const senderJid = m.sender;
        const chatJid = m.chat;
        const botJid = conn.user?.jid || ''; 

        if (!chatJid || !chatJid.includes('@')) {
             console.error(`JID del chat inválido (REFORZADO): ${chatJid}. Mensaje descartado.`);
             return; 
        }
        
        if (!botJid) {
             console.error('El Bot JID es undefined. No se puede inicializar la configuración.');
        }

        const chat = getSafeChatData(chatJid);
        if (chat === null) {
            console.error('Error al acceder a los datos del chat, global.db.data es nulo o no está listo.');
            return;
        }

        const settingsJid = conn.user.jid;
        let settings = {};

        if (settingsJid) {
            global.db.data.settings[settingsJid] ||= {
                self: false,
                restrict: true,
                jadibotmd: true,
                antiPrivate: false,
                autoread: false,
                soloParaJid: false,
                status: 0
            };
            settings = global.db.data.settings[settingsJid];
        } else {
            console.error('Advertencia: No se pudo inicializar settings porque el botJid es nulo.');
        }

        global.db.data.users[senderJid] ||= {};
        const user = global.db.data.users[senderJid];

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

        let senderLid, botLid, groupMetadata, participants, user2, bot, isRAdmin, isAdmin, isBotAdmin;

        if (m.isGroup) {
            groupMetadata = (conn.chats[m.chat] || {}).metadata || await conn.groupMetadata(m.chat).catch(_ => null) || {};
            
            participants = (groupMetadata.participants || []).map(p => ({ 
                ...p, 
                id: p.jid, 
                jid: p.jid, 
                lid: p.lid || p.jid, 
                admin: p.admin 
            })); 

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
        let match = null;
        let command = '';
        let text = m.text;
        let args = [];

        for (const name in global.plugins) {
            if (Date.now() - startTime > MAX_EXECUTION_TIME) {
                 console.warn('Handler detenido: Excedido el tiempo de ejecución máximo.');
                 return;
            }

            const plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            const __filename = join(___dirname, name);

            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(conn, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    });
                } catch (e) {
                    console.error(`Error en plugin.all de ${name}:`, e);
                    await sendUniqueError(conn, e, `plugin.all: ${name}`, m);
                }
            }

            if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) {
                continue;
            }

            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix;

            const prefixes = Array.isArray(_prefix) ? _prefix : [_prefix];

            for (const p of prefixes) {
                const re = p instanceof RegExp ? p : new RegExp(str2Regex(p));
                const execResult = re.exec(m.text);
                if (execResult) {
                    match = [execResult, re];
                    break;
                }
            }

            if (match) {
                usedPrefix = match[0][0];
                const noPrefix = m.text.replace(usedPrefix, '');
                [command, ...args] = noPrefix.trim().split(/\s+/).filter(v => v);
                text = args.join(' ');
                command = (command || '').toLowerCase();
            } else {

                let isNewDetection = false;

                const isMentioned = m.mentionedJid.includes(botJid) || m.text.startsWith('@' + botJid.split('@')[0]);
                const isQuotedByBot = m.quoted && m.quoted.sender === botJid;

                if (isMentioned) {
                    const noMentionText = m.text.replace(new RegExp(`@${botJid.split('@')[0]}`, 'g'), '').trim();
                    [command, ...args] = noMentionText.split(/\s+/).filter(v => v);
                    text = args.join(' ');
                    command = (command || '').toLowerCase();
                    usedPrefix = '@'; 
                    isNewDetection = true;
                } else if (isQuotedByBot) {
                    [command, ...args] = m.text.trim().split(/\s+/).filter(v => v);
                    text = args.join(' ');
                    command = (command || '').toLowerCase();
                    usedPrefix = '>>'; 
                    isNewDetection = true;
                }

                if (!isNewDetection) continue;
            }

            if (typeof plugin.before === 'function') {
                const extraBefore = {
                    match, conn, participants, groupMetadata, user: global.db.data.users[m.sender], isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, chatUpdate, __dirname: ___dirname, __filename
                };
                try {
                    if (await plugin.before.call(conn, m, extraBefore)) {
                        continue;
                    }
                } catch (e) {
                    console.error(`Error en plugin.before de ${name}:`, e);
                    await sendUniqueError(conn, e, `plugin.before: ${name}`, m);
                    continue;
                }
            }

            const fail = plugin.fail || global.dfail;

            const isAccept = plugin.command instanceof RegExp ?
                plugin.command.test(command) :
                Array.isArray(plugin.command) ?
                    plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                    typeof plugin.command === 'string' ?
                        plugin.command === command :
                        false;

            global.comando = command;

            if (settings.soloParaJid && m.sender !== settings.soloParaJid) {
                continue;
            }

            if (!isAccept) continue;

            m.plugin = name;

            if (chat?.isBanned && !isROwner) return;
            if (chat?.modoadmin && !isOwner && !isROwner && m.isGroup && !isAdmin) return;

            const checkPermissions = (perm) => {
                const permissions = {
                    rowner: isROwner,
                    owner: isOwner,
                    group: m.isGroup,
                    botAdmin: isBotAdmin,
                    admin: isAdmin,
                    private: !m.isGroup,
                    restrict: !opts['restrict']
                };
                return permissions[perm];
            };

            const requiredPerms = ['rowner', 'owner', 'mods', 'premium', 'group', 'botAdmin', 'admin', 'private', 'restrict'];
            for (const perm of requiredPerms) {
                if (plugin[perm] && !checkPermissions(perm)) {
                    fail(perm, m, conn);
                    return;
                }
            }

            m.isCommand = true;
            m.usedPrefix = usedPrefix;

            const xp = 'exp' in plugin ? parseInt(plugin.exp) : 10;
            m.exp += xp;

            const extra = {
                match, usedPrefix, noPrefix: text, args, command, text, conn, participants, groupMetadata, user: global.db.data.users[m.sender], isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, chatUpdate, __dirname: ___dirname, __filename
            };

            try {
                await plugin.call(conn, m, extra);
            } catch (e) {
                m.error = e;
                console.error(`Error de ejecución en plugin ${name}:`, e);
                await sendUniqueError(conn, e, `plugin.call: ${name}`, m); 

                const errorText = format(e).replace(new RegExp(Object.values(global.APIKeys).join('|'), 'g'), 'Administrador');
                m.reply(errorText);
            } finally {
                if (typeof plugin.after === 'function') {
                    try {
                        await plugin.after.call(conn, m, extra);
                    } catch (e) {
                        console.error(`Error en plugin.after de ${name}:`, e);
                        await sendUniqueError(conn, e, `plugin.after: ${name}`, m);
                    }
                }
            }
        }

    } catch (e) {
        console.error('Error no capturado en handler:', e);
        await sendUniqueError(conn, e, 'Handler Global', m); 
    } finally {
        if (m) {
            const finalUser = global.db.data.users[m.sender];
            if (finalUser) {
                if (finalUser.muto) {
                    await conn.sendMessage(m.chat, { delete: m.key });
                }
                finalUser.exp = (finalUser.exp || 0) + (m.exp || 0);
                finalUser.coin = (finalUser.coin || 0) - (m.coin ? m.coin * 1 : 0);
            }

            if (m.plugin) {
                const stats = global.db.data.stats;
                const now = Date.now();
                stats[m.plugin] ||= { total: 0, success: 0, last: 0, lastSuccess: 0 };
                const stat = stats[m.plugin];
                stat.total += 1;
                stat.last = now;
                if (!m.error) {
                    stat.success += 1;
                    stat.lastSuccess = now;
                }
            }
        }
    }
}

global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `
Solo con Deylin-Eliac hablo de eso w. 
`,
        owner: `Solo con Deylin-Eliac hablo de eso w. 
`,
        group: `Si quieres hablar de eso solo en grupos bro. `,
        private: `De ésto solo habló en privado güey.`,
        admin: `Solo los administradores me pueden decir que hacer. 
`,
        botAdmin: `Dame admin bro para seguir. 
`
    };
    if (messages[type]) {
        conn.reply(m.chat, messages[type], m);
    }
};

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.magenta("Se actualizo 'handler.js'"));
    if (global.conns && global.conns.length > 0) {
        const users = global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED);
        for (const user of users) {
            user.subreloadHandler(false);
        }
    }
});
