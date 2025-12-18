import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 
import path from 'path'

global.owner = [
  [ '50432955554', 'Eliac', true ]
]; 

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment 
global.sessions = 'sessions'
global.jadi = 'sessions_sub_assistant';


let Names = [
    'ᴊɪᴊɪ - ᴀssɪsᴛᴀɴᴛ', 
    '𝕵𝖎𝖏𝖎 - 𝕬𝖘𝖘𝖎𝖘𝖙𝖆𝖓𝖙', 
    '🄹🄸🄹🄸 - 🄰🅂🅂🄸🅂🅃🄰🄽🅃', 
    '𝒥𝒾𝒿𝒾 - 𝒜𝓈𝓈𝒾𝓈𝓉𝒶𝓃𝓉', 
    '🅹🅸🅹🅸 - 🄰🅂🅂🄸🅂🅃🄰🅽🆃', 
    '𝐉𝐢𝐣𝐢 - 𝐀𝐬𝐬𝐢𝐬𝐭𝐚𝐧𝐭', 
    'Ⓙⓘⓙⓘ - Ⓐⓢⓢⓘⓢⓣⓐⓝⓣ', 
    '𝙹𝙸𝹹𝙸 - 𝙰𝚂𝚂𝙸𝚂𝚃𝙰𝙽𝚃', 
    '¡ſıſı - ʇuɐʇsıssɐ', 
    'J I J I - A S S I S T A N T',
];

let randomIndex = Math.floor(Math.random() * Names.length);
global.bot = Names[randomIndex];

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'db/group_configs.json')

global.getGroupAssistantConfig = (chatId) => {
    let configs = {}
    try {
        if (fs.existsSync(DB_PATH)) {
            configs = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
        }
    } catch (e) {
        console.error("Error al leer group_configs.json:", e)
    }

    const groupConfig = configs[chatId]

    return {
        assistantName: groupConfig?.assistantName || global.bot,
        assistantImage: groupConfig?.assistantImage || "https://i.ibb.co/pjx0z1G6/b5897d1aa164ea5053165d4a04c2f2fa.jpg",
        assistantCommand: groupConfig?.assistantCommand || 'jiji' 
    }
}

const groupConfig = global.getGroupAssistantConfig(chatId);

global.m_code = (chatId) => {
    
    return {
        contextInfo: {
            externalAdReply: {
                title: `Código de emparejamiento de ${groupConfig.assistantCommand} - asistente`,
                body: `Asistente: ${groupConfig.assistantName}`,
                mediaType: 1,
                previewType: 'PHOTO',
                renderLargerThumbnail: true, 
                thumbnailUrl: groupConfig.assistantImage,
                sourceUrl: 'https://www.deylin.xyz' 
            }
        }
    };
};




let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
