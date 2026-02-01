import axios from 'axios';

let audioBufferCache = null;

const gayCommand = {
    name: 'gay',
    alias: ['marica', 'trolo'],
    category: 'fun',
    run: async (m, { conn }) => {
        const audioUrl = 'https://empirical-red-8pi4utzy0x.edgeone.app/ssstik.io_1769985257917.mp3';
        const who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

        try {
            const avatarUrl = await conn.profilePictureUrl(who, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');
            const processedImageUrl = `https://some-random-api.com/canvas/gay?avatar=${encodeURIComponent(avatarUrl)}`;

            await conn.sendMessage(m.chat, {
                image: { url: processedImageUrl },
                caption: '🏳️‍🌈 𝑴𝒊𝒓𝒆𝒏 𝒂 𝒆𝒔𝒕𝒆 𝑮𝒂𝒚 🏳️‍🌈',
                mentions: [who]
            }, { quoted: m });

            if (!audioBufferCache) {
                const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                audioBufferCache = Buffer.from(response.data);
            }

            await conn.sendMessage(m.chat, {
                audio: audioBufferCache,
                mimetype: 'audio/mpeg',
                ptt: true,
                mentions: [who]
            }, { quoted: m });

        } catch (error) {
            console.error('Error en gayCommand:', error);
        }
    }
};

export default gayCommand;
