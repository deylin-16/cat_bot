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
            if (!/audio/.test(mime)) {
                return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a una nota de voz o audio.');
            }

            await m.react('⏳');

            const buffer = await q.download();
            const text = await getTranscription(buffer);

            await conn.sendMessage(m.chat, { 
                text: `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n❖ 𝗧𝗘𝗫𝗧𝗢: ${text}`
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            console.error(error);
            m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: ${error.message}`);
            await m.react('❌');
        }
    }
};

async function getTranscription(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Audio requerido');

    const proxyUrl = 'https://api.deylin.xyz/api/ai/transcribe';

    const { data } = await axios.post(proxyUrl, {
        audio: buffer.toString('base64'),
        name: 'voice.ogg'
    }, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (!data.status) throw new Error(data.error || 'Error server');

    return data.text;
}

export default transcribeCommand;
