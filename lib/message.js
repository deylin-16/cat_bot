import { getContentType, extractMessageContent } from '@whiskeysockets/baileys';

export const smsg = (conn, m) => {
    if (!m.message) return m;
    m.type = getContentType(m.message);
    m.msg = extractMessageContent(m.message[m.type]);
    
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.sender = conn.decodeJid(m.fromMe ? conn.user.id : (m.key.participant || m.chat));
    
    m.body = m.msg?.text || m.msg?.caption || m.msg?.conversation || m.message?.conversation || '';
    
    const prefixes = ['#', '.', '!', '/'];
    m.prefix = prefixes.find(p => m.body.startsWith(p)) || '';
    m.isCmd = !!m.prefix;
    m.command = m.isCmd ? m.body.slice(m.prefix.length).trim().split(/\s+/)[0].toLowerCase() : null;
    m.args = m.body.trim().split(/\s+/).slice(1);
    m.text = m.args.join(' ');
    m.reply = (text) => conn.sendMessage(m.chat, { text }, { quoted: m });

    return m;
};
