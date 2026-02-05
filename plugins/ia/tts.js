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
            if (!res.ok) throw new Error();
            
            const buffer = Buffer.from(await res.arrayBuffer());

            await conn.sendMessage(m.chat, { 
                audio: buffer, 
                ptt: true 
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            console.error(error);
            await m.react('❌');
        }
    }
};

export default ttsCommand;
