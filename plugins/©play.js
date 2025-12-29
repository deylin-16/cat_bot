import fetch from "node-fetch";
import yts from "yt-search";

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) return global.design(conn, m, "Dame un link o nombre para el audio");
  await m.react("🎧");

  try {
    let url;
    if (/youtube.com|youtu.be/.test(text)) {
      url = text;
    } else {
      const search = await yts.search({ query: text, pages: 1 });
      if (!search.videos.length) return global.design(conn, m, "❌ No encontrado");
      url = search.videos[0].url;
    }

    
    const apiUrl = `https://file.deylin.xyz/download?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.status !== "success" || !data.download_url) {
      return global.design(conn, m, "❌ El servidor de audio no respondió.");
    }

    await m.react("📩");

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: data.download_url },
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
        ptt: false 
      },
      { quoted: m }
    );

    await m.react("✅");

  } catch (error) {
    console.error(error);
    return global.design(conn, m, `⚠️ Error: ${error.message}`);
  }
};

handler.command = /^(audio|mp3|play|aud)$/i;
export default handler;
