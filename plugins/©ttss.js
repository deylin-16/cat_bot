import axios from 'axios';

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `*── 「 SISTEMA DE BÚSQUEDA 」 ──*\n\n*Uso:* ${usedPrefix + command} <términos>\nEJ: ${usedPrefix + command} GATOS`, m);

    await m.react("🔍");

    try {
        const { data: response } = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`);

        if (!response.data || !response.data.videos || response.data.videos.length === 0) {
            await m.react("❌");
            return conn.reply(m.chat, `*── 「 SIN RESULTADOS 」 ──*\n\nNo se localizó contenido para: ${text}`, m);
        }

        const videoList = response.data.videos.slice(0, 5);
        

        await Promise.all(videoList.map(async (video, index) => {
            try {
                const videoUrl = `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`;
                const caption = `*── 「 TIKTOK RESULT ${index + 1} 」 ──*\n\n` +
                                `▢ *Título:* ${video.title || 'Sin título'}\n` +
                                `▢ *Autor:* ${video.author.nickname}\n` +
                                `▢ *Vistas:* ${video.play_count.toLocaleString()}\n` +
                                `▢ *Link:* ${videoUrl}`;

                const videoBuffer = await axios.get(video.play, { responseType: 'arraybuffer' });

                await conn.sendMessage(m.chat, { 
                    video: Buffer.from(videoBuffer.data), 
                    caption: caption,
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } catch (e) {
                console.error(`Error en video ${index + 1}:`, e.message);
            }
        }));

        await m.react("✅");

    } catch (error) {
        console.error(error);
        await m.react("❌");
        conn.reply(m.chat, `*LOG:* ${error.message}`, m);
    }
};

handler.command = /^(tiktoksearch|ttss|tiktoks)$/i;

export default handler;
