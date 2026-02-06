import axios from 'axios';

const gifCommand = {
    name: 'gif',
    alias: ['tenor', 'gifs'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('> *Ingrese el término de búsqueda para los GIFs.*');

        try {
            const { data } = await axios.get(
                `https://api.tenor.com/v1/search?q=${encodeURIComponent(text)}&key=LIVDSRZULELA&limit=5`
            );

            if (!data?.results || data.results.length === 0) {
                return m.reply(`> *No se encontraron resultados para: ${text}*`);
            }

            const medias = [];
            let urlsCaption = `> *𝗚𝗜𝗙𝗦 𝗗𝗘:* ${text.toUpperCase()}\n\n`;

            for (let i = 0; i < data.results.length; i++) {
                const gif = data.results[i];
                const mediaObj = gif.media[0];
                const url = mediaObj?.mp4?.url || mediaObj?.gif?.url;

                if (url) {
                    medias.push({
                        type: 'video',
                        data: { url }
                    });
                    urlsCaption += `*${i + 1}.* ${url}\n`;
                }
            }

            if (medias.length < 2) {
                for (let media of medias) {
                    await conn.sendMessage(m.chat, { video: media.data, gifPlayback: true, caption: urlsCaption }, { quoted: m });
                }
                return;
            }

            await sendAlbumMessage(conn, m.chat, medias, {
                caption: urlsCaption.trim(),
                quoted: m,
                delay: 800
            });

        } catch (err) {
            console.error(err);
            m.reply('> *Error al procesar la solicitud de GIFs.*');
        }
    }
};

async function sendAlbumMessage(conn, jid, medias, options = {}) {
    const album = conn.generateWAMessageFromContent(
        jid,
        {
            albumMessage: {
                expectedImageCount: medias.filter(m => m.type === "image").length,
                expectedVideoCount: medias.filter(m => m.type === "video").length,
                ...(options.quoted ? {
                    contextInfo: {
                        remoteJid: options.quoted.key.remoteJid,
                        fromMe: options.quoted.key.fromMe,
                        stanzaId: options.quoted.key.id,
                        participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                        quotedMessage: options.quoted.message,
                    },
                } : {}),
            },
        },
        {}
    );

    await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const msg = await conn.generateWAMessage(
            album.key.remoteJid,
            { [type]: data, gifPlayback: true, ...(i === 0 ? { caption: options.caption } : {}) },
            { upload: conn.waUploadToServer }
        );
        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key },
        };
        await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
        await conn.delay(options.delay || 500);
    }
    return album;
}

export default gifCommand;
