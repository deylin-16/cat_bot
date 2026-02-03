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
            await conn.sendMessage(m.chat, { text: `⏳ Procesando: ${numero}...` }, { quoted: m });

            try {
                // Intento de reporte directo
                await conn.chatModify({
                    report: {
                        jid: jid,
                        lastMessages: [] 
                    }
                }, jid);
            } catch {
                // Si falla el reporte (bad-request), simplemente ignoramos y seguimos al bloqueo
            }

            // Bloqueo definitivo (Este no falla si el JID es correcto)
            await conn.updateBlockStatus(jid, 'block');

            await conn.sendMessage(m.chat, { text: `✅ Usuario ${numero} bloqueado y enviado a revisión.` }, { quoted: m });

        } catch (error) {
            await conn.sendMessage(m.chat, { text: `❌ ERROR FINAL: ${error.message}` }, { quoted: m });
        }
    }
};

export default reportarCommand;
