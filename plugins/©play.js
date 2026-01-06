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
      const search = await yts({ videoId: text.split('v=')[1]?.split('&')[0] || text.split('/').pop() });
      videoInfo = search;
    } else {
      const search = await yts(text);
      if (!search.videos.length) return global.design(conn, m, "❌ No se encontró el video.");
      videoInfo = search.videos[0];
      url = videoInfo.url;
    }

    const apiUrl = `${url_api}/api/download/yt?url=${encodeURIComponent(url)}&apikey=${key}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.status !== 'success' || !data.download_url) {
      return global.design(conn, m, "❌ Error en el servidor de descargas.");
    }

    const contextInfo = {
      externalAdReply: {
        title: data.title,
        body: data.info,
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: data.thumbnail,
        sourceUrl: url
      }
    };

    if (command === 'play' || command === 'audio') {
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: data.download_url },
          mimetype: "audio/mp4",
          fileName: `${data.title}.m4a`,
          contextInfo: {
            externalAdReply: {
              title: data.title,
              body: data.info,
              thumbnailUrl: data.thumbnail,
              mediaType: 2,
              mediaUrl: url,
              sourceUrl: url
            }
          }
        },
        { quoted: m }
      );
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
    global.design(conn, m, `⚠️ Error: ${error.message}`);
  }
};

handler.command = /^(play|audio|play2|video)$/i;
export default handler;
