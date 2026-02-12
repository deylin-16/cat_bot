import axios from 'axios';
import { Buffer } from 'node:buffer';

const transcribeCommand = {
    name: 'transcribir',
    alias: ['leer', 'stt', 'transcribe'],
    category: 'tools',
    run: async (m, { conn }) => {
        const q = m.quoted ? m.quoted : m;
        try {
            const mime = (q.msg || q).mimetype || '';
            
            if (!/audio|video/.test(mime)) {
                return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un audio, nota de voz o video.');
            }

            await m.react('⏳');

            const buffer = await q.download();
            if (!buffer) throw new Error('No se pudo descargar el archivo.');

            const isVideo = /video/.test(mime);
            const fileName = isVideo ? 'video.mp4' : 'voice.ogg';

            const text = await getTranscription(buffer, fileName);

            await conn.sendMessage(m.chat, { 
                text: `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n❖ 𝗧𝗘𝗫𝗧𝗢: ${text}`
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            console.error(error);
            await m.react('❌');
            m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: ${error.message}`);
        }
    }
};

async function getTranscription(buffer, fileName) {
    const googleUrl = 'https://script.google.com/macros/s/AKfycbxW7WtTEm7-o-hFjrf6bT6uV65B8kwuoUic8qq14ChjxMYiytoO97LIQ-OwWUEilZvzIQ/exec';

    const { data } = await axios.post(googleUrl, {
        audio: buffer.toString('base64'),
        name: fileName
    }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 segundos de espera
    });

    if (!data.status) throw new Error(data.error);

    // Si Google no encuentra texto, a veces devuelve el nombre del archivo
    if (data.text.includes(fileName)) return "No se encontró voz clara.";
    
    return data.text;
}

export default transcribeCommand;
