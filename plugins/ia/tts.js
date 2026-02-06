import fetch from 'node-fetch';

const ttsCommand = {
    name: 'tts',
    alias: ['voz'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;
        try {
            await m.react('⏳');
            
            // Reemplaza con tu URL de Vercel
            const vUrl = `https://api.deylin.xyz/api/ai/text/tts?text=${encodeURIComponent(text)}`;

            const res = await fetch(vUrl);
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
