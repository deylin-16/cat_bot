import fetch from 'node-fetch'
import baileys from '@whiskeysockets/baileys'

const animeCommand = {
    name: 'anime',
    alias: ['animes'],
    category: 'fun',
    run: async (m, { conn, usedPrefix }) => {
        const sendAlbumMessage = async (conn, jid, medias, options = {}) => {
            if (typeof jid !== "string") throw new TypeError("jid must be string")
            const caption = options.text || options.caption || ""
            const delay = !isNaN(options.delay) ? options.delay : 500
            
            const album = baileys.generateWAMessageFromContent(
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
            )

            await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id })

            for (let i = 0; i < medias.length; i++) {
                const { type, data } = medias[i]
                try {
                    const img = await baileys.generateWAMessage(
                        album.key.remoteJid,
                        { [type]: data, ...(i === 0 ? { caption } : {}) },
                        { upload: conn.waUploadToServer }
                    )
                    img.message.messageContextInfo = { messageAssociation: { associationType: 1, parentMessageKey: album.key } }
                    await conn.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id })
                    await baileys.delay(delay)
                } catch (err) {
                    continue
                }
            }
            return album
        }

        try {
            const res = await fetch(`${global.url_api}/api/search/anime?apikey=400klob`)
            const json = await res.json()

            if (!json.result || !Array.isArray(json.result)) throw new Error()

            const maxImgs = Math.min(json.result.length, 10)
            const medias = json.result.slice(0, maxImgs).map(url => ({
                type: 'image',
                data: { url }
            }))

            await sendAlbumMessage(conn, m.chat, medias, {
                caption: `> *ᰔᩚ Aquí tienes ${maxImgs} imágenes anime ✰`,
                quoted: m
            })

        } catch (e) {
            conn.reply(m.chat, '😿 Ocurrió un error al obtener las imágenes anime.', m)
        }
    }
}

export default animeCommand
