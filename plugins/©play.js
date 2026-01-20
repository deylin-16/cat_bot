import yts from 'yt-search';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co";
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

const handler = async (m, { conn, text, command, usedPrefix }) => {
    if (!text?.trim()) return conn.reply(m.chat, `*── 「 SISTEMA DE DESCARGAS 」 ──*\n\n*Uso:* ${usedPrefix + command} <búsqueda o enlace>\n*Estado:* Requerido`, m);

    await m.react("⏳");

    try {
        let videoId, videoInfo;
        const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);

        if (videoMatch) {
            videoId = videoMatch[1];
            videoInfo = await yts({ videoId });
        } else {
            const search = await yts(text);
            if (!search.videos.length) return conn.reply(m.chat, "── 「 ERROR 」 ──\n\nNo se encontraron registros en la red.", m);
            videoInfo = search.videos[0];
            videoId = videoInfo.videoId;
        }

        const url = 'https://youtu.be/' + videoId;
        const isAudio = /play$|audio$|mp3|ytmp3/i.test(command);
        const mediaType = isAudio ? 'audio' : 'video';
        const cacheKey = `yt:${mediaType}:${videoId}`;
        
        // Verificación de Caché en Supabase
        const { data: cacheData } = await supabase.from('media_index').select('file_id').eq('id_video_yt', videoId).eq('media_type', mediaType).maybeSingle();

        if (cacheData?.file_id) {
            await m.react("⚡");
            return await conn.sendMessage(m.chat, { forward: { key: { remoteJid: conn.user.jid, id: cacheData.file_id } } }, { quoted: m });
        }

        const infoText = `*── 「 CONTENIDO MULTIMEDIA 」 ──*
  
  ▢ *TÍTULO:* ${videoInfo.title}
  ▢ *CANAL:* ${videoInfo.author?.name || '---'}
  ▢ *TIEMPO:* ${videoInfo.timestamp || '---'}
  ▢ *VISTAS:* ${(videoInfo.views || 0).toLocaleString()}
  ▢ *ORIGEN:* ${url}
  
  *──────────────────*`;

        await conn.sendMessage(m.chat, { image: { url: videoInfo.image || videoInfo.thumbnail }, caption: infoText }, { quoted: m });

        const mediaData = isAudio ? await getAudioFromApis(url) : await getVideoFromApis(url);
        
        if (!mediaData || !mediaData.url) {
            throw new Error("No_Service_Available");
        }

        let sentMsg;
        if (isAudio) {
            sentMsg = await conn.sendMessage(m.chat, {
                audio: { url: mediaData.url },
                mimetype: "audio/mp4",
                fileName: `${videoInfo.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: videoInfo.title,
                        body: 'Procesamiento de Audio Estándar',
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
                caption: `*── 「 DESCARGA EXITOSA 」 ──*\n\n▢ *ID:* ${videoId}\n▢ *FILE:* ${videoInfo.title}`,
                mimetype: "video/mp4",
                fileName: `${videoInfo.title}.mp4`
            }, { quoted: m });
        }

        // Guardado en Caché Post-Envío
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
        conn.reply(m.chat, `*── 「 ERROR DE SISTEMA 」 ──*\n\n*MENSAJE:* ${error.message}`, m);
    }
};

async function getAudioFromApis(url) {
    const urls = [
        `https://api-adonix.ultraplus.click/download/ytaudio?apikey=Destroy&url=${encodeURIComponent(url)}`,
        `https://api.stellarwa.xyz/dl/ytmp3?url=${encodeURIComponent(url)}&quality=256&key=Yuki-WaBot`,
        `https://api.vreden.web.id/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=256`
    ];
    return await fetchFastest(urls);
}

async function getVideoFromApis(url) {
    const urls = [
        `https://api-adonix.ultraplus.click/download/ytvideo?apikey=Destroy&url=${encodeURIComponent(url)}`,
        `https://api.stellarwa.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&quality=360&key=Yuki-WaBot`
    ];
    return await fetchFastest(urls);
}

async function fetchFastest(urls) {
    for (const api of urls) {
        try {
            const res = await fetch(api, { timeout: 15000 }).then(r => r.json());
            const dUrl = res?.data?.url || res?.data?.dl || res?.result?.download?.url || res?.result?.download;
            if (dUrl && typeof dUrl === 'string') return { url: dUrl };
        } catch (e) { continue; }
    }
    return null;
}

handler.command = /^(play|audio|mp3|video|mp4)$/i;
export default handler;
