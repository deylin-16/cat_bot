import axios from 'axios';
import baileys from '@whiskeysockets/baileys';

const pinterestCommand = {
    name: 'pinterest',
    alias: ['pin'],
    category: 'search',
    run: async (m, { conn, text }) => {
        if (!text) return conn.reply(m.chat, `\t\t\t *『 PINTEREST SEARCH 』* }n\n> ✎ Ingresa un texto para iniciar la búsqueda...`, m);

        try {
            await m.react('🕒');

            const { data: res } = await axios.get(`${global.url_api}/api/search/pin?q=${encodeURIComponent(text)}&apikey=${global.key}`);
            
            if (!res.success || !res.results || res.results.length === 0) {
                await m.react('❌');
                return conn.reply(m.chat, `No se encontraron resultados para "${text}".`, m);
            }

            const maxImages = Math.min(res.results.length, 7);
            const medias = [];
            
            const randomPick = res.results[Math.floor(Math.random() * maxImages)];

            for (let i = 0; i < maxImages; i++) {
                medias.push({
                    type: 'image',
                    data: { url: res.results[i].url }
                });
            }

            const caption = `*── 「 PINTEREST ALBUM 」 ──*\n\n` +
                             `▢ *BÚSQUEDA:* ${text}\n` +
                             `▢ *TÍTULO:* ${randomPick.title}\n` +
                             `▢ *AUTOR:* ${randomPick.author}\n` +
                             `▢ *LINK:* ${randomPick.source}\n` +
                             `▢ *CANTIDAD:* ${maxImages}\n\n`;

            await sendAlbum(conn, m.chat, medias, {
                caption: caption,
                quoted: m,
                delay: 500
            });

            await m.react('✅');

        } catch (error) {
            console.error(error);
            await m.react('❌');
            conn.reply(m.chat, 'Error al conectar con la API de Pinterest.', m);
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
