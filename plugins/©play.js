import yts from 'yt-search';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co";
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

const handler = async (m, { conn, text, command, usedPrefix }) => {
    if (!text?.trim()) return conn.reply(m.chat, `*── 「 SISTEMA DE DESCARGAS 」 ──*\n\n*Uso:* ${usedPrefix + command} <búsqueda>`, m);

    await m.react("⏳");

    try {
        let videoId, videoInfo;
        const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);

        if (videoMatch) {
            videoId = videoMatch[1];
            videoInfo = await yts({ videoId });
        } else {
            const search = await yts(text);
            if (!search.videos || search.videos.length === 0) return conn.reply(m.chat, "── 「 ERROR 」 ──\n\nNo se localizaron registros.", m);
            videoInfo = search.videos[0];
            videoId = videoInfo.videoId;
        }

        const url = 'https://youtube.com/watch?v=' + videoId;
        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const mediaType = isAudio ? 'audio' : 'video';

        const { data: cacheData } = await supabase.from('media_index')
            .select('file_id')
            .eq('id_video_yt', videoId)
            .eq('media_type', mediaType)
            .maybeSingle();

        if (cacheData?.file_id) {
            await m.react("⚡");
            try {
                return await conn.sendMessage(m.chat, { forward: { key: { remoteJid: conn.user.jid, id: cacheData.file_id } } }, { quoted: m });
            } catch {
                console.log("Reintento por fallo de caché");
            }
        }

        const infoText = `*── 「 CONTENIDO MULTIMEDIA 」 ──*\n\n▢ *TÍTULO:* ${videoInfo.title}\n▢ *CANAL:* ${videoInfo.author?.name || '---'}\n▢ *TIEMPO:* ${videoInfo.timestamp || '---'}\n▢ *TIPO:* ${mediaType.toUpperCase()}\n\n*──────────────────*`;

        await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

        const apiUrl = isAudio 
            ? `https://smasha.alyabot.xyz/download_audio?url=${encodeURIComponent(url)}`
            : `https://smasha.alyabot.xyz/download_video?url=${encodeURIComponent(url)}`;

        const apiRes = await fetch(apiUrl).then(res => res.json());
        const dlUrl = apiRes?.file_url;

        if (!dlUrl) throw new Error("API_OFFLINE");

        const mediaRes = await fetch(dlUrl);
        const buffer = await mediaRes.buffer();

        let sentMsg;
        if (isAudio) {
            sentMsg = await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: "audio/mp4",
                fileName: `${videoInfo.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: videoInfo.title,
                        body: 'Audio System',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: videoInfo.image,
                        sourceUrl: url
                    }
                }
            }, { quoted: m });
        } else {
            sentMsg = await conn.sendMessage(m.chat, {
                video: buffer,
                caption: `*── 「 COMPLETO 」 ──*\n\n▢ *FILE:* ${videoInfo.title}`,
                mimetype: "video/mp4",
                fileName: `${videoInfo.title}.mp4`
            }, { quoted: m });
        }

        if (sentMsg?.key?.id) {
            await supabase.from('media_index').upsert({ 
                id_video_yt: videoId, 
                file_id: sentMsg.key.id, 
                media_type: mediaType 
            });
        }

        await m.react("✅");
    } catch (error) {
        await m.react("❌");
        conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*LOG:* ${error.message}`, m);
    }
};

handler.command = /^(play|audio|mp3|video|mp4)$/i;
export default handler;
