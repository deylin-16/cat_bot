import fetch from "node-fetch";
import yts from "yt-search";

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) return global.design(conn, m, `✨ *Uso correcto:*\n\n*${command}* nombre de la canción o link`);

  await m.react("🔎");

  try {
    let url;
    let videoId;

    if (/youtube.com|youtu.be/.test(text)) {
      url = text;
    } else {
      const search = await yts(text);
      if (!search.videos.length) return global.design(conn, m, "❌ No se encontró el video.");
      url = search.videos[0].url;
    }

    const type = (command === 'play' || command === 'audio') ? 'mp3' : 'mp4';
    const apiUrl = `https://api.dynlayer.xyz/api/download/${type}?url=${encodeURIComponent(url)}&apikey=dk_ofical_user`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.status !== 'success' || !data.download_url) {
      return global.design(conn, m, "❌ Error en el servidor de descargas.");
    }

    const res3 = await fetch("https://files.catbox.moe/wfd0ze.jpg");
    const thumb3 = Buffer.from(await res3.arrayBuffer());
    const fkontak = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        documentMessage: {
          title: `「 ${data.title} 」`,
          fileName: name(conn),
          jpegThumbnail: thumb3
        }
      }
    }


    if (type === 'mp3') {
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: data.download_url },
          mimetype: "audio/mp4",
          fileName: `${data.title}.mp3`
        },
        { quoted: fkontak }
      );
    } else {
      await m.react("🎥");
      await conn.sendMessage(
        m.chat, 
        {
          video: { url: data.download_url }, 
          caption: `✅ *Título:* ${data.title}\n🔗 *Link:* ${url}`,
          mimetype: "video/mp4",
          fileName: `${data.title}.mp4`,
          contextInfo: {
            externalAdReply: {
              title: data.title,
              body: data.info,
              mediaType: 1,
              renderLargerThumbnail: true,
              thumbnailUrl: data.thumbnail,
              sourceUrl: url
            }
          }
        }, 
        { quoted: m }
      );
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
