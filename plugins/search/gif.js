import axios from 'axios';

const gifCommand = {
    name: 'gif',
    alias: ['tenor', 'gifs'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return m.reply('> *Ingrese el término de búsqueda para obtener videos.*');

        try {
            await m.react('🕒');

            const { data } = await axios.get(
                `https://api.tenor.com/v1/search?q=${encodeURIComponent(text)}&key=LIVDSRZULELA&limit=5`
            );

            if (!data?.results || data.results.length === 0) {
                await m.react('❌');
                return m.reply(`> *No se encontraron resultados para: ${text}*`);
            }

            const medias = [];
            let urlsCaption = `> *𝗩𝗜𝗗𝗘𝗢𝗦 𝗗𝗘:* ${text.toUpperCase()}\n\n`;

            for (let i = 0; i < data.results.length; i++) {
                const gif = data.results[i];
                const mediaObj = gif.media[0];
                const url = mediaObj?.mp4?.url; // Forzamos el uso de MP4

                if (url) {
                    medias.push({
                        type: 'video',
                        data: { url }
                    });
                    urlsCaption += `*${i + 1}.* ${url}\n`;
                }
            }

            if (medias.length === 1) {
                await m.react('✅');
                return await conn.sendMessage(m.chat, { 
                    video: medias[0].data, 
                    caption: urlsCaption 
                }, { quoted: m });
            }

            await sendAlbum(conn, m.chat, medias, {
                caption: urlsCaption.trim(),
                quoted: m,
                delay: 800
            });

            await m.react('✅');

        } catch (err) {
            await m.react('❌');
            console.error(err);
            m.reply('> *Error al procesar la solicitud de videos.*');
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
        
        if (conn.delay) {
            await conn.delay(options.delay || 500);
        } else {
            await new Promise(res => setTimeout(res, options.delay || 500));
        }
    }
}

export default gifCommand;
