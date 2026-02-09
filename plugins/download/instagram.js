/*import { igdl } from 'scraper'

const instagram = {
    name: 'instagram',
    alias: ['ig', 'reels', 'reel'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        if (!args[0]) return m.reply(`*✰ Ingresa un enlace de Instagram.*`)

        const regexInstagram = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/(p|reels|reel|tv)\/[^\s]+$/i
        if (!regexInstagram.test(args[0])) return m.reply(`*ஐ Enlace no válido.*`)

        try {
            if (m.react) await m.react("⏳")

            const res = await igdl(args[0])
            if (!res?.data?.length) throw new Error("No data")

            const data = res.data.find(v => v.url.includes('.mp4')) || res.data[0]
            const video = data.url

            const caption = `\t\t\t*INSTAGRAM DOWNLOADER*

> ム *Tipo:* Post/Reel
> ღ *Link:* ${args[0]}
`

            await conn.sendMessage(m.chat, { 
                video: { url: video }, 
                caption: caption 
            }, { quoted: m })

            if (m.react) await m.react("✅")
        } catch (e) {
            console.error(e)
            m.reply(`⍰ Error al procesar Instagram.`)
        }
    }
}

export default instagram*/
