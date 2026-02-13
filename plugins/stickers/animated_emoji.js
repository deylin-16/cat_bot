import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import fluent_ffmpeg from "fluent-ffmpeg";
import { fileTypeFromBuffer } from "file-type";
import webp from "node-webpmux";
import fetch from "node-fetch";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function addExif(webpSticker, packname, author, categories = ["🤩"], extra = {}) {
    const img = new webp.Image();
    const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString("hex"),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        emojis: categories,
        ...extra,
    };
    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpSticker);
    img.exif = exif;
    return await img.save(null);
}

function processEmoji(img, isAnimated) {
    return new Promise(async (resolve, reject) => {
        try {
            const tmpDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
            const tmp = path.join(tmpDir, `${Date.now()}.${isAnimated ? 'gif' : 'webp'}`);
            const out = path.join(tmp + ".webp");
            await fs.promises.writeFile(tmp, img);

            let command = fluent_ffmpeg(tmp);
            
            if (isAnimated) {
                command.inputOptions(['-t', '7', '-ignore_loop', '0']);
            }

            command
                .on("error", (err) => {
                    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                    reject(err);
                })
                .on("end", async () => {
                    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                    const result = await fs.promises.readFile(out);
                    if (fs.existsSync(out)) fs.unlinkSync(out);
                    resolve(result);
                })
                .addOutputOptions([
                    "-vcodec", "libwebp",
                    "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0",
                    "-lossless", "1",
                    "-loop", "0",
                    "-preset", "default",
                    "-an",
                    "-vsync", "0"
                ])
                .toFormat("webp")
                .save(out);
        } catch (e) {
            reject(e);
        }
    });
}

const emojiCommand = {
    name: 'emoji',
    alias: ['emo'],
    category: 'tools',
    run: async (m, { conn, args, text }) => {
        try {
            if (!text) return m.reply('> *✎ Uso: .emoji <emoji> o .emoji gif <emoji>*');
            
            let isAnimated = args[0] === 'gif';
            let emoji = isAnimated ? args[1] : args[0];
            if (!emoji) return m.reply('> *✎ Falta el emoji.*');

            await m.react('🕓');

            const hexCode = [...emoji].map(e => e.codePointAt(0).toString(16)).join('-');
            const fileType = isAnimated ? "lottie.gif" : "512.webp";
            const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${hexCode}/${fileType}`;

            const res = await fetch(url);
            if (!res.ok) return m.reply('> ⚔ No se encontró la versión animada/estática de ese emoji.');

            const buffer = await res.buffer();
            const sticker = await processEmoji(buffer, isAnimated);
            
            let [pack, auth] = text.includes('|') ? text.split('|').map(v => v.trim()) : ["Google Emojis", "Bot"];
            const finalSticker = await addExif(sticker, pack, auth);

            await conn.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
            await m.react('✅');
        } catch (e) {
            console.error(e);
            m.reply('> ⚔ Error: Verifica que sea un emoji válido.');
        }
    }
}

export default emojiCommand;
