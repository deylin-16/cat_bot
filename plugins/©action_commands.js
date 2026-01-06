import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn, usedPrefix, command }) => {
    let { assistantName, assistantImage } = global.getAssistantConfig(conn.user.jid)
    let ownerBot = global.owner.map(([jid, name]) => ({ jid, name }))
    let _package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}')) || {}

    if (/menu2|anime|interaccion/i.test(command)) {
        let animeCommands = `
┏━⊜ *INTERACCIONES* ⊜━┓
┃ ◌ Kiss, Kiss2, Kiss3
┃ ◌ Beso, Beso2, Beso3
┃ ◌ Hug, Hug2, Abrazo
┃ ◌ Slap, Golpe, Cachetada
┃ ◌ Kill, Matar, Disparar
┃ ◌ Pat, Acariciar, Mimar
┃ ◌ Dance, Bailar, Twerk
┃ ◌ Kick, Patada, Boxeo
┃ ◌ Laugh, Reir, Llorar_risa
┃ ◌ Sad, Triste, Cry, Sneeze
┃ ◌ Angry, Enojado, Gritar
┃ ◌ Wave, Saludo, Desprecio
┃ ◌ Bite, Morder, Lamer
┃ ◌ Sleep, Dormir, Despertar
┃ ◌ Eat, Comer, Burger, Pizza
┃ ◌ Ramen, Tacos, Icecream
┃ ◌ Drink, Beber, Coffee, Tea
┃ ◌ Soda, Juice, Water, Beer
┃ ◌ Scare, Asustar, Fear, Beg
┃ ◌ Run, Correr, Viajar, Stare
┃ ◌ Wow, Asombro, Smug, Blush
┃ ◌ Think, Pensar, Confundido
┃ ◌ Smoke, Fumar, Vape, Candy
┃ ◌ Play, Jugar, Pc, Tv, Music
┃ ◌ Hide, Esconderse, Stalk
┃ ◌ Suicide, Suicidio, Lie
┃ ◌ Ignore, Ignorar, Bored
┃ ◌ Clap, Aplaudir, Excited
┃ ◌ Vomit, Vomitar, Sick, Curar
┃ ◌ Cook, Cocinar, Clean, Shop
┃ ◌ Marry, Casar, Divorce
┃ ◌ Study, Estudiar, Write, Read
┃ ◌ Work, Trabajar, Money
┃ ◌ Workout, Ejercicio, Gym
┃ ◌ Shower, Bañarse, Dress
┃ ◌ Fly, Volar, Teleport
┃ ◌ Explode, Burn, Freeze
┃ ◌ Lightning, Summon, Morph
┃ ◌ Heal, Sanar, Protect, Fall
┃ ◌ Fish, Garden, Yoga, Gamble
┃ ┃ Steal, Photo, Record, Skate
┃ ◌ Surf, Ski, Camp, Guitar
┃ ◌ Piano, Sing, Draw, Bike
┃ ◌ Soccer, Basketball, Swim
┃ ◌ Spank, Beso_mano
┃ ◌ Beso_frente, Pillowfight
┗━━━━━━━━━━━━━━━┛`;

        let caption = `
⛩️ *ANIME INTERACTION* ⛩️

❒ *Bot:* ${assistantName}
❒ *Versión:* ${_package.version}
❒ *Hazte subbot desde: deylin.xyz/pairing_code*
❒ *Sugerencias y errores en: deylin.xyz/feedback*


${animeCommands}

> *Nota:* Comandos directos sin prefijo.`.trim()

        try {
            let sendImage = typeof assistantImage === 'string' ? { url: assistantImage } : assistantImage
            await conn.sendMessage(m.chat, { image: sendImage, caption, mentions: [m.sender] }, { quoted: m })
        } catch (e) {
            await conn.reply(m.chat, caption, m)
        }
        return
    }

    
    let customCommands = `
┏━━━━━━━━━━━━━━━━━━┓
┃   *GRUPOS*
┃ ◦ cierra / abre
┃ ◦ renombrar / setdesc
┃ ◦ setpp (Cambiar foto)
┃
┃   *UTILIDADES*
┃ ◦ kick / elimina
┃ ◦ ntodos / tagall
┃
┃   *EXTRACCIÓN / DOWNLOAD*
┃ ◦ descarga (FB, TikTok, IG)
┃
┃   *BÚSQUEDA*
┃ ◦ pin (Pinterest)
┃ ◦ ttss (TikTok Search)
┃ ◦ play / 🎧 (YouTube)
┃
┃   *FUNCIONES*
┃ ◦ robar perfil
┃ ◦ tomar perfil
┃ ◦ s / sticker
┃ ◦ toimg (Sticker a imagen)
┃
┃   *IA & SISTEMA*
┃ ◦ ia (ChatGPT)
┃ ◦ hd (Mejorar calidad)
┃ ◦ res (Auto-IA)
┃
┃   *ESPÍA*
┃ ◦ read / ver / :) (ViewOnce)
┗━━━━━━━━━━━━━━━━━━┛`;

    let caption = `
👋 *HOLA, SOY ${assistantName.toUpperCase()}*

❒ *Creador:* ${ownerBot[0].name}
❒ *Versión:* ${_package.version}
❒ *Activo:* ${msToDate(process.uptime() * 1000)}
❒ *Hazte subbot desde: deylin.xyz/pairing_code*
❒ *Sugerencias y errores en: deylin.xyz/feedback*

${customCommands}

> Usa *.menu2* para ver los comandos de Anime.`.trim()

    try {
        let sendImage = typeof assistantImage === 'string' ? { url: assistantImage } : assistantImage
        await conn.sendMessage(m.chat, { image: sendImage, caption: caption }, { quoted: m })
    } catch (e) {
        await conn.reply(m.chat, caption, m)
    }
}

handler.command = ['menu', 'comandos', 'funcioned', 'ayuda', 'menu2', 'anime']

export default handler

function msToDate(ms) {
    let d = isNaN(ms) ? 0 : ms
    let s = d / 1000
    let m = s / 60
    let h = m / 60
    let dd = Math.floor(h / 24)
    let hh = Math.floor(h % 24)
    let mm = Math.floor(m % 60)
    let ss = Math.floor(s % 60)
    return `${dd}d ${hh}h ${mm}m ${ss}s`
}
