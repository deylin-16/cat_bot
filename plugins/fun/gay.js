let audioBufferCache = null;

const gayCommand = {
    name: 'gay',
    alias: ['marica', 'trolo'],
    category: 'fun',
    run: async (m, { conn }) => {
        const audioUrl = 'https://raw.githubusercontent.com/deylin-16/database/main/uploads/1770963376198.mp3';
        const who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;

        try {
            const avatarUrl = await conn.profilePictureUrl(who, 'image').catch(() => 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770961342099_YSAua3_It.jpeg');
            const processedImageUrl = `https://some-random-api.com/canvas/gay?avatar=${encodeURIComponent(avatarUrl)}`;

            
            await conn.sendMessage(m.chat, {
                image: { url: processedImageUrl },
                caption: '🏳️‍🌈 𝑴𝒊𝒓𝒆𝒏 𝒂 𝒆𝒔𝒕𝒆 𝑮𝒂𝒚 🏳️‍🌈',
                mentions: [who]
            }, { quoted: m });

            if (!audioBufferCache) {
                const response = await fetch(audioUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                    }
                });
                
                if (!response.ok) throw new Error(`Error al descargar: ${response.statusText}`);
                
                const arrayBuffer = await response.arrayBuffer();
                audioBufferCache = Buffer.from(arrayBuffer);
            }

            await conn.sendMessage(m.chat, {
                audio: audioBufferCache,
                mimetype: 'audio/mp4', 
                mentions: [who]
            }, { quoted: m });

        } catch (error) {
            console.error('Error en gayCommand:', error);
            
            // await conn.sendMessage(m.chat, { text: 'No pude cargar el audio, intenta más tarde.' }, { quoted: m });
        }
    }
};

export default gayCommand;
