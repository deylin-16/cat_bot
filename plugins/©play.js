import fetch from "node-fetch";
import yts from "yt-search";
import Jimp from "jimp";

async function resizeImage(buffer, size = 300) {
  const image = await Jimp.read(buffer);
  return image.resize(size, size).getBufferAsync(Jimp.MIME_JPEG);
}

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) return global.design(conn, m, "Dame un link o nombre");
  await m.react("🔎");

  try {
    let url, title, thumbnail;

    if (/youtube.com|youtu.be/.test(text)) {
      const id = text.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandaylm\?v=))([\w\-]{11})/)?.[1];
      const search = await yts({ videoId: id });
      url = text;
      title = search.title;
      thumbnail = search.thumbnail;
    } else {
      const search = await yts.search({ query: text, pages: 1 });
      if (!search.videos.length) return global.design(conn, m, "❌ No encontrado");
      url = search.videos[0].url;
      title = search.videos[0].title;
      thumbnail = search.videos[0].thumbnail;
    }

    const thumbResized = await resizeImage(await (await fetch(thumbnail)).buffer(), 300);
    const startTime = Date.now();

    const response = await fetch('https://ytpy.ultraplus.click/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, option: 'video' })
    });
    
    const data = await response.json();

    console.log({
      "success": data.success || false,
      "result": data.result || "...",
      "timestamp": new Date().toISOString(),
      "responseTime": `${Date.now() - startTime}ms`
    });

    if (!data.success || !data.result) {
      return global.design(conn, m, "❌ La API no devolvió un resultado válido.");
    }

    await m.react("🎧");
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: data.result },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: global.name(conn),
            mediaType: 2,
            thumbnail: thumbResized,
            sourceUrl: url,
          }
        }
      },
      { quoted: m }
    );

  } catch (error) {
    return global.design(conn, m, `⚠️ Error: ${error.message}`);
  }
};

handler.command = /^(🎧|play|mp3|🎵)$/i;
export default handler;
