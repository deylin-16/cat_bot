import fetch from 'node-fetch';
import { igdl } from 'ruhend-scraper';

const formatViews = (num) => {
    if (!num) return '---';
    return Intl.NumberFormat('en', { notation: 'compact' }).format(num);
};

async function tiktokdl(url) {
    const apikey = "dk_ofical_user";
    const apiEndpoint = `https://api.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=${apikey}`;

    try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Error en la API de Deylin");
        return json;
    } catch (e) {
        throw new Error("Servidor de TikTok no disponible");
    }
}

async function igfb_dl(url) {
    try {
        const res = await igdl(url);
        if (!res || !res.data || !Array.isArray(res.data) || res.data.length === 0) return null;
        return res; 
    } catch {
        return null;
    }
}

var handler = async (m, { conn, args }) => {
    if (!args[0]) {
        return global.design(conn, m, `Introduzca un enlace válido para iniciar la descarga.`);
    }

    const url = args[0];
    let result = null;

    try {
        await m.react('⏳');

        if (url.match(/(tiktok\.com|vt\.tiktok\.com)/gi)) {
            const data = await tiktokdl(url);
            const videoURL = data.play || data.wmplay;

            if (!videoURL) throw new Error("No se encontró el enlace de descarga.");

            const caption = `*── 「 TIKTOK DOWNLOAD 」 ──*\n\n` +
                            `▢ *TÍTULO:* ${data.title || 'Sin título'}\n` +
                            `▢ *AUTOR:* ${data.music_info?.author || '---'}\n` +
                            `▢ *DURACIÓN:* ${data.duration}s\n` +
                            `▢ *VISTAS:* ${formatViews(data.stats?.play_count)}\n` +
                            `▢ *CRÉDITOS:* ${data.restantes} disp.\n\n` +
                            `*──────────────────*`;

            result = { url: videoURL, filename: 'tiktok.mp4', caption };
        } 
        
        else if (url.includes('instagram.com')) {
            const res = await igfb_dl(url);
            if (!res) throw new Error("No pude obtener datos de Instagram.");

            for (let media of res.data) {
                const isVideo = media.url.includes('.mp4');
                const caption = `*── 「 INSTAGRAM 」 ──*\n\n` +
                                `▢ *POST:* ${url}\n` +
                                `▢ *TIPO:* ${isVideo ? 'VIDEO' : 'IMAGEN'}\n` +
                                `*──────────────────*`;
                await conn.sendFile(m.chat, media.url, isVideo ? 'instagram.mp4' : 'instagram.jpg', caption, m);
            }
            await m.react('✅');
            return;
        }

        else if (url.match(/(facebook\.com|fb\.watch)/gi)) {
            const res = await igfb_dl(url);
            if (!res) throw new Error("No pude obtener datos de Facebook.");

            const videoData = res.data.find(i => i.resolution === "720p (HD)") || res.data[0];
            const caption = `*── 「 FACEBOOK 」 ──*\n\n` +
                            `▢ *CALIDAD:* ${videoData.resolution || 'Standard'}\n` +
                            `▢ *LINK:* ${url}\n\n` +
                            `*──────────────────*`;

            result = { url: videoData.url, filename: 'facebook.mp4', caption };
        } 
        else {
            await m.react('❌');
            return global.design(conn, m, "Enlace no soportado.");
        }

        if (result && result.url) {
            await conn.sendFile(m.chat, result.url, result.filename, result.caption, m);
            await m.react('✅');
        }

    } catch (error) {
        console.error("Error en Descargador:", error);
        await m.react('❌');
        return global.design(conn, m, `*ERROR:* ${error.message}`);
    }
};

handler.command = ['dl', 'descarga', 'fb', 'ig', 'tiktok', 'tt'];
handler.register = true;

export default handler;
