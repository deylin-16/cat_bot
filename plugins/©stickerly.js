import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`📌 Ejemplo: .${command} My Melody`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) return m.reply('❌ No se encontraron stickers.')

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    if (!downloadJson.status || !downloadJson.data) return m.reply('⚠️ Error al obtener el pack.')

    const { stickers, name, author } = downloadJson.data
    const firstStickerUrl = stickers[0]

    const response = await fetch(firstStickerUrl)
    const buffer = await response.buffer()

    const sticker = new Sticker(buffer, {
      pack: name,
      author: author,
      type: 'full'
    })
    const finalBuffer = await sticker.toBuffer()

    const upload = await conn.waUploadToServer(finalBuffer, 'sticker')

    await conn.relayMessage(m.chat, {
      stickerPackMessage: {
        stickerPackId: `com.snowcorp.stickerly.android.stickercontentprovider${Math.random().toString(36).substring(7)}`,
        name: name || 'Pack',
        publisher: author || 'Bot',
        stickers: stickers.slice(0, 5).map(() => ({
          fileSha256: upload.fileSha256,
          fileEncSha256: upload.fileEncSha256,
          mediaKey: upload.mediaKey,
          directPath: upload.directPath,
          fileLength: upload.fileLength,
          mimetype: 'image/webp'
        })),
        stickerPackOrigin: 'THIRD_PARTY',
        thumbnailDirectPath: upload.directPath,
        thumbnailSha256: upload.fileSha256,
        thumbnailEncSha256: upload.fileEncSha256,
        thumbnailHeight: 252,
        thumbnailWidth: 252
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error: Asegúrate de que wa-sticker-formatter esté instalado y actualizado.')
  }
}

handler.command = /^sly$/i

export default handler
