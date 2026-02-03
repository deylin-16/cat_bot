const reportarCommand = {
    name: 'reportar',
    alias: ['report', 'block'],
    category: 'owner',
    run: async (m, { conn, text, isROwner }) => {
        if (!isROwner) return;

        if (!text) return await conn.sendMessage(m.chat, { text: '❌ Ingrese el número.' }, { quoted: m });

        try {
            // 1. Limpieza extrema del número
            const cleanNumber = text.replace(/\D/g, '');
            // 2. Normalización del JID (Esto evita el bad-request por formato)
            const jid = cleanNumber + '@s.whatsapp.net';

            await conn.sendMessage(m.chat, { text: `⏳ Ejecutando bloqueo para: ${cleanNumber}...` }, { quoted: m });

            // 3. Bloqueo usando el nodo de consulta directo (más bajo nivel)
            await conn.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'privacy',
                },
                content: [
                    {
                        tag: 'list',
                        attrs: { name: 'default' },
                        content: [
                            {
                                tag: 'item',
                                attrs: {
                                    value: jid,
                                    action: 'deny',
                                    type: 'jid',
                                },
                            }
                        ],
                    }
                ],
            });

            await conn.sendMessage(m.chat, { text: `✅ Usuario ${cleanNumber} bloqueado correctamente.` }, { quoted: m });

        } catch (error) {
            // 4. Último recurso si el nodo falla
            try {
                const jidFall = text.replace(/\D/g, '') + '@s.whatsapp.net';
                await conn.updateBlockStatus(jidFall, 'block');
                await conn.sendMessage(m.chat, { text: `✅ Bloqueado (vía fallback).` }, { quoted: m });
            } catch (err2) {
                await conn.sendMessage(m.chat, { text: `❌ ERROR DEFINITIVO: Verifique el número.` }, { quoted: m });
            }
        }
    }
};

export default reportarCommand;
