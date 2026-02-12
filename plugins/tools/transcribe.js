import axios from 'axios';
import { Buffer } from 'node:buffer';
import speech from 'google-speech-from-buffer';

const transcribeCommand = {
    name: 'transcribir',
    alias: ['leer', 'stt', 'transcribe'],
    category: 'tools',
    run: async (m, { conn }) => {
        const q = m.quoted ? m.quoted : m;
        try {
            const mime = (q.msg || q).mimetype || '';
            
            if (!/audio|video/.test(mime)) {
                return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un audio o video.');
            }

            await m.react('⏳');

            const buffer = await q.download();
            if (!buffer) throw new Error('No se pudo descargar el archivo.');

            // Transcripción usando el motor público de Google
            // 'es-HN' para español de Honduras o 'es-ES'
            const text = await speech('es-HN', buffer);

            if (!text) throw new Error('No se detectó texto legible.');

            await conn.sendMessage(m.chat, { 
                text: `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n❖ 𝗧𝗘𝗫𝗧𝗢: ${text}`
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            console.error(error);
            await m.react('❌');
            m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: ${error.message === 'No se detectó texto legible.' ? error.message : 'El servidor de Google rechazó la petición o el audio es muy corto.'}`);
        }
    }
};

export default transcribeCommand;
