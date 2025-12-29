import fetch from "node-fetch";
import yts from "yt-search";

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) return conn.reply(m.chat, `✨ *Uso correcto:*\n\n*${command}* nombre de la canción o link`, m);
  
  await m.react("🔎");

  try {
    let url;
    let videoInfo;
    if (/youtube.com|youtu.be/.test(text)) {
      const search = await yts(text);
      videoInfo = search;
      url = text;
    } else {
      const search = await yts(text);
      if (!search.videos.length) return m.reply("❌ No se encontró el video.");
      videoInfo = search.videos[0];
      url = videoInfo.url;
    }

    const apiUrl = `https://file.deylin.xyz/download?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.status !== "success") {
      return m.reply("❌ Error en el servidor de descargas.");
    }

    const contextInfo = {
      externalAdReply: {
        title: videoInfo.title || data.title,
        body: `Canal: ${videoInfo.author?.name || "YouTube"}`,
        mediaType: 1,
        previewType: 0,
        renderLargerThumbnail: true,
        thumbnailUrl: videoInfo.thumbnail || data.thumbnail,
        sourceUrl: url
      }
    };

    if (command === 'play' || command === 'audio') {
      await m.react("🎧");
      await conn.sendMessage(m.chat, {
        audio: { url: data.download_url },
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
        ptt: false,
        contextInfo
      }, { quoted: m });
    } 
    
    else if (command === 'play2' || command === 'video') {
      await m.react("🎥");
      await conn.sendMessage(m.chat, {
        video: { url: data.download_url },
        caption: `✅ *Título:* ${data.title}\n🔗 *Link:* ${url}`,
        mimetype: "video/mp4",
        fileName: `${data.title}.mp4`,
        contextInfo
      }, { quoted: m });
    }

    await m.react("✅");

  } catch (error) {
    console.error(error);
    await m.react("❌");
    m.reply(`⚠️ Error: ${error.message}`);
  }
};

handler.command = /^(play|audio|play2|video)$/i;
export default handler;
