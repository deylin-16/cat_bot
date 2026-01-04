import fetch from 'node-fetch'

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`📌 Ejemplo: .${command} My Melody`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !Array.isArray(searchJson.data) || searchJson.data.length === 0) {
      return m.reply('❌ No se encontraron stickers.')
    }

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    
    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    if (!downloadJson.status || !downloadJson.data) {
      return m.reply('⚠️ No se pudo obtener la información del paquete.')
    }

    const data = downloadJson.data

    await conn.relayMessage(m.chat, {
      stickerPackMessage: {
        stickerPackId: `com.snowcorp.stickerly.android.stickercontentprovider ${data.name}`,
        name: data.name || 'Pack',
        publisher: data.author || 'Sticker.ly',
        stickers: data.stickers.map(url => ({
          url: url,
          isAnimated: false,
          mimetype: 'image/webp'
        })),
        stickerPackOrigin: 'THIRD_PARTY'
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al procesar el paquete.')
  }
}

handler.help = ['stikerly <consulta>']
handler.tags = ['sticker']
handler.command = /^stikerly$/i

export default handler
