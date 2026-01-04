import fetch from 'node-fetch'

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

    await conn.relayMessage(m.chat, {
      stickerPackMessage: {
        stickerPackId: `com.snowcorp.stickerly.android.stickercontentprovider${Math.random()}`,
        name: name,
        publisher: author,
        stickers: stickers.slice(0, 5).map(url => ({
          url: url,
          mimetype: 'image/webp'
        })),
        stickerPackOrigin: 'THIRD_PARTY'
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error técnico al intentar enviar el paquete nativo.')
  }
}

handler.command = /^sly$/i

export default handler
