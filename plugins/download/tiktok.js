import fetch from "node-fetch"

const tiktok = {
    name: 'tiktok',
    alias: ['tt', 'tk', 'tiktokdl'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        const url = args[0]
        if (!url || !/tiktok\.com/i.test(url)) {
            return m.reply(`*ஐ Ingresa un enlace válido de TikTok.*`)
        }

        try {
            const apikey = "dk_ofical_user"
            const res = await fetch(`https://api.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=${apikey}`)
            const data = await res.json()

            const result = data.success ? (data.result || data) : null
            if (!result) throw new Error("API_ERROR")

            const videoUrl = result.play || result.wmplay || result.video
            if (!videoUrl) throw new Error("NO_VIDEO_URL")

            const caption = `
                                𝗧𝗜𝗞-𝗧𝗢𝗞 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦

> ღ *Autor:* ➜ ${result.author?.nickname || "Usuario"}
> ✎ *Título:* ➜ ${result.title || "TikTok Video"}
`.trim()

            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl }, 
                caption: caption,
                fileName: `tiktok.mp4`,
                mimetype: 'video/mp4'
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply("ஐ Error al procesar el enlace. Asegúrate de que sea un video válido.")
        }
    }
}

export default tiktok
