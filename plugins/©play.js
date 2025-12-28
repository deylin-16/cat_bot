import fetch from "node-fetch";
import yts from "yt-search";
import Jimp from "jimp";
import axios from "axios";
import crypto from "crypto";

async function resizeImage(buffer, size = 300) {
  const image = await Jimp.read(buffer);
  return image.resize(size, size).getBufferAsync(Jimp.MIME_JPEG);
}

const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    info: "/v2/info",
    download: "/download",
    cdn: "/random-cdn"
  },
  headers: {
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://yt.savetube.me",
    referer: "https://yt.savetube.me/",
    "user-agent": "Postify/1.0.0"
  },
  crypto: {
    hexToBuffer: (hexString) => {
      const matches = hexString.match(/.{1,2}/g);
      return Buffer.from(matches.join(""), "hex");
    },
    decrypt: async (enc) => {
      const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
      const data = Buffer.from(enc, "base64");
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = savetube.crypto.hexToBuffer(secretKey);
      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      let decrypted = decipher.update(content);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(decrypted.toString());
    },
  },
  isUrl: (str) => {
    try {
      new URL(str);
      return /youtube.com|youtu.be/.test(str);
    } catch (_) {
      return false;
    }
  },
  youtube: (url) => {
    const patterns = [
      /youtube.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtu.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (let pattern of patterns) {
      if (pattern.test(url)) return url.match(pattern)[1];
    }
    return null;
  },
  request: async (endpoint, data = {}, method = "post") => {
    try {
      const { data: response } = await axios({
        method,
        url: `${endpoint.startsWith("http") ? "" : savetube.api.base}${endpoint}`,
        data: method === "post" ? data : undefined,
        params: method === "get" ? data : undefined,
        headers: savetube.headers
      });
      return { status: true, code: 200, data: response };
    } catch (error) {
      return { status: false, code: error.response?.status || 500, error: error.message };
    }
  },
  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, "get");
    if (!response.status) return response;
    return { status: true, code: 200, data: response.data.cdn };
  },
  download: async (link, type = "audio") => {
    if (!savetube.isUrl(link)) return { status: false, code: 400, error: "URL inválida" };
    const id = savetube.youtube(link);
    if (!id) return { status: false, code: 400, error: "No se pudo obtener ID" };
    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;
      const videoInfo = await savetube.request(
        `https://${cdn}${savetube.api.info}`,
        { url: `https://www.youtube.com/watch?v=${id}` }
      );
      if (!videoInfo.status) return videoInfo;
      const decrypted = await savetube.crypto.decrypt(videoInfo.data.data);
      const downloadData = await savetube.request(
        `https://${cdn}${savetube.api.download}`,
        {
          id,
          downloadType: type === "audio" ? "audio" : "video",
          quality: type === "audio" ? "mp3" : "720p",
          key: decrypted.key
        }
      );
      if (!downloadData.data.data || !downloadData.data.data.downloadUrl)
        return { status: false, code: 500, error: "Error de descarga" };
      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Desconocido",
          download: downloadData.data.data.downloadUrl
        }
      };
    } catch (error) {
      return { status: false, code: 500, error: error.message };
    }
  }
};

const handler = async (m, { conn, text, command }) => {
  if (!text?.trim()) return global.design(conn, m, "Dame un link o nombre");
  await m.react("🔎");

  try {
    let url, title, thumbnail;

    if (savetube.isUrl(text)) {
      const id = savetube.youtube(text);
      const search = await yts({ videoId: id });
      url = text;
      title = search.title;
      thumbnail = search.thumbnail;
    } else {
      const search = await yts.search({ query: text, pages: 1 });
      if (!search.videos.length) return global.design(conn, m, "❌ No encontrado");
      url = search.videos[0].url;
      title = search.videos[0].title;
      thumbnail = search.videos[0].thumbnail;
    }

    const thumbResized = await resizeImage(await (await fetch(thumbnail)).buffer(), 300);
    let downloadUrl = null;
    const startTime = Date.now();

    try {
      const response = await fetch('https://ytpy.ultraplus.click/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, option: 'video' })
      });
      const data = await response.json();
      
      console.log({
        "success": data.success || false,
        "result": data.result || "...",
        "timestamp": new Date().toISOString(),
        "responseTime": `${Date.now() - startTime}ms`
      });

      if (data.success && data.result) {
        downloadUrl = data.result;
      }
    } catch (e) {}

    if (!downloadUrl) {
      const dl = await savetube.download(url, ["mp3", "play"].includes(command) ? "audio" : "video");
      if (dl.status) downloadUrl = dl.result.download;
    }

    if (!downloadUrl) return global.design(conn, m, "❌ Error al obtener descarga");

    await m.react("🎧");
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: global.name(conn),
            mediaType: 2,
            thumbnail: thumbResized,
            sourceUrl: url,
          }
        }
      },
      { quoted: m }
    );

  } catch (error) {
    return global.design(conn, m, `⚠️ Error: ${error.message}`);
  }
};

handler.command = /^(🎧|play|mp3|🎵)$/i;
export default handler;
