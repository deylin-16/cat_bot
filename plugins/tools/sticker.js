import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'

const stickerCommand = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        let stiker = false
        let texto1 = `BOT: ${name()}`
        let texto2 = `USER: ${m.pushName || 'User'}`

        try {
            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || q.mediaType || ''
            let txt = args.join(' ')

            if (/webp|image|video/g.test(mime)) {
                if (/video/.test(mime) && (q.msg || q).seconds > 16) 
                    return conn.reply(m.chat, '> ᰔᩚ Máximo *15 segundos*', m)

                let buffer = await q.download()
                if (!buffer) return m.reply('> ⚔ Error al descargar.')

                await m.react('🕓')
                let marca = txt ? txt.split(/[|]/).map(part => part.trim()) : [texto1, texto2]

                try {
                    stiker = await sticker(buffer, false, marca[0], marca[1])
                } catch (err) {
                    let out = /video/.test(mime) ? await uploadFile(buffer) : await uploadImage(buffer)
                    stiker = await sticker(false, out, marca[0], marca[1])
                }

            } else if (args[0] && args[0].match(/https?:\/\//)) {
                stiker = await sticker(false, args[0], texto1, texto2)
            } else {
                return conn.reply(m.chat, '> *✎ Responde a una imagen o video*.', m)
            }
        } catch (e) {
            console.error(e)
            await m.react('✖️')
        } finally {
            if (stiker) {
                await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
                await m.react('✅')
            }
        }
    }
}

export default stickerCommand
