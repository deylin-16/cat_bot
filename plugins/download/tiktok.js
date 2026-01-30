import fetch from "node-fetch"

const tiktok = {
    name: 'tiktok',
    alias: ['tt', 'tiktokdl'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        if (!args[0]) return m.reply(`*ஐ Ingresa un enlace de TikTok.*`)

        try {
            await m.react("⏳")

            const apikey = "dk_ofical_user"
            const res = await fetch(`https://api.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(args[0])}&apikey=${apikey}`)
            const data = await res.json()

            if (!data.success) throw new Error("API_ERROR")

            const { title, play, duration, music_info, stats, author } = data
            const videoUrl = play 
            
            const formatter = new Intl.NumberFormat('es-ES')
            
            const caption = `\t\t\t*𝗧𝗜𝗞-𝗧𝗢𝗞 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦*

> ღ *Autor:* ${author?.nickname || 'Anónimo'}
> ✎ *Título:* ${title || 'Sin descripción'}
> ⍰ *Duración:* ${duration}s
> ♫ *Música:* ${music_info?.title || 'Original'}
> ×͜× *Creador:* ${music_info?.author || '---'}
\t\t\t*ム ESTADÍSTICAS:*
> 𖤍 *Vistas:* ${formatter.format(stats?.play_count || 0)}
> ♡ *Likes:* ${formatter.format(stats?.digg_count || 0)}
> ♛ *Comments:* ${formatter.format(stats?.comment_count || 0)}
> ★ *Shares:* ${formatter.format(stats?.share_count || 0)}`

            await conn.sendMessage(m.chat, { 
                video: { url: videoUrl }, 
                caption: caption,
                fileName: `tiktok_hd.mp4`,
                mimetype: 'video/mp4'
            }, { quoted: m })

            await m.react("✅")
        } catch (e) {
            console.error(e)
            await m.react("❌")
            m.reply("ஐ Error al procesar el enlace.")
        }
    }
}

export default tiktok
