import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`✨ Escribe un término para buscar el paquete nativo.`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) return m.reply('❌ No se encontró el paquete.')

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    
    // Obtenemos los datos del pack para llenar la estructura que descubriste
    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    // CONSTRUCCIÓN BASADA EN TU INSPECCIÓN (JSON)
    await conn.relayMessage(m.chat, {
      stickerPackMessage: {
        stickerPackId: `com.snowcorp.stickerly.android.stickercontentprovider ${Date.now()}`,
        name: pick.name || "Sasuke Pack",
        publisher: pick.author || "Deylin",
        stickers: downloadJson.data.stickers.map(url => ({
            fileName: `${Date.now()}.webp`,
            mimetype: "image/webp"
        })),
        stickerPackOrigin: "THIRD_PARTY", // Como viste en tu JSON
        contextInfo: {
          externalAdReply: {
            title: pick.name,
            body: "Ver paquete de stickers",
            mediaType: 1,
            sourceUrl: pick.url,
            thumbnailUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/dd/93/2d/dd932d94-386b-640a-313b-8575048d087b/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.jpg'
          }
        }
      }
    }, { messageId: m.key.id })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al replicar la estructura stickerPackMessage.')
  }
}

handler.command = ['stikerly', 'sly']

export default handler
