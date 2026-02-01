let audioCache = null;

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

            const audioPayload = audioCache 
                ? { audio: audioCache, mimetype: 'audio/mpeg', ptt: true, mentions: [who] }
                : { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: true, mentions: [who] };

            const response = await conn.sendMessage(m.chat, audioPayload, { quoted: m });

            if (!audioCache && response) {
                audioCache = response.message?.audioMessage || response;
            }

        } catch (error) {
            console.error(error);
        }
    }
};

export default gayCommand;
