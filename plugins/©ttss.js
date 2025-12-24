import axios from 'axios';

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
    
    const { data: response } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`);

    if (!response.data || !response.data.videos || response.data.videos.length === 0) {
      await m.react('❌');
      return conn.reply(m.chat, `No se encontraron resultados para "${text}".`, m);
    }

    const video = response.data.videos[0];
    const videoUrl = `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`;

    const { data: dlData } = await axios.get(`${url_api}/api/download/tiktok?url=${encodeURIComponent(videoUrl)}&apikey=by_deylin`);

    let finalVideo, finalTitle, finalAuthor;

    if (dlData.success) {
      finalVideo = dlData.video_url;
      finalTitle = dlData.title;
      finalAuthor = dlData.author || dlData.autor;
    } else {
      finalVideo = video.play;
      finalTitle = video.title;
      finalAuthor = video.author.nickname;
    }

    const caption = `
${emoji} *TIKTOK SEARCH*
📝 *Título:* ${finalTitle || 'Sin título'}
👤 *Autor:* ${finalAuthor}
🔗 *Link:* ${videoUrl}
`.trim();

    await conn.sendMessage(m.chat, { 
      video: { url: finalVideo }, 
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
