import axios from 'axios';
import baileys from '@whiskeysockets/baileys';

async function sendAlbumMessage(conn, jid, medias, options = {}) {
    if (medias.length < 2) return; 

    const album = baileys.generateWAMessageFromContent(jid, {
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
    }, {});

    await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const msg = await baileys.generateWAMessage(album.key.remoteJid, {
            [type]: data,
            ...(i === 0 ? { caption: options.caption || "" } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };
        await conn.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
        await baileys.delay(options.delay || 500);
    }
    return album;
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `*── 「 SISTEMA DE ÁLBUM 」 ──*\n\n*Uso:* ${usedPrefix + command} <términos>\n*Ejemplo:* ${usedPrefix + command} gatos graciosos`, m);

    await m.react("🕒");

    try {
        const { data: response } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`);

        if (!response.data || !response.data.videos || response.data.videos.length === 0) {
            await m.react("❌");
            return conn.reply(m.chat, `*── 「 SIN RESULTADOS 」 ──*\n\nNo se localizó contenido para la búsqueda.`, m);
        }

        const rawVideos = response.data.videos.slice(0, 5);
        const medias = [];

        
        await Promise.all(rawVideos.map(async (v) => {
            try {
                const res = await axios.get(v.play, { responseType: 'arraybuffer' });
                medias.push({
                    type: 'video',
                    data: Buffer.from(res.data)
                });
            } catch (e) {
                console.error("Error descargando video para álbum:", e.message);
            }
        }));

        if (medias.length < 2) {
            throw new Error("No se pudieron recolectar suficientes videos para el álbum.");
        }

        const albumCaption = `*── 「 TIKTOK ALBUM 」 ──*\n\n` +
                             `▢ *BÚSQUEDA:* ${text}\n` +
                             `▢ *VIDEOS:* ${medias.length}\n`;

        await sendAlbumMessage(conn, m.chat, medias, {
            caption: albumCaption,
            quoted: m,
            delay: 300 
        });

        await m.react("✅");

    } catch (error) {
        console.error(error);
        await m.react("❌");
        conn.reply(m.chat, `*── 「 ERROR 」 ──*\n\n*LOG:* ${error.message}`, m);
    }
};

handler.command = /^(tiktoksearch|ttss|tiktoks)$/i;

export default handler;
