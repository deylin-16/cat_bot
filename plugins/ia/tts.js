const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;

        try {
            await m.react('🗣️');

            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;

            // En lugar de bajar el buffer manualmente, dejamos que Baileys maneje el flujo
            await conn.sendMessage(m.chat, { 
                audio: { url: url }, 
                mimetype: 'audio/mpeg', 
                ptt: true,
                waveform: [0,0,10,20,30,40,50,60,70,80,90,100] // Esto ayuda a que WhatsApp lo procese como audio real
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            console.error('Error enviando audio:', error);
            await m.react('❌');
        }
    }
};

export default ttsCommand;
