import fetch from "node-fetch";
import yts from "yt-search";

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) return global.design(conn, m, `✨ *Uso correcto:*\n\n*${command}* nombre de la canción o link`);
  
  await m.react("🔎");

  try {
    let url;
    let videoInfo;
    
    if (/youtube.com|youtu.be/.test(text)) {
      url = text;
      const search = await yts(url);
      videoInfo = search;
    } else {
      const search = await yts(text);
      if (!search.videos.length) return global.design(conn, m, "❌ No se encontró el video.");
      videoInfo = search.videos[0];
      url = videoInfo.url;
    }

    const apiUrl = `${api_url}/api/download/yt?url=${encodeURIComponent(url)}&apikey=dk_ofical_user`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.success !== true || !data.result) {
      return global.design(conn, m, "❌ Error en el servidor de descargas.");
    }

    const res = data.result; 

    const contextInfo = {
      externalAdReply: {
        title: res.title || videoInfo.title,
        body: `Canal: ${videoInfo.author?.name || "YouTube"}`,
        mediaType: 1,
        previewType: 0,
        renderLargerThumbnail: true,
        thumbnailUrl: res.thumbnail || videoInfo.thumbnail,
        sourceUrl: url
      }
    };

    
    if (command === 'play' || command === 'audio') {
      await m.react("🎧");
      await conn.sendMessage(m.chat, {
        audio: { url: res.download_url }, // Ruta corregida
        mimetype: "audio/mpeg",
        fileName: `${res.title}.mp3`,
        ptt: false,
        contextInfo
      }, { quoted: m });
    } 
    
    
    else if (command === 'play2' || command === 'video') {
      await m.react("🎥");
      await conn.sendMessage(m.chat, {
        video: { url: res.download_url }, // Ruta corregida
        caption: `✅ *Título:* ${res.title}\n🔗 *Link:* ${url}\n\n*Nota:* ${res.info}`,
        mimetype: "video/mp4",
        fileName: `${res.title}.mp4`,
        contextInfo
      }, { quoted: m });
    }

    await m.react("✅");

  } catch (error) {
    console.error(error);
    await m.react("❌");
    global.design(conn, m, `⚠️ Error: ${error.message}`);
  }
};

handler.command = /^(play|audio|play2|video)$/i;
export default handler;
