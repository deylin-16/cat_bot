import yts from 'yt-search';
import fetch from 'node-fetch';

const localCache = {};

const youtubeCommand = {
    name: 'youtube_play',
    alias: ['play', 'audio', 'mp3', 'video', 'mp4', 'play2'],
    category: 'download',
    run: async (m, { conn, text, command, usedPrefix }) => {
        if (!text?.trim()) return conn.reply(m.chat, `*── 「 SISTEMA DE DESCARGAS 」 ──*\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);

        await m.react("⌛");

        try {
            let videoId, videoInfo;
            const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);

            if (videoMatch) {
                videoId = videoMatch[1];
                videoInfo = await yts({ videoId });
            } else {
                const search = await yts(text);
                if (!search.videos || search.videos.length === 0) return conn.reply(m.chat, "No se hallaron resultados.", m);
                videoInfo = search.videos[0];
                videoId = videoInfo.videoId;
            }

            const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
            const url = 'https://youtube.com/watch?v=' + videoId;
            const views = videoInfo.views?.toLocaleString() || '---';

            const encryptedUrl = isAudio ? global.api_endpoints.a : global.api_endpoints.v;
            const rawApi = Buffer.from(encryptedUrl, 'base64').toString('utf-8');
            const apiUrl = `${rawApi}?url=${encodeURIComponent(url)}`;

            const infoText = `*── 「 CONTENIDO MULTIMEDIA 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}\n▢ *CANAL:* ${videoInfo.author?.name || '---'}\n▢ *TIEMPO:* ${videoInfo.timestamp || '---'}\n▢ *VISTAS:* ${views}\n▢ *PUBLICADO:* ${videoInfo.ago || '---'}\n▢ *ID YT:* ${videoId}\n▢ *LINK:* ${url}\n▢ *ENVIANDO:* ${isAudio ? 'audio' : 'video'}... por favor espere._`;

            await conn.sendMessage(m.chat, { 
                image: { url: videoInfo.image || videoInfo.thumbnail }, 
                caption: infoText 
            }, { quoted: m });

            const apiRes = await fetch(apiUrl).then(res => res.json());
            const dlUrl = apiRes?.file_url;

            if (!dlUrl) throw new Error("ENC_SERVER_ERROR");

            const mediaRes = await fetch(dlUrl);
            const buffer = await mediaRes.buffer();

            if (isAudio) {
                await conn.sendMessage(m.chat, { 
                    audio: buffer, 
                    mimetype: "audio/mp4", 
                    fileName: `${videoInfo.title}.mp3` 
                }, { quoted: m });
            } else {
                await conn.sendMessage(m.chat, { 
                    video: buffer, 
                    caption: `❑ *${videoInfo.title}*`, 
                    mimetype: "video/mp4" 
                }, { quoted: m });
            }

            await m.react("✅");
        } catch (error) {
            await m.react("❌");
            console.error(error);
            conn.reply(m.chat, `*── 「 ERROR PRIVADO 」 ──*\n\nEl servidor no respondió. Intente más tarde.`, m);
        }
    }
};

export default youtubeCommand;
