import { downloadMediaMessage } from '@whiskeysockets/baileys';

const readOnceCommand = {
    name: 'readviewonce',
    alias: ['ver', 'read', 'vv'],
    category: 'tools',
    run: async (m, { conn }) => {
        const q = m.quoted ? m.quoted : m;
        const msg = q.message?.viewOnceMessageV2?.message || q.message?.viewOnceMessage?.message || q.message;
        
        if (!msg) return;

        const type = Object.keys(msg)[0];
        if (!/image|video|audio/.test(type)) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un mensaje de "una sola vez".');

        try {
            await m.react('👁️');

            const buffer = await downloadMediaMessage(
                q,
                'buffer',
                {},
                { reusedStaticNetworkKey: true }
            );

            if (!buffer) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo obtener el buffer.');

            const originalCaption = msg[type]?.caption || '';
            const caption = originalCaption ? `❖ 𝗧𝗘𝗫𝗧𝗢: ${originalCaption}` : `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Contenido revelado`;

            if (/video/.test(type)) {
                await conn.sendMessage(m.chat, { video: buffer, caption }, { quoted: m });
            } else if (/image/.test(type)) {
                await conn.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
            } else if (/audio/.test(type)) {
                await conn.sendMessage(m.chat, { 
                    audio: buffer, 
                    mimetype: 'audio/mp4', 
                    ptt: true 
                }, { quoted: m });
            }

            await m.react('✅');

        } catch (e) {
            console.error(e);
            m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: El archivo ha expirado o falló la descarga.');
        }
    }
};

export default readOnceCommand;
