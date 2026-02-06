import fetch from 'node-fetch';

const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;
        try {
            await m.react('🗣️');
            
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;

            const res = await fetch(url);
            const buffer = await res.buffer(); 

            await conn.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: 'audio/mpeg',
                ptt: true 
            }, { quoted: m });

            await m.react('✅');
        } catch (err) {
            console.error(err);
            await m.react('❌');
        }
    }
};

export default ttsCommand;
