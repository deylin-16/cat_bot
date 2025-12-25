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
global.url_api = 'https://api.deylin.xyz'



                
global.design = async (conn, m, text = '') => {
    const config = global.getAssistantConfig(conn.user.jid)
    
    const mainBotJid = global.conn?.user?.jid.split('@')[0] 
    
    const currentBotJid = conn.user.jid.split('@')[0]

    
    if (currentBotJid === mainBotJid) {
        return await conn.sendMessage(m.chat, { text: text }, { quoted: m })
    }

    
    let canalLink = 'https://www.deylin.xyz/1' 
    let iconoUrl = 'https://i.ibb.co/g8PsK57/IMG-20251224-WA0617.jpg'
    let buffer = await global.getBuffer(iconoUrl)

    return await conn.sendMessage(m.chat, {
        text: text || canalLink,
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363160031023229@newsletter',
                newsletterName: 'Comunidad Oficial',
                serverMessageId: 1
            },
            externalAdReply: {
                title: config.assistantName,
                body: '🚀 Toca para ver canal',
                thumbnail: buffer,
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: true,
                sourceUrl: canalLink,
                mediaUrl: canalLink
            }
        }
    }, { quoted: m })
}
 




global.getBuffer = async (url, options = {}) => {
    try {
        var res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'User-Agent': 'GoogleBot',
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (e) {
        console.log(`Error : ${e}`)
    }
}

global.d = new Date(new Date().getTime() + 3600000)
global.locale = 'es'
global.dia = d.toLocaleDateString(locale, {weekday: 'long'})
global.fecha = d.toLocaleDateString('es', {day: 'numeric', month: 'numeric', year: 'numeric'})
global.mes = d.toLocaleDateString('es', {month: 'long'})
global.año = d.toLocaleDateString('es', {year: 'numeric'})
global.tiempo = d.toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true})

let ase = new Date(); 
let hour = ase.getHours(); 
let saludo;
if (hour >= 0 && hour < 3) saludo = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'
else if (hour >= 3 && hour < 7) saludo = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌄'
else if (hour >= 7 && hour < 10) saludo = 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌅'
else if (hour >= 10 && hour < 14) saludo = 'Lɪɴᴅᴏ Dɪᴀ 🌤'
else if (hour >= 14 && hour < 18) saludo = 'Lɪɴᴅᴀ Tᴀʀᴅᴇ 🌆'
else saludo = 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'
global.saludo = saludo;

let Names = [
    'ᴊɪᴊɪ - ᴀssɪsᴛᴀɴᴛ', '𝕵𝖎𝖏𝖎 - 𝕬𝖘𝖘𝖎𝖘𝖙𝖆𝖓𝖙', '🄹🄸🄹🄸 - 🄰🅂🅂🄸🅂🅃🄰🄽🅃', '𝒥𝒾𝒿𝒾 - 𝒜𝓈𝓈𝒾𝓈𝓉🇦𝓃𝓉'
];
global.bot = Names[Math.floor(Math.random() * Names.length)];

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'db/assistant_sessions.json')

global.getAssistantConfig = (botJid) => {
    let configs = {}
    try {
        if (fs.existsSync(DB_PATH)) {
            configs = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
        }
    } catch (e) { console.error(e) }

    const sessionConfig = configs[botJid]
    global.name = sessionConfig?.assistantName || global.bot || "Asistente"
    global.img = sessionConfig?.assistantImage 
        ? Buffer.from(sessionConfig.assistantImage, 'base64') 
        : "https://i.ibb.co/pjx0z1G6/b5897d1aa164ea5053165d4a04c2f2fa.jpg"

    return { assistantName: global.name, assistantImage: global.img }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
