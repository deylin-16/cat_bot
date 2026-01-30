import ImageKit from "imagekit"
import fetch from "node-fetch"

const imagekit = new ImageKit({
    publicKey: "public_UilqC3N3XUQp2rRJcGGhLhaXKSY=",
    privateKey: "private_ojSXwbW+qGniUaMFMzzVNWhiuI8=",
    urlEndpoint: "https://ik.imagekit.io/pm10ywrf6f"
})

const uploadCommand = {
    name: 'upload',
    alias: ['tourl', 'ik', 'tourl'],
    category: 'tools',
    run: async (m, { conn, command }) => {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!mime) return m.reply(`> ✰⋆͙̈ Responde a una imagen o video con el comando ➠ *${command}*`)

        await m.react('🕒')

        let media = await q.download()
        let fileName = `${Date.now()}.${mime.split('/')[1]}`

        imagekit.upload({
            file: media,
            fileName: fileName,
            folder: `/${name}_by_deylin`
        }, async (err, result) => {
            if (err) {
                await m.react('❌')
                return m.reply('*LOG:* ' + err.message)
            }

            let txt = `*── 「 UPLOAD SUCCESS 」 ──*\n\n`
            txt += `▢ *ID:* ${result.fileId}\n`
            txt += `▢ *NAME:* ${result.name}\n`
            txt += `▢ *URL:* ${result.url}\n`
            txt += `▢ *TYPE:* ${result.fileType}\n\n`

            await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
            await m.react('✅')
        })
    }
}

export default uploadCommand
