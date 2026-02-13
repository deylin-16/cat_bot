import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import fluent_ffmpeg from "fluent-ffmpeg";
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

function convertToWebp(buffer, isAnimated) {
    return new Promise(async (resolve, reject) => {
        try {
            const tmpDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
            
            const inputPath = path.join(tmpDir, `${Date.now()}.${isAnimated ? 'gif' : 'webp'}`);
            const outputPath = path.join(inputPath + ".webp");
            
            await fs.promises.writeFile(inputPath, buffer);

            let ffmpegCmd = fluent_ffmpeg(inputPath);
            
            if (isAnimated) {
                ffmpegCmd.inputFormat('gif');
            }

            ffmpegCmd
                .on("error", (err) => {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    reject(err);
                })
                .on("end", async () => {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    const result = await fs.promises.readFile(outputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(result);
                })
                .addOutputOptions([
                    "-vcodec", "libwebp",
                    "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0",
                    "-lossless", "0",
                    "-compression_level", "6",
                    "-q:v", "50",
                    "-loop", "0",
                    "-preset", "picture",
                    "-an",
                    "-vsync", "0"
                ])
                .toFormat("webp")
                .save(outputPath);
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
            let emojiRaw = isAnimated ? args[1] : args[0];
            
            if (!emojiRaw) return m.reply('> *✎ Debes proporcionar un emoji.*');

            await m.react('🕓');

            const codePoints = [...emojiRaw].map(e => e.codePointAt(0).toString(16)).join('-');
            const url = isAnimated 
                ? `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoints}/lottie.gif`
                : `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoints}/512.webp`;

            const response = await fetch(url);
            if (!response.ok) return m.reply('> ⚔ No disponible en Google (intenta con otro emoji).');

            const buffer = await response.buffer();
            const webpBuffer = await convertToWebp(buffer, isAnimated);
            
            let [pack, auth] = text.includes('|') ? text.split('|').map(v => v.trim()) : ["Pack", "Google"];
            const finalSticker = await addExif(webpBuffer, pack, auth);

            await conn.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
            await m.react('✅');

        } catch (e) {
            console.error(e);
            await m.react('✖️');
            m.reply(`> ⚔ Error técnico: ${e.message}`);
        }
    }
}

export default emojiCommand;
