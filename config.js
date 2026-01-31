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
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830797656_735ec22d06753956aca8872c55c24368_EeBjc84my.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830799923_37f1e73bea2c8868c8a2a1b288f42b67_1mvfDyCSX.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830802722_292c3375a4da90ac46f35f20473f8380_pAoX558xA.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830804690_4d9ba51ddd6e842980652b102e7d475c_wBghgnkW_.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830806286_fada3f5d2889e45ff1603d8d35a642f8_e-SrNf--9.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830808312_dc49bcc31c780f9422498c85223873f8_5Jl0pVj_4.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830810079_4cc191552b896c75528b8681260205c7_uw-cJSget.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830812264_7d27accf78b342d58ada53234325f5f2_eJSjXUkD2m.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830813778_f9f9761120a4e530c31fd4796d4f0727_6cqQHO9J8.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830814815_9141004d1a37876ec86a9e9fe327731d_889W9P3Is.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830816477_5e64ac4ab72f92b2bfb85cac6eb6cd2e_hwe-X54vk.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830818259_9d44b99d4d0952f51bf52fdb2c05986e_Xps4LJO8r.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830821110_c20a3c37f4bd68fef7d7fb44d65303db_wVW7oX9KD.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830823123_e336030d2dfd15b3f2a9bec8d30e15f3_YZEsD9KKM.jpg',
'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1769830825552_79bf9a7935e94394d716bf6dd5b20f47_OQ4Crquzs.jpg'
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

