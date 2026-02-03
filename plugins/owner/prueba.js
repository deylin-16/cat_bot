const reportarCommand = {
    name: 'reportar',
    alias: ['report', 'block'],
    category: 'owner',
    run: async (m, { conn, text, isROwner }) => {
        if (!isROwner) return;

        if (!text) return await conn.sendMessage(m.chat, { text: '❌ Ingrese el número del usuario.' }, { quoted: m });

        const numero = text.replace(/[^0-9]/g, '');
        const jid = `${numero}@s.whatsapp.net`;

        try {
            await conn.sendMessage(m.chat, { text: `⏳ Procesando reporte y bloqueo para: ${numero}...` }, { quoted: m });

            await conn.chatModify({
                report: { jid: jid, lastMessages: [] },
                block: false
            }, jid);

            await new Promise(resolve => setTimeout(resolve, 2000));

            await conn.chatModify({
                report: { jid: jid, lastMessages: [] },
                block: true
            }, jid);

            await conn.sendMessage(m.chat, { text: `✅ Usuario ${numero} reportado doblemente y bloqueado con éxito.` }, { quoted: m });

        } catch (error) {
            console.error(error);
            await conn.sendMessage(m.chat, { text: `❌ *ERROR*\n\n*LOG:* ${error.message}` }, { quoted: m });
        }
    }
};

export default reportarCommand;
