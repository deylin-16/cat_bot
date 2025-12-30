import ImageKit from "imagekit"
import fetch from "node-fetch"

const imagekit = new ImageKit({
    publicKey: "public_UilqC3N3XUQp2rRJcGGhLhaXKSY=",
    privateKey: "private_ojSXwbW+qGniUaMFMzzVNWhiuI8=",
    urlEndpoint: "https://ik.imagekit.io/pm10ywrf6f"
})

let handler = async (m, { conn, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    if (!mime) return m.reply(`Responde a una imagen o video con el comando *${command}*`)
    
    await m.reply('Procesando y subiendo archivo...')
    
    let media = await q.download()
    let fileName = `${Date.now()}.${mime.split('/')[1]}`

    imagekit.upload({
        file: media,
        fileName: fileName,
        folder: "/dynamic_Bot_by_deylin"
    }, async (err, result) => {
        if (err) return m.reply('Error al subir: ' + err.message)
        
        let txt = `*ARCHIVO SUBIDO EXITOSAMENTE*\n\n`
        txt += `*ID:* ${result.fileId}\n`
        txt += `*Nombre:* ${result.name}\n`
        txt += `*URL:* ${result.url}\n`
        txt += `*Tipo:* ${result.fileType}`

        await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
    })
}

handler.command = ['upload']
export default handler
