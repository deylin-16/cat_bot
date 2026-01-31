import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import path from 'path'

global.owner = [['50432955554', 'Eliac', true]]

global.botNames = [
  'ɢᴀᴛᴏ ʙᴏᴛ',
  '𝚌𝚊𝚝 𝚋𝚘𝚝',
  'gαтσ вσт',
  'ꉔꋬ꓄ ꃳꄲ꓄'
]

global.botImages = [
  'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769752227174_vN72W6kT-.jpeg',
  'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769752227174_vN72W6kT-.jpeg',
  'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769752227174_vN72W6kT-.jpeg'
]

const conf = {
  utils: {
    cheerio,
    fs,
    fetch,
    axios,
    moment
  },
  api: {
    url: 'https://api.deylin.xyz',
    key: 'dk_ofical_user'
  },
  sessions: {
    main: 'sessions',
    sub: 'sessions_sub_assistant',
    pairing: 'https://deylin.xyz/pairing_code'
  },
  social: {
    channel: '120363406846602793@newsletter'
  }
}
var more = String.fromCharCode(8206)
Object.assign(global, conf.utils)
global.url_api = conf.api.url
global.key = conf.api.key
global.sessions = conf.sessions.main
global.jadi = conf.sessions.sub
global.url = conf.sessions.pairing
global.ch = { ch1: conf.social.channel }
global.rmr = more.repeat(850)
global.name = () => global.botNames[Math.floor(Math.random() * global.botNames.length)]
global.img = () => global.botImages[Math.floor(Math.random() * global.botImages.length)]

global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: "get",
      url,
      headers: {
        'DNT': 1,
        'User-Agent': 'GoogleBot'
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (e) {
    return null
  }
}

const d = new Date(new Date().getTime() + 3600000)
global.fecha = d.toLocaleDateString('es', { day: 'numeric', month: 'numeric', year: 'numeric' })
global.tiempo = d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })

const hour = new Date().getHours()
global.saludo = hour < 12 ? 'Lɪɴᴅᴀ Mᴀɴ̃ᴀɴᴀ 🌅' : hour < 18 ? 'Lɪɴᴅᴀ T Tᴀʀᴅᴇ 🌆' : 'Lɪɴᴅᴀ Nᴏᴄʜᴇ 🌃'

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})

