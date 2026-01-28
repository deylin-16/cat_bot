import fetch from "node-fetch"

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let url = args[0] ? args[0].split('?')[0] : null
    if (!url || !/tiktok\.com/i.test(url)) {
        return m.reply(`*ஐ Ingresa un enlace válido de TikTok.*`)
    }

    try {
        const apikey = "dk_ofical_user"
        const res = await fetch(`https://api.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=${apikey}`)
        const data = await res.json()

        if (!data.success && !data.status) throw new Error("API Error")

        const result = data.result || data
        const videoUrl = result.play || result.wmplay || result.video
        const title = result.title || "TikTok Video"
        const nickname = result.author?.nickname || result.nickname || "Usuario"

        if (!videoUrl) throw new Error("No video URL")

        const caption = `
				𝗧𝗜𝗞-𝗧𝗢𝗞 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦

> ღ *Autor:* ➜ ${nickname}
> ✎ *Título:* ➜ ${title}
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

handler.help = ['tiktok', 'tt']
handler.tags = ['descargas']
handler.command = ['tiktok', 'tt']

export default handler
