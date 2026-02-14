import { jidNormalizedUser, getContentType, downloadContentFromMessage, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessage, delay, jidDecode, generateForwardMessageContent } from '@whiskeysockets/baileys';
import { getRealJid, resolveMentions } from './identifier.js';
import fs from 'fs';

const groupCache = new Map();

export const smsg = async (conn, m) => {
    if (!m) return m;

    if (!conn.downloadM) {
        conn.downloadM = async (message, type) => {
            if (!message) return Buffer.from([]);
            try {
                let stream = await downloadContentFromMessage(message, type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                return buffer;
            } catch { return Buffer.from([]); }
        };

        conn.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } else return jid;
        };

        conn.getName = (jid) => {
            const id = conn.decodeJid(jid);
            if (id.endsWith('@g.us')) return groupCache.get(id)?.subject || id.split('@')[0];
            return id.split('@')[0];
        };

        conn.parseMention = (text = '') => {
            return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
        };

        conn.reply = (jid, text = '', quoted, options) => {
            return conn.sendMessage(jid, { text, mentions: conn.parseMention(text) }, { quoted: quoted || m, ...options });
        };
    }

    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.author = jidNormalizedUser(m.key.participant || m.key.remoteJid || conn.user.id);
        m.sender = await getRealJid(conn, m.author, m);
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype === 'viewOnceMessageV2') ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype];
        m.text = m.msg?.text || m.msg?.caption || m.msg?.contentText || m.message?.conversation || '';

        m.download = () => conn.downloadM(m.msg, m.mtype.replace('Message', ''));

        const prefix = /^[#!./]/.test(m.text) ? m.text.charAt(0) : '/';
        m.isCommand = m.text.startsWith(prefix);
        m.command = m.isCommand ? m.text.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : null;
        m.args = m.text.trim().split(/ +/).slice(1);
        m.query = m.args.join(' ');

        m.mentionedJid = await resolveMentions(conn, m.msg?.contextInfo?.mentionedJid || [], m);

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
            m.quoted.text = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted.message?.conversation || '';
            m.quoted.author = jidNormalizedUser(m.msg.contextInfo.participant);
            m.quoted.sender = await getRealJid(conn, m.quoted.author, m);
            m.quoted.download = () => conn.downloadM(m.quoted.msg, m.quoted.mtype.replace('Message', ''));
        }
    }

    m.reply = (text, chat = m.chat, options = {}) => conn.reply(chat, text, m, options);
    m.react = (emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

    return m;
};
