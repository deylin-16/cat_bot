import { igdl } from 'ruhend-scraper'
import fetch from "node-fetch"

let handler = async (m, { conn, args }) => {
  if (!args[0]) return conn.reply(m.chat, `*⚠️ Necesitas enviar un enlace de Facebook para descargar.*`, m)

  const resThumb3 = await fetch('https://files.catbox.moe/nbkung.jpg')
  const thumb24 = Buffer.from(await resThumb3.arrayBuffer())

  const fkontak = {
    key: { participants: ["0@s.whatsapp.net"], remoteJid: "status@broadcast", fromMe: false, id: "Halo" },
    message: { locationMessage: { name: `𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔 𝗗𝗘 𝗙𝗔𝗖𝗘𝗕𝗢𝗢Ｋ`, jpegThumbnail: thumb24 } },
    participant: "0@s.whatsapp.net"
  }

  const regexFacebook = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/[^\s]+$/i
  if (!regexFacebook.test(args[0])) return conn.reply(m.chat, `*🚫 Enlace de Facebook no válido.*`, m)

  try {
    if (m.react) await m.react("⏳")

    const res = await igdl(args[0])
    if (!res || !res.data || res.data.length === 0) throw new Error("No data")

    const data = res.data.find(i => i.resolution === "720p (HD)") || res.data[0]
    const video = data.url
    const miniatura = data.thumbnail || "https://files.catbox.moe/nbkung.jpg"

    const txt = `
🎥 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥  

🌐 Plataforma: Facebook  
📺 Resolución: ${data.resolution || "SD"}  

⚙️ Opciones de descarga:  
1️⃣ Vídeo normal 📽️  
2️⃣ Solo audio 🎵  
3️⃣ Nota de vídeo 🕳️  

💡 Responde con el número de tu elección.
`.trim()

    const sentMsg = await conn.sendMessage(
      m.chat,
      { image: { url: miniatura }, caption: txt },
      { quoted: m }
    )

    conn.fbMenu = conn.fbMenu || {}
    conn.fbMenu[sentMsg.key.id] = { video }
    if (m.react) await m.react("✅")

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, `❌ Error al procesar Facebook.`, m)
  }
}

handler.help = ['facebook', 'fb']
handler.tags = ['descargas']
handler.command = ['facebook', 'fb']

let before = async (m, { conn }) => {
  if (!m.quoted || !conn.fbMenu) return
  const msgId = m.quoted.id || m.quoted.key?.id
  const data = conn.fbMenu[msgId]
  if (!data) return

  const choice = m.text.trim()
  if (!["1", "2", "3"].includes(choice)) return

  try {
    switch (choice) {
      case "1":
        await conn.sendMessage(m.chat, { video: { url: data.video }, caption: "🎬 Facebook Video" }, { quoted: fkontak })
        break
      case "2":
        await conn.sendMessage(m.chat, { audio: { url: data.video }, mimetype: "audio/mpeg", fileName: "facebook.mp3" }, { quoted: fkontak })
        break
      case "3":
        await conn.sendMessage(m.chat, { video: { url: data.video }, mimetype: "video/mp4", ptv: true }, { quoted: fkontak })
        break
    }
  } catch (e) {
    m.reply("❌ Error al enviar el archivo.")
  }
}

handler.before = before
export default handler
