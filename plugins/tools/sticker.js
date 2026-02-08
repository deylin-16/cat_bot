import { Sticker, StickerTypes } from 'wa-sticker-formatter'

const stickerCommand = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        try {
            let q = m.quoted ? m.quoted : m
            let mime = (q.msg || q).mimetype || ''
            let txt = args.join(' ')

            if (!/image|video|webp/.test(mime)) return m.reply('> *✎ Responde a una imagen o video.*')
            if (/video/.test(mime) && (q.msg || q).seconds > 11) return m.reply('> ᰔᩚ Máximo *10 segundos*.')

            await m.react('🕓')

            let buffer = await q.download()
            if (!buffer) return m.reply('> ⚔ Error al descargar.')

            let [pack, auth] = txt.includes('|') ? txt.split('|').map(v => v.trim()) : ['Deylin Systems', 'Bot']

            const sticker = new Sticker(buffer, {
                pack: pack,
                author: auth,
                type: StickerTypes.FULL, 
                categories: ['🤩', '🎉'],
                id: m.id,
                quality: 70 
            })

            const stickerBuffer = await sticker.toBuffer()
            
            await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
            await m.react('✅')

        } catch (e) {
            m.reply(e)
            await m.react('✖️')
        }
    }
}

export default stickerCommand
