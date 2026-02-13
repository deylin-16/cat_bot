import { dirname } from "path";
import { fileURLToPath } from "url";
import * as crypto from "crypto";
import webp from "node-webpmux";
import fetch from "node-fetch";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function addExif(webpSticker, packname, author, categories = ["🤩"]) {
    const img = new webp.Image();
    const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString("hex"),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        emojis: categories,
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpSticker);
    img.exif = exif;
    return await img.save(null);
}

async function processAnimatedEmoji(buffer) {
    return await sharp(buffer, { animated: true })
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({
            effort: 0, 
            quality: 40,
            lossless: false,
            loop: 0, // Asegura que la animación se repita siempre
            force: true
        })
        .toBuffer();
}

const emojiCommand = {
    name: 'emoji',
    alias: ['emo'],
    category: 'tools',
    run: async (m, { conn, args, text }) => {
        try {
            let input = args[0];
            if (!input) return m.reply('> *✎ Proporciona un emoji o código hex.*');
            
            await m.react('🕓');

            // Convertimos a código hexadecimal si es un emoji directo
            let code = input.includes('1f') ? input : [...input].map(e => e.codePointAt(0).toString(16)).join('-');
            
            // Usamos la URL del GIF que confirmaste que funciona
            const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.gif`;
            
            const response = await fetch(url);
            if (!response.ok) return m.reply('> ⚔ Este emoji no tiene versión animada en Google.');

            const buffer = await response.buffer();
            
            // Procesamos el GIF para convertirlo a WebP Animado compatible con WhatsApp
            const processedBuffer = await processAnimatedEmoji(buffer);

            let [pack, auth] = text.includes('|') ? text.split('|').map(v => v.trim()) : ["Google Emojis", "DeylinBot"];
            const finalSticker = await addExif(processedBuffer, pack, auth);

            await conn.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply(`> ⚔ Error en el procesamiento: ${e.message}`);
        }
    }
}

export default emojiCommand;
