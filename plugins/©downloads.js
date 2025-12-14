import fetch from 'node-fetch';
import { igdl } from 'ruhend-scraper';

const processingResponse = "Procesando solicitud de descarga. Analizando metadatos del recurso web.";

const errorResponses = {
    general: [
        "Fallo de acceso al recurso. Verifique la sintaxis y disponibilidad del enlace.",
        "Error en la secuencia de depuración de datos. El sistema no pudo establecer conexión con el origen.",
        "Advertencia: Enlace no procesable. Intente con una URL diferente.",
        "Excepción no manejada durante la adquisición del contenido. Revise la validez del identificador.",
        "La operación ha excedido el tiempo de espera. Reintente la solicitud en unos instantes."
    ],
    unknown: [
        "Plataforma no reconocida. Los parámetros de URL no coinciden con TikTok, Instagram o Facebook.",
        "El origen del enlace es ajeno a los protocolos de descarga definidos.",
        "Dominio desconocido detectado. El sistema solo admite enlaces de las tres plataformas principales.",
        "Se requiere una URL válida de una plataforma compatible para iniciar la descarga."
    ]
};

function getErrorResponse(type = 'general') {
    const responses = errorResponses[type];
    return responses[Math.floor(Math.random() * responses.length)];
}

async function tiktokdl(url) {
    let api = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
    let res = await fetch(api);
    if (!res.ok) throw new Error("Respuesta de API de TikTok no válida.");
    let json = await res.json();
    if (json.code !== 0) throw new Error(json.msg || "Error en la estructura de datos de TikTok.");
    return json.data;
}

async function igfb_dl(url) {
    const res = await igdl(url);
    if (!res || !res.data || res.data.length === 0) throw new Error("Contenido nulo o inexistente en el enlace.");
    return res.data;
}

var handler = async (m, { conn, args }) => {
    if (!args[0]) {
        return conn.reply(m.chat, `Introduzca un identificador (enlace) para iniciar el proceso de adquisición de datos.`, m);
    }

    const url = args[0];
    let platform = '';
    let result = null;

    try {
        await m.react('⏳');
        await conn.reply(m.chat, processingResponse, m);

        if (url.includes('tiktok.com')) {
            platform = 'TikTok';
            const data = await tiktokdl(url);
            
            const videoURL = data.play || data.hdplay; 
            const title = data.title || 'Información de título no disponible';
            const author = data.author.nickname || 'Autor no especificado';

            if (!videoURL) throw new Error("El sistema de TikTok no suministró una URL de video ejecutable.");

            result = {
                url: videoURL,
                filename: 'tiktok.mp4',
                platform: platform
            };

        } else if (url.includes('instagram.com')) {
            platform = 'Instagram';
            const data = await igfb_dl(url);

            for (let media of data) {
                const filename = media.type === 'video' ? 'instagram_video.mp4' : 'instagram_image.jpg';
                

                await conn.sendFile(m.chat, media.url, filename, info, m);
            }
            if (data.length > 0) return; 

        } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
            platform = 'Facebook';
            const data = await igfb_dl(url);
            
            const videoData = data.find(i => i.resolution === "720p (HD)") || data.find(i => i.resolution === "360p (SD)") || data[0];

            if (!videoData || !videoData.url) throw new Error("No se pudo resolver una URL de video ejecutable para Facebook.");
            
            result = {
                url: videoData.url,
                filename: 'facebook.mp4',
                platform: platform
            };

        } else {
            
            await m.react('❌');
            return conn.reply(m.chat, getErrorResponse('unknown'), m);
        }

        if (result) {
            await conn.sendFile(m.chat, result.url, result.filename, result.info, m);
        }
        await m.react('✅');

    } catch (error) {
        console.error(error);
        
        await m.react('❌');
        return conn.reply(m.chat, getErrorResponse('general'), m);
    }
};


handler.command = ['descargar', 'dl', 'descarga'];
handler.register = true;
handler.group = true;

export default handler;
