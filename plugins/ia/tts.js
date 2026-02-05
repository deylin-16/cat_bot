const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;

        try {
            await m.react('🗣️');

            const speed = 1.0;
            const lang = 'es';
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&total=1&idx=0&textlen=${text.length}&client=tw-ob&prev=input&ttsspeed=${speed}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error();
            
            const buffer = Buffer.from(await response.arrayBuffer());

            await conn.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: 'audio/mpeg', 
                ptt: true 
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            await m.react('❌');
        }
    }
};

export default ttsCommand;
