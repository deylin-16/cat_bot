import { jidNormalizedUser, getContentType, proto, downloadContentFromMessage, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessage, delay } from '@whiskeysockets/baileys';
import fs from 'fs';

export const smsg = (conn, m) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = jidNormalizedUser(m.fromMe ? conn.user.id : m.participant || m.key.participant || m.chat || '');
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype === 'viewOnceMessageV2') ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype];
        m.text = m.msg?.text || m.msg?.caption || m.msg?.contentText || m.message?.conversation || m.msg?.selectedDisplayText || m.msg?.title || '';
        
        const prefix = new RegExp('^[#!./]').test(m.text) ? m.text.substring(0, 1) : '/';
        m.isCommand = m.text.startsWith(prefix);
        m.command = m.isCommand ? m.text.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : null;
        m.args = m.text.trim().split(/ +/).slice(1);
        m.query = m.args.join(' ');
        
        // Inyectar mentionedJid para que kiss.js no de error de 'undefined' (Captura 223367)
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
        
        m.quoted = m.msg?.contextInfo?.quotedMessage ? {
            key: {
                remoteJid: m.chat,
                fromMe: m.msg.contextInfo.participant === jidNormalizedUser(conn.user.id),
                id: m.msg.contextInfo.stanzaId,
                participant: m.msg.contextInfo.participant
            },
            message: m.msg.contextInfo.quotedMessage
        } : null;
        
        if (m.quoted) {
            m.quoted.mtype = getContentType(m.quoted.message);
            m.quoted.msg = m.quoted.message[m.quoted.mtype];
            m.quoted.text = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted.msg?.contentText || m.quoted.message?.conversation || '';
            m.quoted.sender = jidNormalizedUser(m.msg.contextInfo.participant);
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.mentionedJid = m.quoted.msg?.contextInfo?.mentionedJid || [];
            m.quoted.download = () => conn.downloadM(m.quoted.msg, m.quoted.mtype.replace('Message', ''));
        }
    }

    // Compatibilidad para Pinterest (Captura 223367)
    conn.generateWAMessageFromContent = generateWAMessageFromContent;
    conn.generateWAMessage = generateWAMessage;
    conn.relayMessage = conn.relayMessage;
    conn.delay = delay;

    // Métodos de respuesta (Captura 223270)
    conn.reply = (jid, text, quoted, options) => conn.sendMessage(jid, { text, mentions: conn.parseMention(text) }, { quoted, ...options });
    m.reply = (text, chat = m.chat, options = {}) => conn.reply(chat, text, m, options);
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

    // Descarga de archivos (Captura 223315)
    conn.downloadM = async (message, type) => {
        let stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    };

    conn.parseMention = (text = '') => [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
    m.delete = () => conn.sendMessage(m.chat, { delete: m.key });

    return m;
};
