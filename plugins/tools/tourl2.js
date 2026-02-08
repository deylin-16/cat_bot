import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

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

const uploadRest = async (buffer) => {
    try {
        const { mime } = await fileTypeFromBuffer(buffer) || { mime: 'application/octet-stream' };
        const form = new FormData();
        const blob = new Blob([buffer], { type: mime });
        form.append('file', blob);
        const res = await fetch('https://storage.restfulapi.my.id/upload', { method: 'POST', body: form });
        const json = await res.json();
        if (json.success && json.files) return json.files[0].url;
        return null;
    } catch {
        return null;
    }
};

const tourlCommand = {
    name: 'tourl2',
    alias: ['upload2', 'subir2'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';

            if (!mime) return m.reply('> ✎ Responde a un archivo.');

            await m.react('🕓');

            let buffer = await q.download();
            if (!buffer) return m.reply('> ⚔ Error al obtener buffer.');

            const [linkQuax, linkRest] = await Promise.all([
                uploadQuax(buffer),
                uploadRest(buffer)
            ]);

            let size = (buffer.length / 1024 / 1024).toFixed(2);
            
            let txt = `> ☁️ *ARCHIVO SUBIDO*\n\n`;
            txt += `> ⚖ *Peso:* ${size} MB\n`;
            txt += `> ✧ *Mime:* ${mime}\n\n`;
            txt += `> ❐ *Quax:* ${linkQuax || 'Fallo'}\n`;
            txt += `> ❏ *Restful:* ${linkRest || 'Fallo'}\n\n`;;

            await m.reply(txt);
            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            m.reply('> ⚔ Error crítico.');
        }
    }
};

export default tourlCommand;
