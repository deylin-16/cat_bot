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
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const audioBuffer = Buffer.from(res.data);

            await conn.sendMessage(m.chat, { 
                audio: audioBuffer, 
                mimetype: 'audio/mpeg', 
                ptt: true 
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            console.error('Error en el TTS:', error);
            await m.react('❌');
        }
    }
};

export default ttsCommand;
