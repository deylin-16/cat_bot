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
    let url;
    if (/youtube.com|youtu.be/.test(text)) {
      url = text;
    } else {
      const search = await yts.search({ query: text, pages: 1 });
      if (!search.videos.length) return global.design(conn, m, "❌ No encontrado");
      url = search.videos[0].url;
    }

    const apiUrl = `https://api.deylin.xyz/api/download/yt?url=${encodeURIComponent(url)}&apikey=845dc`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status !== "success" || !data.url) {
      return global.design(conn, m, "❌ La API no devolvió un resultado válido.");
    }

    const finalUrl = data.url.replace(/^"|"$/g, '');

    const thumbBuffer = data.thumbnail ? await (await fetch(data.thumbnail)).buffer() : Buffer.alloc(0);
    const thumbResized = data.thumbnail ? await resizeImage(thumbBuffer, 300) : null;

    await m.react("🎧");
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: finalUrl },
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: data.title,
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
