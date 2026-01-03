import { fileURLToPath } from 'url'
import path from 'path'

let handler = async (m, { conn }) => {
    
    await conn.sendMessage(m.chat, {
        text: "https://hola.com//",
        contextInfo: {
            externalAdReply: {
                title: "HOLA.com, últimas noticias de famosos, moda, belleza y actualidad",
                body: "Número 1 en actualidad y tendencias de moda, belleza y estilo de vida. Noticias diarias sobre las estrellas de cine, la música, tendencias de moda, consejos de belleza, recetas de cocina, estilo de vida y la actualidad de las principales casas reales del mundo.",
                previewType: "NONE",
                thumbnailUrl: "https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767466951467_BNENXDN6p.jpeg", // Puedes cambiar por una URL de imagen real
                sourceUrl: "https://hola.com//",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.command = /^(prueba)$/i

export default handler
