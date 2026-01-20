import yts from 'yt-search';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co";
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

const handler = async (m, { conn, text, command, usedPrefix }) => {
    if (!text?.trim()) return conn.reply(m.chat, `*── 「 USO DEL SISTEMA 」 ──*\n\n*Comando:* ${usedPrefix + command} <búsqueda>\n*Estado:* Esperando parámetros...`, m);

    await m.react("⏳");

    try {
        let videoId, videoInfo;
        const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);

        if (videoMatch) {
            videoId = videoMatch[1];
            videoInfo = await yts({ videoId });
        } else {
            const search = await yts(text);
            if (!search.videos.length) return conn.reply(m.chat, "── 「 ERROR 」 ──\n\nNo se localizaron registros.", m);
            videoInfo = search.videos[0];
            videoId = videoInfo.videoId;
        }

        const url = 'https://youtu.be/' + videoId;
        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const mediaType = isAudio ? 'audio' : 'video';
        const cacheKey = `yt:${mediaType}:${videoId}`;
        let cachedFileId = null;

        if (global.db.data.settings?.[conn.user.jid]?.cache) {
            const { data } = await supabase.from('media_index').select('file_id').eq('id_video_yt', videoId).eq('media_type', mediaType).maybeSingle();
            if (data) cachedFileId = data.file_id;
        }

        if (cachedFileId) {
            await m.react("🍪");
            return await conn.sendMessage(m.chat, { forward: { key: { remoteJid: conn.user.jid, id: cachedFileId } } }, { quoted: m });
        }

        const info = `> \t\t*DOWNLOADER*
  
  ▢ *CONTENIDO:* ${videoInfo.title}
  ▢ *CANAL:* ${videoInfo.author?.name || '---'}
  ▢ *TIEMPO:* ${videoInfo.timestamp || '---'}
  ▢ *VISTAS:* ${(videoInfo.views || 0).toLocaleString()}
  ▢ *ORIGEN:* ${url}`;

        await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: info }, { quoted: m });

        const mediaData = isAudio ? await getAudioFromApis(url) : await getVideoFromApis(url);
        if (!mediaData?.url) throw new Error("Null_Payload_Response");

        let sentMsg;
        if (isAudio) {
            sentMsg = await conn.sendMessage(m.chat, {
                audio: { url: mediaData.url },
                mimetype: "audio/mp4",
                fileName: `${videoInfo.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: videoInfo.title,
                        body: 'Audio Metadata System',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: videoInfo.image,
                        sourceUrl: url
                    }
                }
            }, { quoted: m });
        } else {
            sentMsg = await conn.sendMessage(m.chat, {
                video: { url: mediaData.url },
                caption: `*── 「 SYSTEM COMPLETE 」 ──*\n\n▢ *ID:* ${videoId}\n▢ *FILE:* ${videoInfo.title}`,
                mimetype: "video/mp4",
                fileName: `${videoInfo.title}.mp4`
            }, { quoted: m });
        }

        if (sentMsg?.key?.id) {
            await supabase.from('media_index').upsert({ 
                id_video_yt: videoId, 
                file_id: sentMsg.key.id, 
                media_type: mediaType 
            }).catch(() => {});
        }

        await m.react("✅");
    } catch (error) {
        await m.react("❌");
        console.error(`[SYSTEM_ERROR]: ${error.message}`);
        conn.reply(m.chat, `*── 「 SYSTEM FAILURE 」 ──*\n\n*LOG:* ${error.message}`, m);
    }
};

async function getAudioFromApis(url) {
    const endpoints = [
        `https://api-adonix.ultraplus.click/download/ytaudio?apikey=Destroy&url=${encodeURIComponent(url)}`,
        `https://api.stellarwa.xyz/dl/ytmp3?url=${encodeURIComponent(url)}&quality=256&key=Yuki-WaBot`,
        `https://api.vreden.web.id/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=256`
    ];
    return await requestService(endpoints);
}

async function getVideoFromApis(url) {
    const endpoints = [
        `https://api-adonix.ultraplus.click/download/ytvideo?apikey=Destroy&url=${encodeURIComponent(url)}`,
        `https://api.stellarwa.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&quality=360&key=Yuki-WaBot`
    ];
    return await requestService(endpoints);
}

async function requestService(urls) {
    for (const link of urls) {
        try {
            const res = await fetch(link, { timeout: 15000 }).then(r => r.json());
            const downloadUrl = res?.data?.url || res?.data?.dl || res?.result?.download?.url || res?.result?.download;
            if (downloadUrl) return { url: downloadUrl };
        } catch (e) { continue; }
    }
    return null;
}

handler.command = /^(play|audio|mp3|video|mp4)$/i;
export default handler;
