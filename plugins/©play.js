import fetch from "node-fetch";
import yts from "yt-search";

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) return global.design(conn, m, `✨ *Uso correcto:*\n\n*${command}* nombre de la canción o link`);
  await m.react("🔎");
  try {
    let url;
    if (/youtube.com|youtu.be/.test(text)) {
      url = text;
    } else {
      const search = await yts(text);
      if (!search.videos.length) return global.design(conn, m, "❌ No se encontró el video.");
      url = search.videos[0].url;
    }

    const isAudio = /play$|audio$/i.test(command);
    const type = isAudio ? 'mp3' : 'mp4';
    const apiUrl = `https://api.deylin.xyz/api/download/yt?url=${encodeURIComponent(url)}&type=${type}&apikey=dk_ofical_user`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || !data.success || !data.result?.download) {
      return global.design(conn, m, `❌ Error: ${data.error || "No se pudo obtener el enlace de descarga."}`);
    }

    const { title, download, thumbnail, duration, channel } = data.result;
    const bodyText = `🎬 *Canal:* ${channel || 'Desconocido'}\n⏳ *Duración:* ${duration || '00:00'}`;

    if (isAudio) {
      await conn.sendMessage(m.chat, {
        audio: { url: download },
        mimetype: "audio/mp4",
        fileName: `${title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: bodyText,
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnailUrl: thumbnail,
            sourceUrl: url
          }
        }
      }, { quoted: m });
    } else {
      await m.react("🎥");
      await conn.sendMessage(m.chat, {
        video: { url: download },
        caption: `✅ *Título:* ${title}\n🔗 *Link:* ${url}\n${bodyText}`,
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: bodyText,
            mediaType: 1,
            renderLargerThumbnail: true,
            thumbnailUrl: thumbnail,
            sourceUrl: url
          }
        }
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