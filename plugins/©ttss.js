import axios from 'axios';
import { TikTokDL } from '@tobyg74/tiktok-api-dl';

const emoji = '🎥';

let handler = async (m, { conn, text }) => {
  const rwait = '🕒';
  const done = '✅';
  const fkontak = {
    key: { fromMe: false, participant: m.sender },
    message: { documentMessage: { title: 'TikTok Search', fileName: 'TikTok Video' } }
  };

  if (!text) return conn.reply(m.chat, `${emoji} Por favor, ingresa lo que deseas buscar.`, m);

  try {
    await m.react(rwait);
    
    const searchResults = await TikTokDL(text, { type: 'search' });

    if (!searchResults.result || searchResults.result.length === 0) {
      await m.react('❌');
      return conn.reply(m.chat, `No se encontraron resultados para "${text}".`, m);
    }

    const videoUrl = searchResults.result[0].videoUrl; 
    const downloadApi = `https://www.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(videoUrl)}&apikey=by_deylin`;
    const { data: dlData } = await axios.get(downloadApi);

    if (!dlData.success) {
      await m.react('❌');
      return conn.reply(m.chat, `Error al procesar el video.`, m);
    }

    const caption = `
${emoji} *TIKTOK SEARCH*
📝 *Título:* ${dlData.title || 'Sin título'}
👤 *Autor:* ${dlData.author || dlData.autor}
🔗 *Link:* ${videoUrl}
`.trim();

    await conn.sendMessage(m.chat, { 
      video: { url: dlData.video_url }, 
      caption: caption,
      mimetype: 'video/mp4'
    }, { quoted: fkontak });

    await m.react(done);

  } catch (error) {
    await m.react('❌');
    conn.reply(m.chat, `Error: ${error.message}`, m);
  }
};

handler.help = ['tiktoksearch <txt>'];
handler.tags = ['buscador'];
handler.command = ['tiktoksearch', 'ttss', 'tiktoks'];

export default handler;
