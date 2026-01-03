import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`✨ Escribe un término para buscar paquetes en Sticker.ly`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) return m.reply('❌ No se encontraron paquetes.')

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    const packUrl = pick.url 

    // Mensaje configurado para forzar la vista de "Paquete de Stickers"
    await conn.sendMessage(m.chat, {
      text: packUrl,
      contextInfo: {
        externalAdReply: {
          title: `PAQUETE: ${pick.name || 'Stickers'}`,
          body: `Click aquí para añadir stickers`,
          sourceUrl: packUrl,
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnailUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/dd/93/2d/dd932d94-386b-640a-313b-8575048d087b/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.jpg',
          // Este campo es clave para que aparezca el botón de acción
          mediaUrl: packUrl 
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al intentar generar el paquete.')
  }
}

handler.command = ['stikerly', 'sly']

export default handler
