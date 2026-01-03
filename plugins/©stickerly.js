import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`✨ Escribe lo que buscas para generar el paquete.`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) return m.reply('❌ No se encontraron paquetes.')

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    
    // URL del pack que inspeccionaste
    const packUrl = pick.url 

    // Usamos sendMessage con la estructura de metadatos de Stickerly
    // Esto es lo que WhatsApp detecta para transformar el link en el cuadro verde
    await conn.sendMessage(m.chat, {
        text: packUrl,
        contextInfo: {
            externalAdReply: {
                title: pick.name || "Pack de Stickers",
                body: `Autor: ${pick.author || "Sticker.ly"}`,
                mediaType: 1,
                // Imagen oficial de Stickerly para activar el reconocimiento de la App
                thumbnailUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/dd/93/2d/dd932d94-386b-640a-313b-8575048d087b/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.jpg',
                sourceUrl: packUrl,
                renderLargerThumbnail: false,
                showAdAttribution: true
            }
        }
    }, { quoted: m })

  } catch (e) {
    // Si hay un error real de red, ahora sí lo verás en la consola del panel
    console.error("Error en Stickerly:", e)
    m.reply('⚠️ Hubo un problema al conectar con el servidor de stickers.')
  }
}

handler.command = ['stikerly', 'sly']

export default handler
