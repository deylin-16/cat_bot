import { getContentType, jidNormalizedUser, extractMessageContent, downloadContentFromMessage, proto } from '@whiskeysockets/baileys';

export const smsg = (conn, m) => {
    if (!m) return m;
    let v = m.key;
    m.id = v.id;
    m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
    m.chat = jidNormalizedUser(v.remoteJid);
    m.fromMe = v.fromMe;
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = jidNormalizedUser(m.fromMe ? conn.user.id : (v.participant || v.remoteJid));

    if (m.message) {
        m.type = getContentType(m.message);
        m.msg = extractMessageContent(m.message[m.type]);
        
        m.body = m.msg?.text || m.msg?.caption || m.msg?.conversation || m.msg?.extendedTextMessage?.text || m.msg?.selectedDisplayText || m.msg?.singleSelectReply?.selectedRowId || m.msg?.contextInfo?.externalAdReply?.title || '';
        m.text = m.body;
        m.prefix = /^[.#/!]/.test(m.body) ? m.body[0] : '';
        m.isCmd = !!m.prefix;
        m.command = m.isCmd ? m.body.slice(1).trim().split(/\s+/)[0].toLowerCase() : null;
        m.args = m.body.trim().split(/\s+/).slice(1);
        m.query = m.args.join(' ');
        
        m.mention = m.msg?.contextInfo?.mentionedJid || [];
        m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;
        m.mimetype = m.msg?.mimetype || '';
        
        m.quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo : null;
        if (m.quoted) {
            let qType = getContentType(m.quoted.quotedMessage);
            m.quoted.type = qType;
            m.quoted.msg = extractMessageContent(m.quoted.quotedMessage[qType]);
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = jidNormalizedUser(m.msg.contextInfo.remoteJid || m.chat);
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = jidNormalizedUser(m.msg.contextInfo.participant);
            m.quoted.fromMe = m.quoted.sender === jidNormalizedUser(conn.user.id);
            m.quoted.text = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted.msg?.conversation || m.quoted.msg?.extendedTextMessage?.text || '';
            m.quoted.mention = m.quoted.msg?.contextInfo?.mentionedJid || [];
            m.quoted.mimetype = m.quoted.msg?.mimetype || '';
            m.quoted.isMedia = !!m.quoted.mimetype;
            
            m.quoted.vM = proto.WebMessageInfo.fromObject({
                key: {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                },
                message: m.quoted.quotedMessage
            });

            m.quoted.download = () => conn.downloadMediaMessage(m.quoted.vM);
            m.quoted.delete = () => conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
        }
        
        m.name = m.pushName || 'User';
        m.limit = 0;
        m.exp = 0;
        m.bitcoins = 0;
        m.muto = false;
        m.premium = false;
    }

    m.reply = (text, chatId, options) => conn.sendMessage(chatId ? chatId : m.chat, { text: text, ...options }, { quoted: m });
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    m.download = () => conn.downloadMediaMessage(m);

    return m;
};

export const downloadMediaMessage = async (m) => {
    let type = getContentType(m.message);
    let msg = extractMessageContent(m.message[type]);
    let stream = await downloadContentFromMessage(msg, type.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
};

export const getPrivileges = async (conn, m) => {
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = global.owner?.some(([num]) => num.replace(/\D/g, '') + detectwhat === m.sender) || false;
    let isAdmin = false, isBotAdmin = false, groupMetadata = {};

    if (m.isGroup) {
        groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({}));
        const participants = groupMetadata.participants || [];
        const user = participants.find(p => p.id === m.sender);
        const bot = participants.find(p => p.id === jidNormalizedUser(conn.user.id));
        isAdmin = user?.admin?.includes('admin') || false;
        isBotAdmin = bot?.admin?.includes('admin') || false;
    }

    return {
        isROwner,
        isAdmin,
        isBotAdmin,
        isOwner: isROwner || m.fromMe,
        isGroup: m.isGroup,
        metadata: groupMetadata,
        participants: groupMetadata.participants || []
    };
};

export const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = jid.match(/(\d+)(:\d+)?@/gi)[0] || jid;
        return decode.replace(/:\d+@/gi, '@');
    }
    return jid;
};

export default { smsg, getPrivileges, decodeJid, downloadMediaMessage };
