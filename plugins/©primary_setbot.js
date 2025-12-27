let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.isGroup) return;

    if (text === 'off' || text === 'reset' || text === 'liberar') {
        global.db.data.chats[m.chat].primaryBot = '';
        return m.reply(`✅ Grupo liberado. Todos los asistentes pueden responder.`);
    }

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;

    if (!who) return m.reply(`Menciona al bot que quieres dejar como único asistente.\n\nEjemplo: ${usedPrefix + command} @bot\nPara resetear: ${usedPrefix + command} off`);

    global.db.data.chats[m.chat].primaryBot = who;

    await conn.sendMessage(m.chat, {
        text: `✅ Prioridad establecida.\nSolo @${who.split`@` [0]} responderá en este grupo.`,
        mentions: [who]
    }, { quoted: m });
};

handler.command = /^(prioridad|primary|setbot)$/i;
handler.rowner = true;

export default handler;