let handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, {
        text: "https://hola.com//",
        contextInfo: {
            externalAdReply: {
                title: "HOLA.com, últimas noticias de famosos, moda, belleza y actualidad",
                body: "Número 1 en actualidad y tendencias de moda, belleza y estilo de vida.",
                previewType: "NONE",
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnailUrl: "https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767466951467_BNENXDN6p.jpeg", // <--- CAMBIA ESTO
                sourceUrl: "https://hola.com//"
            }
        }
    }, { quoted: m })
}
handler.command = /^(prueba)$/i
export default handler
