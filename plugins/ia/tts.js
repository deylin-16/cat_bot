import gtts from 'node-gtts';

const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;

        try {
            await m.react('🗣️');

            const cleanText = text.replace(/[^\p{L}\p{N}\p{Zs}]/gu, '');
            const tts = gtts('es');
            const chunks = [];
            const stream = tts.stream(cleanText);

            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', async () => {
                const audioBuffer = Buffer.concat(chunks);
                await conn.sendMessage(m.chat, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mpeg', 
                    ptt: true 
                }, { quoted: m });
                await m.react('✅');
            });

            stream.on('error', async (err) => {
                console.error(err);
                await m.react('❌');
            });
        } catch (error) {
            await m.react('❌');
        }
    }
};

export default ttsCommand;
