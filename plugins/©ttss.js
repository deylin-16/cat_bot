import axios from 'axios';

let handler = async (m, { conn, text }) => {
  const rwait = '🕒';
  const done = '✅';
  const url_api = 'https://api.dynlayer.xyz'; 

  if (!text) return global.design(conn, m, `Por favor, ingresa lo que deseas buscar.`);

  try {
    await m.react(rwait);

    
    const { data: response } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`);

    if (!response.data || !response.data.videos || response.data.videos.length === 0) {
      await m.react('❌');
      return global.design(conn, m, `No se encontraron resultados para "${text}".`);
    }

    
    const videoData = response.data.videos[0];
    const videoUrl = `https://www.tiktok.com/@${videoData.author.unique_id}/video/${videoData.video_id}`;

    
    const { data: dlData } = await axios.get(`${url_api}/api/download/tiktok?url=${encodeURIComponent(videoUrl)}&apikey=dk_ofical_user`);

    let finalVideo, finalTitle, finalAuthor;

    if (dlData.success) {
      
      finalVideo = dlData.play; 
      finalTitle = dlData.title;
      finalAuthor = dlData.autor; 
    } else {
      finalVideo = videoData.play;
      finalTitle = videoData.title;
      finalAuthor = videoData.author.nickname;
    }

    const caption = `
*TIKTOK SEARCH*
📝 *Título:* ${finalTitle || 'Sin título'}
👤 *Autor:* ${finalAuthor}
🔗 *Link:* ${videoUrl}
`.trim();

    await conn.sendMessage(m.chat, { 
      video: { url: finalVideo }, 
      caption: caption,
      mimetype: 'video/mp4'
    }, { quoted: m });

    await m.react(done);

  } catch (error) {
    console.error(error);
    await m.react('❌');
    conn.reply(m.chat, `Error: ${error.message}`, m);
  }
};

handler.command = ['tiktoksearch', 'ttss', 'tiktoks'];

export default handler;
