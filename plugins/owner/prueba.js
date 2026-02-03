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
            await conn.sendMessage(m.chat, { text: `⏳ Bloqueando a: ${numero}...` }, { quoted: m });

            // Bloqueo directo por estatus (Método más estable de Baileys)
            await conn.updateBlockStatus(jid, 'block');

            await conn.sendMessage(m.chat, { text: `✅ Usuario ${numero} ha sido bloqueado exitosamente.` }, { quoted: m });

        } catch (error) {
            console.error(error);
            await conn.sendMessage(m.chat, { text: `❌ ERROR AL BLOQUEAR: ${error.message}` }, { quoted: m });
        }
    }
};

export default reportarCommand;
