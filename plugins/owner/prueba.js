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

            // 1. Reportar de forma asíncrona sin esperar respuesta eterna
            conn.query({
                tag: 'status',
                attrs: {},
                content: [
                    {
                        tag: 'report',
                        attrs: { jid: jid }
                    }
                ]
            }).catch(() => {}); 

            // 2. Bloqueo inmediato (Este es el que manda)
            await conn.updateBlockStatus(jid, 'block');

            await conn.sendMessage(m.chat, { text: `✅ Usuario ${numero} bloqueado y reportado.` }, { quoted: m });

        } catch (error) {
            await conn.sendMessage(m.chat, { text: `❌ ERROR: ${error.message}` }, { quoted: m });
        }
    }
};

export default reportarCommand;
