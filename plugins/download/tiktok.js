import fetch from "node-fetch"

const tiktok = {
    name: 'tiktok',
    alias: ['tt', 'tiktokdl'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        if (!args[0]) return m.reply(`*ஐ Ingresa un enlace de TikTok.*`)

        try {
            if (m.react) await m.react("⏳")
            
            const apikey = "dk_ofical_user"
            const res = await fetch(`https://api.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(args[0])}&apikey=${apikey}`)
            const data = await res.json()

            if (!data.success) throw new Error("API Error")

            const videoUrl = data.play || data.wmplay
            const title = data.title || "TikTok Video"
            const nickname = data.author?.nickname || "Usuario"

            const caption = `\t\t\t𝗧𝗜𝗞-𝗧𝗢𝗞 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦

> ღ *Autor:* ➜ ${nickname}
> ✎ *Título:* ➜ ${title}
`

            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl }, 
                caption: caption,
                fileName: `tiktok.mp4`,
                mimetype: 'video/mp4'
            }, { quoted: m })

            if (m.react) await m.react("✅")
        } catch (e) {
            console.error(e)
            m.reply("ஐ Error al procesar el enlace.")
        }
    }
}

export default tiktok
