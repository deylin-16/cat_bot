import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
    const imageUrl = "https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767466951467_BNENXDN6p.jpeg"
    const response = await fetch(imageUrl)
    const buffer = await response.buffer()

    const messageStruct = {
        extendedTextMessage: {
            text: "https://hola.com// hola jajaja",
            matchedText: "https://hola.com//",
            description: "Número 1 en actualidad y tendencias de moda, belleza y estilo de vida. Noticias diarias sobre las estrellas de cine, la música, tendencias de moda, consejos de belleza, recetas de cocina, estilo de vida y la actualidad de las principales casas reales del mundo.",
            title: "HOLA.com, últimas noticias de famosos, moda, belleza y actualidad",
            previewType: "NONE",
            jpegThumbnail: buffer,
            inviteLinkGroupTypeV2: "DEFAULT"
        }
    }

    await conn.relayMessage(m.chat, messageStruct, { quoted: m })
}

handler.command = ['prueba']

export default handler
