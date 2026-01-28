import fetch from "node-fetch"

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`*ஐ Ingresa un enlace de TikTok.*`)

    try {
        const apikey = "dk_ofical_user"
        const res = await fetch(`https://api.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(args[0])}&apikey=${apikey}`)
        const data = await res.json()

        if (!data.success) throw new Error("API Error")

        const videoUrl = data.play || data.wmplay
        const title = data.title || "TikTok Video"
        const nickname = data.author?.nickname || "Usuario"

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
