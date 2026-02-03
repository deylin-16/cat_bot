const reportarCommand = {
    name: 'reportar',
    alias: ['report', 'block'],
    category: 'owner',
    run: async (m, { conn, text, isROwner }) => {
        if (!isROwner) return;

        if (!text) return await conn.sendMessage(m.chat, { text: '❌ Ingrese el número.' }, { quoted: m });

        const numero = text.replace(/[^0-9]/g, '');
        const jid = `${numero}@s.whatsapp.net`;

        try {
            await conn.sendMessage(m.chat, { text: `⏳ Procesando reporte y bloqueo para: ${numero}...` }, { quoted: m });

            await conn.query({
                tag: 'status',
                attrs: { unread: '0', display_name: numero },
                content: [
                    {
                        tag: 'report',
                        attrs: { jid: jid, spam: 'true' }
                    }
                ]
            });

            await new Promise(resolve => setTimeout(resolve, 1500));

            await conn.updateBlockStatus(jid, 'block');

            await conn.sendMessage(m.chat, { text: `✅ Usuario ${numero} reportado y bloqueado con éxito.` }, { quoted: m });

        } catch (error) {
            try {
                await conn.updateBlockStatus(jid, 'block');
                await conn.sendMessage(m.chat, { text: `⚠️ Reporte manual falló, pero el usuario fue BLOQUEADO.\n*LOG:* ${error.message}` }, { quoted: m });
            } catch (err2) {
                await conn.sendMessage(m.chat, { text: `❌ ERROR CRÍTICO\n*LOG:* ${error.message}` }, { quoted: m });
            }
        }
    }
};

export default reportarCommand;
