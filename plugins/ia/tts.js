import gtts from 'node-gtts';

const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Ingresa el texto que quieres convertir a voz.');

        try {
            await m.react('🗣️');

            const cleanText = text.replace(/[^\p{L}\p{N}\p{Zs}]/gu, '');
            const audioBuffer = await generarAudio(cleanText);

            await conn.sendMessage(m.chat, { 
                audio: audioBuffer, 
                mimetype: 'audio/mpeg', 
                ptt: true 
            }, { quoted: m });

            await m.react('✅');
        } catch (error) {
            m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo generar el audio.`);
        }
    }
};

function generarAudio(text) {
    return new Promise((resolve, reject) => {
        try {
            const tts = gtts('es');
            const chunks = [];
            const stream = tts.stream(text);

            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', (err) => reject(err));
        } catch (e) {
            reject(e);
        }
    });
}

export default ttsCommand;
