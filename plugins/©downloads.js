import fetch from 'node-fetch';
import { igdl } from 'ruhend-scraper';

const processingResponses = [
    "Procesando solicitud de descarga. Analizando metadatos del recurso web.",
    "Inicializando protocolo de adquisición de contenido. Esperando respuesta del servidor de origen.",
    "El sistema está realizando la depuración y estructuración del enlace.",
    "Estableciendo conexión segura y validando el identificador del recurso.",
    "Módulo de rastreo activo. Recuperando información del vídeo solicitado."
];

const errorResponses = {
    general: [
        "Fallo de acceso al recurso. Verifique la sintaxis y disponibilidad del enlace.",
        "Error en la secuencia de depuración de datos.",
        "Advertencia: Enlace no procesable. Intente con una URL diferente."
    ],
    unknown: [
        "Plataforma no reconocida o enlace inválido.",
        "Se requiere una URL válida de TikTok, Instagram o Facebook."
    ]
};

function getRandomResponse(array) {
    return array[Math.floor(Math.random() * array.length)];
}

async function tiktokdl(url) {
    const apikey = "dk_ofical_user";
    const apiEndpoint = `https://api.deylin.xyz/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=${apikey}`;
    
    const res = await fetch(apiEndpoint);
    const json = await res.json();

    if (!json.success) throw new Error(json.error || "Error en la API de Deylin");
    
    return json;
}

async function igfb_dl(url) {
    try {
        const res = await igdl(url);
        if (!res || !res.data || res.data.length === 0) return null;
        return res.data;
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
        await global.design(conn, m, getRandomResponse(processingResponses));

        if (url.includes('tiktok.com')) {
            const data = await tiktokdl(url);
            const videoURL = data.play || data.wmplay;

            if (!videoURL) throw new Error("NO_VIDEO_URL");

            
            const caption = `*── 「 TIKTOK DOWNLOAD 」 ──*\n\n` +
                            `▢ *TÍTULO:* ${data.title || 'Sin título'}\n` +
                            `▢ *AUTOR:* ${data.music_info?.author || '---'}\n` +
                            `▢ *DURACIÓN:* ${data.duration}s\n` +
                            `▢ *VISTAS:* ${data.stats?.play_count || '---'}\n` +
                            `▢ *CRÉDITOS:* ${data.restantes} disp.\n\n` +
                            `*──────────────────*`;

            result = { url: videoURL, filename: 'tiktok.mp4', caption };

        } 
        else if (url.includes('instagram.com')) {
            const data = await igfb_dl(url);
            if (!data) throw new Error("IG_ERROR");

            for (let media of data) {
                const isVideo = media.url.includes('.mp4');
                const caption = `*── 「 INSTAGRAM 」 ──*\n\n▢ *TIPO:* ${isVideo ? 'VIDEO' : 'IMAGEN'}\n*──────────────────*`;
                await conn.sendFile(m.chat, media.url, isVideo ? 'instagram.mp4' : 'instagram.jpg', caption, m);
            }
            await m.react('✅');
            return;

        }
        else if (url.includes('facebook.com') || url.includes('fb.watch')) {
            const data = await igfb_dl(url);
            if (!data) throw new Error("FB_ERROR");

            const videoData = data.find(i => i.resolution === "720p (HD)") || data[0];
            const caption = `*── 「 FACEBOOK 」 ──*\n\n▢ *CALIDAD:* ${videoData.resolution || 'Standard'}\n*──────────────────*`;
            
            result = { url: videoData.url, filename: 'facebook.mp4', caption };
        } 
        else {
            await m.react('❌');
            return global.design(conn, m, getRandomResponse(errorResponses.unknown));
        }

        if (result && result.url) {
            await conn.sendFile(m.chat, result.url, result.filename, result.caption, m);
            await m.react('✅');
        }

    } catch (error) {
        console.error("Error en Descargador:", error);
        await m.react('❌');
        const errorText = `${getRandomResponse(errorResponses.general)}\n\n*Log:* ${error.message}`;
        return global.design(conn, m, errorText);
    }
};

handler.command = ['dl', 'descarga', 'fb', 'ig', 'tiktok', 'tt'];
handler.register = true;

export default handler;
