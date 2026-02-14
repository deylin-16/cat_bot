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

async function processEmoji(buffer) {
    return await sharp(buffer, { animated: true })
        .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({
            loop: 0,
            quality: 50,
            lossless: false
        })
        .toBuffer();
}

const emojiCommand = {
    name: 'emojimix',
    alias: ['mix', 'emomix'],
    category: 'tools',
    run: async (m, { conn, text, usedPrefix, command }) => {
        try {
            const emojis = text.match(/[\u{1f300}-\u{1f9ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu);

            if (!emojis || emojis.length < 2) {
                return m.reply(`> *✎ Ingresa 2 emojis.*\n> *Ejemplo:* ${usedPrefix + command} 😂😬`);
            }

            await m.react('🪄');

            const u1 = emojis[0].codePointAt(0).toString(16);
            const u2 = emojis[1].codePointAt(0).toString(16);
            
            const url = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${u1}/u${u1}_u${u2}.png`;
            
            const response = await fetch(url);
            if (!response.ok) {
                const url2 = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${u2}/u${u2}_u${u1}.png`;
                const res2 = await fetch(url2);
                if (!res2.ok) return m.reply('> ⚔️ Combinación no disponible.');
                var buffer = await res2.buffer();
            } else {
                var buffer = await response.buffer();
            }

            const stickerBuffer = await processEmoji(buffer);
            const finalSticker = await addExif(stickerBuffer, "Emoji Mix", "Deylin");

            await conn.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply(`> ⚔ Error: ${e.message}`);
        }
    }
}

export default emojiCommand;
