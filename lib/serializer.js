import { jidNormalizedUser, getContentType, proto, downloadContentFromMessage, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessage, delay, jidDecode, generateForwardMessageContent } from '@whiskeysockets/baileys';
import { getRealJid, resolveMentions } from './identifier.js';
import fs from 'fs';

export const smsg = async (conn, m) => {
    if (!m) return m;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');

        m.author = jidNormalizedUser(m.key.participant || m.key.remoteJid || m.participant || conn.user.id);

        m.sender = await getRealJid(conn, m.author, m);
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

        const rawMentions = m.msg?.contextInfo?.mentionedJid || [];
        m.mentionedJid = await resolveMentions(conn, rawMentions, m);

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

            m.quoted.author = jidNormalizedUser(m.msg.contextInfo.participant);
            m.quoted.sender = await getRealJid(conn, m.quoted.author, m);
            m.quoted.download = () => conn.downloadM(m.quoted.msg, m.quoted.mtype.replace('Message', ''));
        }
    }

    conn.generateWAMessageFromContent = generateWAMessageFromContent;
    conn.generateWAMessage = generateWAMessage;
    conn.prepareWAMessageMedia = prepareWAMessageMedia;
    conn.delay = delay;

    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    conn.getName = (jid) => {
        const id = conn.decodeJid(jid);
        if (id.endsWith('@g.us')) return new Promise(async (resolve) => {
            const metadata = await conn.groupMetadata(id).catch(() => ({}));
            resolve(metadata.subject || id.split('@')[0]);
        });
        return id === '0@s.whatsapp.net' ? 'WhatsApp' : id.split('@')[0];
    };

    conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype;
        if (options.readViewOnce) {
            message.message = message.message?.ephemeralMessage?.message || message.message || undefined;
            vtype = Object.keys(message.message.viewOnceMessage.message)[0];
            delete(message.message?.viewOnceMessage?.message[vtype]?.viewOnce);
            message.message = { ...message.message.viewOnceMessage.message };
        }
        let mtype = Object.keys(message.message)[0];
        let content = await generateForwardMessageContent(message, forceForward);
        let ctype = Object.keys(content)[0];
        let context = {};
        if (mtype != "conversation") context = message.message[mtype].contextInfo;
        content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
        const waMessage = generateWAMessageFromContent(jid, content, options ? { ...options, ...(context ? { contextInfo: { ...context, ...options.contextInfo } } : {}) } : {});
        await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
        return waMessage;
    };

    conn.reply = (jid, text, quoted, options) => conn.sendMessage(jid, { text, mentions: conn.parseMention(text) }, { quoted, ...options });
    m.reply = (text, chat = m.chat, options = {}) => conn.reply(chat, text, m, options);
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

    conn.downloadM = async (message, type) => {
        let stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    };

    conn.parseMention = (text = '') => [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');

    return m;
};
