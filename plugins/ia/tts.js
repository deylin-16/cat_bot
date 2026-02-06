import fetch from 'node-fetch';

const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;
        try {
            await m.react('⏳');
            
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;

            // Descargamos el buffer (esto es lo que asegura que se envíe)
            const res = await fetch(url);
            const buffer = await res.buffer();

            await conn.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: 'audio/mpeg',
                ptt: false // <--- FALSO para que se envíe como MP3 normal
            }, { quoted: m });

            await m.react('✅');
        } catch (err) {
            console.error(err);
            await m.react('❌');
        }
    }
};

export default ttsCommand;
