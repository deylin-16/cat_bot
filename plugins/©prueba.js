import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
    
    let imagenUrl = "https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767466951467_BNENXDN6p.jpeg" // Pon aquí la URL de la imagen
    let response = await fetch(imagenUrl)
    let bufferImagen = await response.buffer()

    await conn.sendMessage(m.chat, {
        text: "https://hola.com//",
        contextInfo: {
            externalAdReply: {
                title: "HOLA.com, últimas noticias de famosos, moda, belleza y actualidad",
                body: "Número 1 en actualidad y tendencias de moda, belleza y estilo de vida.",
                previewType: "NONE",
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnail: bufferImagen, // Al ser Buffer, el clic no va a la imagen
                sourceUrl: "https://hola.com//" // El clic ahora irá siempre aquí
            }
        }
    }, { quoted: m })
}

handler.command = /^(prueba)$/i

export default handler
