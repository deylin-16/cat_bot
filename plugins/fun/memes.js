import fetch from 'node-fetch';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        const sendAlbumMessage = async (conn, jid, medias, options = {}) => {
            if (typeof jid !== "string") throw new TypeError("jid must be string");
            const caption = options.text || options.caption || "";
            const delayTime = !isNaN(options.delay) ? options.delay : 500;

            const album = conn.generateWAMessageFromContent(
                jid,
                {
                    messageContextInfo: {},
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
                try {
                    const img = await conn.generateWAMessage(
                        album.key.remoteJid,
                        { [type]: data, ...(i === 0 ? { caption } : {}) },
                        { upload: conn.waUploadToServer }
                    );
                    img.message.messageContextInfo = { 
                        messageAssociation: { associationType: 1, parentMessageKey: album.key } 
                    };
                    await conn.relayMessage(img.key.remoteJid, img.message, { messageId: msg.key.id });
                    await conn.delay(delayTime);
                } catch (err) {
                    continue;
                }
            }
            return album;
        };

        try {
            const res = await fetch(`${global.url_api}/api/search/memes?apikey=by_deylin`);
            const json = await res.json();

            if (!json.memes || !Array.isArray(json.memes)) throw new Error();

            const maxMemes = Math.min(json.memes.length, 10);
            const medias = json.memes.slice(0, maxMemes).map(url => ({
                type: 'image',
                data: { url }
            }));

            await sendAlbumMessage(conn, m.chat, medias, {
                caption: `⍰ Aquí tienes tus memes aleatorios...`,
                quoted: m
            });

        } catch (e) {
            conn.reply(m.chat, '😿 Ocurrió un error al obtener los memes.', m);
        }
    }
};

export default memesCommand;
