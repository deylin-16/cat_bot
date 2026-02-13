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

function processWebp(img) {
    return new Promise(async (resolve, reject) => {
        try {
            const type = (await fileTypeFromBuffer(img)) || { mime: "image/png", ext: "png" };
            const tmpDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const tmp = path.join(tmpDir, `${Date.now()}.${type.ext}`);
            const out = path.join(tmp + ".webp");

            await fs.promises.writeFile(tmp, img);

            fluent_ffmpeg(tmp)
                .on("error", (err) => {
                    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                    reject(err);
                })
                .on("end", async () => {
                    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
                    if (fs.existsSync(out)) {
                        const result = await fs.promises.readFile(out);
                        fs.unlinkSync(out);
                        resolve(result);
                    }
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
    alias: ['emo', 'emojigif'],
    category: 'tools',
    run: async (m, { conn, args, text }) => {
        try {
            if (!text) return m.reply('> *✎ Ingresa el código o emoji.*');
            
            await m.react('🕓');
            
            const isAnimated = m.args[0] === 'gif';
            const emojiCode = isAnimated ? args[1] : args[0];
            
            if (!emojiCode) return m.reply('> *✎ Especifica un emoji.*');

            const hexCode = emojiCode.codePointAt(0).toString(16).toLowerCase();
            const baseUrl = "https://fonts.gstatic.com/s/e/notoemoji/latest";
            const fileType = isAnimated ? "gif" : "webp";
            const url = `${baseUrl}/${hexCode}/512.${fileType}`;

            const response = await fetch(url);
            if (!response.ok) return m.reply('> ⚔ Emoji no encontrado en la base de datos de Google.');

            const buffer = await response.buffer();
            const processedBuffer = await processWebp(buffer);
            
            let [pack, auth] = text.includes('|') ? text.split('|').map(v => v.trim()) : ["Emoji Pack", "Google"];
            const exifSticker = await addExif(processedBuffer, pack, auth);

            await conn.sendMessage(m.chat, { sticker: exifSticker }, { quoted: m });
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply('> ⚔ Error al procesar el emoji.');
        }
    }
}

export default emojiCommand;
