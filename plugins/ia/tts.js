import axios from 'axios';

const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;

        try {
            await m.react('🗣️');

            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;

            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://translate.google.com/',
                    'Origin': 'https://translate.google.com'
                }
            });

            if (res.status !== 200) throw new Error('Google bloqueó la petición');

            const buffer = Buffer.from(res.data);

            await conn.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: 'audio/mpeg', 
                ptt: true 
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            console.error('Error en TTS:', error.message);
            await m.react('❌');
        }
    }
};

export default ttsCommand;
