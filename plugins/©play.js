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
      const search = await yts({ videoId: yts(url).videos?.[0]?.videoId || text.split('v=')[1]?.split('&')[0] || text.split('/').pop() });
      videoInfo = search;
    } else {
      const search = await yts(text);
      if (!search.videos.length) return global.design(conn, m, "❌ No se encontró el video.");
      videoInfo = search.videos[0];
      url = videoInfo.url;
    }

    const type = (command === 'play' || command === 'audio') ? 'audio' : 'video';
    const apiUrl = `${url_api}/api/download/yt?url=${encodeURIComponent(url)}&apikey=${key}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.success !== true || !data.result) {
      return global.design(conn, m, "❌ Error en el servidor de descargas.");
    }

    const res = data.result;
    const downloadUrl = res.download_url;

    const contextInfo = {
      externalAdReply: {
        title: res.title || videoInfo.title,
        body: `Metodo: ${data.method === 'scraper' ? 'Rápido' : 'Respaldo'}`,
        mediaType: 1,
        thumbnailUrl: res.thumbnail || videoInfo.thumbnail || videoInfo.image,
        sourceUrl: url,
        renderLargerThumbnail: true
      }
    };

    if (type === 'audio') {
      await m.react("🎧");
      await conn.sendMessage(m.chat, {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${res.title}.mp3`,
        ptt: false,
        contextInfo
      }, { quoted: m });
    } else {
      await m.react("🎥");
      await conn.sendMessage(m.chat, {
        video: { url: downloadUrl },
        caption: `✅ *Título:* ${res.title}\n📊 *Método:* ${data.method}\n🔗 *Link:* ${url}`,
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
