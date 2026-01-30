import axios from 'axios';
import baileys from '@whiskeysockets/baileys';
import fetch from 'node-fetch';

const pinterestCommand = {
    name: 'pinterest',
    alias: ['pin'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return conn.reply(m.chat, `🍪 Ingresa un texto para iniciar la búsqueda...`, m);

        try {
            m.react('🕒');

            // Búsqueda en Pinterest
            const res = await axios.get(`https://api.lolhuman.xyz/api/pinterest?apikey=GataDios&query=${encodeURIComponent(text)}`);
            const results = res.data.result;

            if (!results || results.length === 0) return conn.reply(m.chat, `No se encontraron resultados para "${text}".`, m);

            const maxImages = Math.min(results.length, 7);
            const medias = [];

            for (let i = 0; i < maxImages; i++) {
                medias.push({
                    type: 'image',
                    data: { url: results[i] }
                });
            }

            const caption = `*── 「 PINTEREST ALBUM 」 ──*\n\n▢ *BÚSQUEDA:* ${text}\n▢ *CANTIDAD:* ${maxImages}`;

            await sendAlbum(conn, m.chat, medias, {
                caption: caption,
                quoted: fkontak,
                delay: 500
            });

            await m.react('✅');

        } catch (error) {
            console.error(error);
            m.react('❌');
            conn.reply(m.chat, 'Error al obtener imágenes de Pinterest.', m);
        }
    }
};

async function sendAlbum(conn, jid, medias, options = {}) {
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
        await baileys.delay(options.delay || 300);
    }
}

export default pinterestCommand;
