import axios from 'axios';

const memesCommand = {
    name: 'memes',
    alias: ['meme'],
    category: 'fun',
    run: async (m, { conn }) => {
        try {
            await m.react('🕒');

            
            const { data: res } = await axios.get(`https://Api.deylin.xyz/api/search/memes?apikey=by_deylin`);

            if (!res.success || !res.memes || res.memes.length === 0) {
                await m.react('❌');
                return conn.reply(m.chat, `> ⍰ No se encontraron memes en este momento.`, m);
            }

            
            const maxMemes = Math.min(res.memes.length, 10);
            const medias = res.memes.slice(0, maxMemes).map(url => ({
                type: 'image',
                data: { url }
            }));

            const caption = `\t\t*── 「 MEMES ALBUM 」 ──*\n\n` +
                             `▢ *CANTIDAD:* ${medias.length}\n` +
                             `> ⍰ Aquí tienes tus memes aleatorios...`;

            await sendAlbum(conn, m.chat, medias, {
                caption: caption,
                quoted: m,
                delay: 800
            });

            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            console.error(`> [ERROR MEMES]: ${error.message}`);
            conn.reply(m.chat, '😿 Ocurrió un error al obtener los memes.', m);
        }
    }
};

async function sendAlbum(conn, jid, medias, options = {}) {
    const album = await conn.generateWAMessageFromContent(jid, {
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
                }
            } : {}),
        }
    }, { userJid: conn.user.id });

    await conn.relayMessage(jid, album.message, { messageId: album.key.id });

    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const msg = await conn.generateWAMessage(jid, {
            [type]: data,
            ...(i === 0 ? { caption: options.caption || "" } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };
        await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
        await new Promise(resolve => setTimeout(resolve, options.delay || 500));
    }
}

export default memesCommand;
