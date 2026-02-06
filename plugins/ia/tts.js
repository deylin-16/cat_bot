const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;
        try {
            await m.react('🗣️');
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;
            await conn.sendMessage(m.chat, { 
                audio: { url }, 
                mimetype: 'audio/mpeg'
            }, { quoted: m });
            await m.react('✅');
        } catch {
            await m.react('❌');
        }
    }
};
export default ttsCommand;
