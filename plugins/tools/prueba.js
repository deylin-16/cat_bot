import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

// Función de subida que ya comprobaste que funciona
const uploadQuax = async (buffer) => {
    try {
        const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: 'bin', mime: 'application/octet-stream' };
        const form = new FormData();
        const blob = new Blob([buffer], { type: mime });
        form.append('files[]', blob, 'tmp.' + ext);
        const res = await fetch('https://qu.ax/upload.php', { method: 'POST', body: form });
        const result = await res.json();
        if (result && result.success) return result.files[0].url;
        return null;
    } catch {
        return null;
    }
};

const qrCommand = {
    name: 'qr',
    alias: ['codigoqr', 'qricon'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        // Tu logo de Catbot
        const logoUrl = 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770845615398_catbot_icon_1770845600768_Zj7f5rIDX.png';
        
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';
            let qrData = text;

            // Si es imagen, subimos a Quax
            if (/image/.test(mime)) {
                await m.react('🕓');
                let buffer = await q.download();
                if (!buffer) return m.reply('> ⚔ Error al procesar imagen.');
                
                qrData = await uploadQuax(buffer);
                if (!qrData) return m.reply('> ⚔ Error al subir a Quax.');
            }

            if (!qrData) return m.reply('> ✎ Responde a una imagen o escribe un texto.');

            // Generamos el QR con el logo usando QuickChart
            const qrFinalUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=600&centerImageUrl=${encodeURIComponent(logoUrl)}&centerImageSize=0.2&margin=2`;

            await conn.sendMessage(m.chat, { 
                image: { url: qrFinalUrl }, 
                caption: `> ✅ *QR GENERADO*\n> 👤 *By:* Deylin Tech\n> 🔗 *Link:* ${qrData}` 
            }, { quoted: m });
            
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply('> ⚔ Error al generar el QR.');
        }
    }
};

export default qrCommand;
