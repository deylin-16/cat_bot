import { igdl } from 'ruhend-scraper'

let handler = async (m, { conn, args }) => {
  if (!args[0]) return conn.reply(m.chat, `*⚠️ Necesitas enviar un enlace de Instagram.*`, m)

  const regexInstagram = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/(p|reels|reel|tv)\/[^\s]+$/i
  if (!regexInstagram.test(args[0])) return conn.reply(m.chat, `*🚫 Enlace de Instagram no válido.*`, m)

  try {
    if (m.react) await m.react("⏳")

    const res = await igdl(args[0])
    if (!res || !res.data || res.data.length === 0) throw new Error("No data")

    const data = res.data.find(v => v.url.includes('.mp4')) || res.data[0]
    const video = data.url
    const miniatura = data.thumbnail || "https://i.postimg.cc/RV6xwKt9/1760499473884.jpg"

    const caption = `
🎥 𝗜𝗡𝗦𝗧𝗔𝗚𝗥𝗔𝗠 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥  

🌐 Plataforma: Instagram  

⚙️ Opciones de descarga:  
1️⃣ Vídeo normal 📽️  
2️⃣ Solo audio 🎵  
3️⃣ Nota de vídeo 🕳️  

💡 Responde con el número de tu elección.
`.trim()

    const sentMsg = await conn.sendMessage(m.chat, { 
      image: { url: miniatura }, 
      caption 
    }, { quoted: m })

    conn.igMenu = conn.igMenu || {}
    conn.igMenu[sentMsg.key.id] = { 
      video,
      sender: m.sender 
    }
    
    if (m.react) await m.react("✅")

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, `❌ Error al procesar Instagram.`, m)
  }
}

handler.before = async (m, { conn }) => {
  if (!m.quoted || !m.text || !conn.igMenu) return
  const msgId = m.quoted.id || m.quoted.key?.id
  if (!conn.igMenu[msgId]) return
  
  if (conn.igMenu[msgId].sender !== m.sender) return

  const data = conn.igMenu[msgId]
  const choice = m.text.trim()
  if (!["1", "2", "3"].includes(choice)) return

  try {
    if (m.react) await m.react("📥")
    
    switch (choice) {
      case "1":
        await conn.sendMessage(m.chat, { video: { url: data.video }, caption: "🎬 @deylinstudio" }, { quoted: m })
        break
      case "2":
        await conn.sendMessage(m.chat, { audio: { url: data.video }, mimetype: "audio/mpeg", fileName: "ig.mp3" }, { quoted: m })
        break
      case "3":
        await conn.sendMessage(m.chat, { video: { url: data.video }, ptv: true }, { quoted: m })
        break
    }
    
    delete conn.igMenu[msgId]
    if (m.react) await m.react("✅")

  } catch (e) {
    m.reply("❌ Error al enviar el archivo.")
  }
}

handler.help = ['instagram', 'ig']
handler.tags = ['descargas']
handler.command = /^(instagram|ig)$/i

export default handler
