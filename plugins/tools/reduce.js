import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Accedemos directamente a la propiedad jimp del paquete
const { Jimp } = require('jimp'); 

const reduceCommand = {
    name: 'reduce',
    alias: ['reducir', 'resize'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!m.quoted || !/image|sticker/.test(m.quoted.mtype)) {
            return conn.sendMessage(m.chat, { text: '> ╰❏ *Responde a una imagen o sticker para redimensionar.*' }, { quoted: m });
        }

        if (!text) {
            return conn.sendMessage(m.chat, { text: '> ╰❐ *Indique las dimensiones.*\n*Uso: .reduce 300x300*' }, { quoted: m });
        }

        let input = text.trim().split(/[x×]/i);
        if (input.length !== 2 || isNaN(input[0]) || isNaN(input[1])) {
            return conn.sendMessage(m.chat, { text: '> ⚠ *Formato incorrecto.*\n*Uso: .reduce 300x300*' }, { quoted: m });
        }

        let width = parseInt(input[0]);
        let height = parseInt(input[1]);

        if (width > 2000 || height > 2000) {
            return conn.sendMessage(m.chat, { text: '> ✧ *Las dimensiones exceden el límite de 2000px.*' }, { quoted: m });
        }

        try {
            let media = await m.quoted.download?.();
            if (!media) return;

            
            const image = await Jimp.read(media);
            image.resize({ w: width, h: height }); // Nota el cambio en resize
            
            
            const buffer = await image.getBuffer('image/jpeg');

            await conn.sendFile(m.chat, buffer, 'reducida.jpg', `> ⌬ *Imagen procesada a ${width}x${height}*`, m);
        } catch (e) {
            console.error(e);
            
            return conn.sendMessage(m.chat, { text: `> ⚠️ *ERROR:* ${e.message || e}` }, { quoted: m });
        }
    }
};

export default reduceCommand;
