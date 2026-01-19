import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import yts from "yt-search";
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co";
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': 'https://downr.org',
    'Referer': 'https://downr.org/',
    'Content-Type': 'application/json'
};

const handler = async (m, { conn, text, command }) => {
    if (!text?.trim()) return global.design(conn, m, `✨ *Uso correcto:*\n\n*${command}* nombre de la canción o link`);

    await m.react("🔎");
    try {
        let url, videoId;
        if (/youtube.com|youtu.be/.test(text)) {
            url = text;
            videoId = text.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
        } else {
            const search = await yts(text);
            if (!search.videos.length) return global.design(conn, m, "❌ No se encontró el video.");
            url = search.videos[0].url;
            videoId = search.videos[0].videoId;
        }

        const isAudio = /play$|audio$/i.test(command);
        const mediaType = isAudio ? 'audio' : 'video';
        const cacheKey = `yt:${mediaType}:${videoId}`;
        let cachedFileId = null;

        if (global.redis && !global.redisDisabled) {
            try {
                cachedFileId = await global.redis.get(cacheKey);
            } catch { }
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

        await client.get('https://downr.org/.netlify/functions/analytics', { headers }).catch(() => {});
        
        let info;
        for (let i = 0; i < 3; i++) {
            const res = await client.post('https://downr.org/.netlify/functions/video-info', { url }, { headers });
            info = res.data;
            if (info) break;
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!info) throw new Error("No se pudo obtener metadata.");

        const payload = isAudio 
            ? { url, downloadMode: 'audio', videoQuality: '128' }
            : { url, downloadMode: 'auto', videoQuality: '360p' };

        const dlRes = await client.post('https://downr.org/.netlify/functions/youtube-download', payload, { headers });
        const downloadUrl = dlRes.data?.url;

        if (!downloadUrl) throw new Error("No se generó link de descarga.");

        const title = info.title || "YouTube Media";
        const thumbnail = info.thumbnail || "";
        const bodyText = `🎬 *Canal:* ${info.author || 'Desconocido'}\n⏳ *Duración:* ${info.durationLabel || '00:00'}`;
        
        let sentMsg;
        if (isAudio) {
            sentMsg = await conn.sendMessage(m.chat, {
                audio: { url: downloadUrl },
                mimetype: "audio/mp4",
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: bodyText,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: thumbnail,
                        sourceUrl: url
                    }
                }
            }, { quoted: m });
        } else {
            await m.react("🎥");
            sentMsg = await conn.sendMessage(m.chat, {
                video: { url: downloadUrl },
                caption: `✅ *Título:* ${title}\n🔗 *Link:* ${url}\n${bodyText}`,
                mimetype: "video/mp4",
                fileName: `${title}.mp4`,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: bodyText,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: thumbnail,
                        sourceUrl: url
                    }
                }
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
        global.design(conn, m, `⚠️ Error: ${error.message}`);
    }
};

handler.command = /^(play|audio|play2|video)$/i;
export default handler;
