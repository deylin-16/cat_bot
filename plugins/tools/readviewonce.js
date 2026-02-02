import { downloadMediaMessage } from '@whiskeysockets/baileys';

const readOnceCommand = {
    name: 'readviewonce',
    alias: ['ver', 'read', 'vv'],
    category: 'tools',
    run: async (m, { conn }) => {
        const q = m.quoted ? m.quoted : null;
        if (!q) return;

        const isViewOnce = q.msg?.viewOnce || q.viewOnce;
        if (!isViewOnce) return;

        try {
            await m.react('👁️');

            const buffer = await downloadMediaMessage(q, 'buffer', {}, { 
                reusedStaticNetworkKey: true 
            });

            if (!buffer) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Fallo al procesar el archivo.');

            const type = q.mtype;
            const originalCaption = q.text || q.caption || '';
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
            m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: El archivo ha expirado o no pudo ser descargado.');
        }
    }
};

export default readOnceCommand;
