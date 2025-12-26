import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
    const config = global.getAssistantConfig(conn.user.jid)
    const iconoUrl = 'https://i.ibb.co/g8PsK57/IMG-20251224-WA0617.jpg'

    try {
        const response = await fetch(iconoUrl)
        if (!response.ok) throw new Error('No se pudo descargar la imagen')
        const buffer = await response.buffer()

        await conn.sendModify(m.chat, "Haz clic aquí para unirte al grupo 🚀", m, {
            title: config?.assistantName || 'ASSEMBLY SYSTEM',
            body: '¡Comunidad Oficial!',
            url: "https://chat.whatsapp.com/K9RNlIG2CnnEZeQgOmZOQl",
            thumbnail: buffer,
            //largeThumb: true
        })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        m.reply(`❌ Error: ${e.message}`)
    }
}

handler.command = ['prueba2']
export default handler
