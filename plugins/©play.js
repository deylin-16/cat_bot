import fetch from "node-fetch";
import yts from "yt-search";
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co"; 
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M";
const supabase = createClient(SB_URL, SB_KEY);

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
        const { data } = await supabase
          .from('media_index')
          .select('file_id')
          .eq('id_video_yt', videoId)
          .eq('media_type', mediaType)
          .maybeSingle();
        if (data) cachedFileId = data.file_id;
      } catch { }
    }

    if (cachedFileId) {
      await m.react("⚡"); 
      try {
        return await conn.sendMessage(m.chat, { forward: { key: { remoteJid: conn.user.jid, id: cachedFileId } } }, { quoted: m });
      } catch { }
    }

    const type = isAudio ? 'mp3' : 'mp4';
    const apiUrl = `https://api.deylin.xyz/api/download/yt?url=${encodeURIComponent(url)}&type=${type}&apikey=dk_ofical_user`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || !data.success || !data.result?.download) {
      return global.design(conn, m, `❌ Error: ${data.error || "Falla en API"}`);
    }

    const { title, download, thumbnail, duration, channel } = data.result;
    const bodyText = `🎬 *Canal:* ${channel || 'Desconocido'}\n⏳ *Duración:* ${duration || '00:00'}`;
    let sentMsg;

    if (isAudio) {
      sentMsg = await conn.sendMessage(m.chat, {
        audio: { url: download },
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
        video: { url: download },
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