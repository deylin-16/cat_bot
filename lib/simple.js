import { jidNormalizedUser, get } from '@whiskeysockets/baileys';
import { randomBytes } from 'crypto';
import proto from '@whiskeysockets/baileys/lib/WAProto/index.js';

const { protoType } = proto;

export function protoType() {
    Object.assign(protoType, {
        async delete(conn) {
            await conn.sendMessage(this.chat, { delete: this.key });
        },
        reply: function(text, chat, options) {
            return conn.sendMessage(chat ? chat : this.chat, { text: text }, { quoted: this, ...options });
        },
    });
}

export function serialize(conn) {
    if (!conn) return;

    // Definir la utilidad faltante en la conexión (conn)
    if (!conn.normalizeJid) {
        conn.normalizeJid = jid => {
            return jidNormalizedUser(jid);
        }
    }

    if (!conn.generateMessageTag) {
        conn.generateMessageTag = () => String(randomBytes(3).readUIntBE(0, 3)).padStart(6, 0);
    }
}

export function smsg(conn, m, store) {
    if (!m) return m;

    let k;
    try {
        k = m.key ? m.key.id : randomBytes(16).toString('hex').toUpperCase();
    } catch (e) {
        k = randomBytes(16).toString('hex').toUpperCase();
    }
    
    m.id = k;
    m.isBaileys = m.id?.startsWith('BAE5') && m.id?.length === 16;
    m.chat = conn.normalizeJid(m.key.remoteJid);
    m.fromMe = m.key.fromMe;
    m.sender = conn.normalizeJid(m.key.fromMe ? conn.user.jid : m.key.participant || m.key.remoteJid);
    m.text = m.message?.extendedTextMessage?.text || m.message?.conversation || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
    m.isGroup = m.chat.endsWith('@g.us');
    m.isMedia = !!(m.message?.imageMessage || m.message?.videoMessage || m.message?.audioMessage || m.message?.stickerMessage || m.message?.documentMessage);
    m.timestamp = typeof m.messageTimestamp === 'number' ? m.messageTimestamp * 1000 : null;

    if (m.isGroup) {
        m.metadata = conn.chats[m.chat]?.metadata || {};
    }

    if (m.quoted) {
        let q = m.quoted;
        q.isBaileys = q.id?.startsWith('BAE5') && q.id?.length === 16;
        q.chat = conn.normalizeJid(q.key.remoteJid);
        q.fromMe = q.key.fromMe;
        q.sender = conn.normalizeJid(q.key.fromMe ? conn.user.jid : q.key.participant || q.key.remoteJid);
        q.text = q.message?.extendedTextMessage?.text || q.message?.conversation || q.message?.imageMessage?.caption || q.message?.videoMessage?.caption || '';
    }

    m.reply = function (text, options) {
        return conn.sendMessage(m.chat, { text: text }, { quoted: m, ...options });
    }

    m.getQuotedObj = async () => {
        if (!m.quoted) return false;
        let q = m.quoted;
        let obj = await store.loadMessage(q.chat, q.id);
        return smsg(conn, obj, store);
    }

    return m;
}
