import { igdl } from 'ruhend-scraper'

const facebook = {
    name: 'facebook',
    alias: ['fb', 'fbdl'],
    category: 'descargas',
    run: async (m, { conn, args, usedPrefix, command }) => {
        if (!args[0]) return m.reply(`*⍰ Ingresa un enlace de Facebook...*`)

        const regexFacebook = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/[^\s]+$/i
        if (!regexFacebook.test(args[0])) return m.reply(`*ஐ Enlace de Facebook no válido.*`)

        try {
            if (m.react) await m.react("⏳")

            const res = await igdl(args[0])
            if (!res || !res.data || res.data.length === 0) throw new Error("No data found")

            const data = res.data.find(i => i.resolution === "720p (HD)") || res.data[0]
            const videoUrl = data.url
            const title = res.title || "Video de Facebook"
            
            const caption = `\t\t\t 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥

> ღ *Título:* ${title}
> ✰ *Calidad:* ${data.resolution || "SD"}
> ✎ *Enlace:* ${args[0]}

`
            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl }, 
                caption: caption,
                fileName: `fb_video.mp4`,
                mimetype: 'video/mp4'
            }, { quoted: m })

            if (m.react) await m.react("✅")

        } catch (e) {
            console.error(e)
            m.reply("卍 Error al procesar Facebook. El video podría ser privado o el enlace ha expirado.")
        }
    }
}

export default facebook
