import yts from 'yt-search';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co";
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

const handler = async (m, { conn, text, command, usedPrefix }) => {
    if (!text?.trim()) return conn.reply(m.chat, `⚠️ *Uso:* ${usedPrefix + command} <nombre o enlace>`, m);

    await m.react("⏳");

    try {
        let videoId, videoInfo;
        const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);

        if (videoMatch) {
            videoId = videoMatch[1];
            const search = await yts({ videoId });
            videoInfo = search;
        } else {
            const search = await yts(text);
            if (!search.videos.length) return conn.reply(m.chat, "❌ Sin resultados.", m);
            videoInfo = search.videos[0];
            videoId = videoInfo.videoId;
        }

        const url = 'https://youtu.be/' + videoId;
        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const mediaType = isAudio ? 'audio' : 'video';
        const cacheKey = `yt:${mediaType}:${videoId}`;
        let cachedFileId = null;

        if (global.redis && !global.redisDisabled) {
            try { cachedFileId = await global.redis.get(cacheKey); } catch { }
        }

        if (!cachedFileId) {
            try {
                const { data } = await supabase.from('media_index').select('file_id').eq('id_video_yt', videoId).eq('media_type', mediaType).maybeSingle();
                if (data) cachedFileId = data.file_id;
            } catch { }
        }

        if (cachedFileId) {
            await m.react("⚡");
            try {
                return await conn.sendMessage(m.chat, { forward: { key: { remoteJid: conn.user.jid, id: cachedFileId } } }, { quoted: m });
            } catch { }
        }

        const infoMessage = `[ DOWNLOADER - YOUTUBE ]\n\n` +
            `• Título: ${videoInfo.title}\n` +
            `• Canal: ${videoInfo.author?.name || '---'}\n` +
            `• Duración: ${videoInfo.timestamp || '---'}\n` +
            `• Vistas: ${(videoInfo.views || 0).toLocaleString()}\n` +
            `• Link: ${url}`;

        await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoMessage }, { quoted: m });

        const mediaData = isAudio ? await getAudioFromApis(url) : await getVideoFromApis(url);
        if (!mediaData?.url) throw new Error(`No se pudo obtener el archivo.`);

        let sentMsg;
        if (isAudio) {
            sentMsg = await conn.sendMessage(m.chat, {
                audio: { url: mediaData.url },
                mimetype: "audio/mp4",
                fileName: `${videoInfo.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: videoInfo.title,
                        body: videoInfo.author?.name,
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
                caption: `✅ Descarga completada\n• ${videoInfo.title}`,
                mimetype: "video/mp4",
                fileName: `${videoInfo.title}.mp4`
            }, { quoted: m });
        }

        if (sentMsg?.key?.id) {
            const newFileId = sentMsg.key.id;
            if (global.redis && !global.redisDisabled) {
                await global.redis.set(cacheKey, newFileId, { EX: 86400 }).catch(() => {});
            }
            await supabase.from('media_index').upsert({ 
                id_video_yt: videoId, 
                file_id: newFileId, 
                media_type: mediaType 
            }).catch(() => {});
        }

        await m.react("✅");
    } catch (error) {
        await m.react("❌");
        conn.reply(m.chat, `⚠️ Error: ${error.message}`, m);
    }
};

async function getAudioFromApis(url) {
    const apis = [
        `https://api-adonix.ultraplus.click/download/ytaudio?apikey=Destroy&url=${encodeURIComponent(url)}`,
        `https://api.stellarwa.xyz/dl/ytmp3?url=${encodeURIComponent(url)}&quality=256&key=Yuki-WaBot`,
        `https://api.vreden.web.id/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=256`,
        `https://api.ootaizumi.web.id/downloader/youtube/play?query=${encodeURIComponent(url)}`,
        `https://api.nekolabs.web.id/downloader/youtube/v1?url=${encodeURIComponent(url)}&format=mp3`
    ];

    for (const api of apis) {
        try {
            const res = await fetch(api, { timeout: 15000 }).then(r => r.json());
            const link = res?.data?.url || res?.data?.dl || res?.result?.download?.url || res?.result?.download || res?.result?.downloadUrl;
            if (link) return { url: link };
        } catch (e) {}
    }
    return null;
}

async function getVideoFromApis(url) {
    const apis = [
        `https://api-adonix.ultraplus.click/download/ytvideo?apikey=Destroy&url=${encodeURIComponent(url)}`,
        `https://api.stellarwa.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&quality=360&key=Yuki-WaBot`,
        `https://api.vreden.web.id/api/v1/download/youtube/video?url=${encodeURIComponent(url)}&quality=360`,
        `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(url)}`
    ];

    for (const api of apis) {
        try {
            const res = await fetch(api, { timeout: 15000 }).then(r => r.json());
            const link = res?.data?.url || res?.data?.dl || res?.result?.download?.url || res?.result?.download || res?.result?.downloadUrl;
            if (link) return { url: link };
        } catch (e) {}
    }
    return null;
}

handler.command = /^(play|audio|mp3|ytmp3|play2|video|mp4|ytmp4)$/i;
export default handler;
