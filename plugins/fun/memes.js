import fetch from 'node-fetch';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        const sendAlbumMessage = async (conn, jid, medias, options = {}) => {
            const caption = options.text || options.caption || "";
            const delayTime = options.delay || 1000;

            const album = await conn.generateWAMessageFromContent(jid, {
                albumMessage: {
                    expectedImageCount: medias.filter(m => m.type === "image").length,
                    expectedVideoCount: medias.filter(m => m.type === "video").length,
                    contextInfo: options.quoted ? {
                        stanzaId: options.quoted.key.id,
                        participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                        quotedMessage: options.quoted.message,
                        remoteJid: options.quoted.key.remoteJid
                    } : {}
                }
            }, { userJid: conn.user.id });

            await conn.relayMessage(jid, album.message, { messageId: album.key.id });

            for (let i = 0; i < medias.length; i++) {
                const { type, data } = medias[i];
                try {
                    const img = await conn.generateWAMessage(jid, { 
                        [type]: data, 
                        ...(i === 0 ? { caption } : {}) 
                    }, { upload: conn.waUploadToServer });

                    img.message[type + 'Message'].contextInfo = {
                        ...img.message[type + 'Message'].contextInfo,
                        messageAssociation: { 
                            associationType: 1, 
                            parentMessageKey: album.key 
                        }
                    };

                    await conn.relayMessage(jid, img.message, { messageId: img.key.id });
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                } catch (err) {
                    console.error(err);
                    continue;
                }
            }
            return album;
        };

        try {
            const res = await fetch(`https://api.deylin.xyz/api/search/memes?apikey=by_deylin`);
            const json = await res.json();

            if (!json.memes || !Array.isArray(json.memes)) throw new Error("No hay memes");

            const medias = json.memes.slice(0, 10).map(url => ({
                type: 'image',
                data: { url }
            }));

            await sendAlbumMessage(conn, m.chat, medias, {
                caption: `⍰ Aquí tienes tus memes aleatorios...`,
                quoted: m
            });

        } catch (e) {
            console.error(e);
            conn.reply(m.chat, '😿 Ocurrió un error al obtener los memes.', m);
        }
    }
};

export default memesCommand;
