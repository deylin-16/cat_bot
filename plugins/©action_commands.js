import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import fetch from 'node-fetch'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let handler = async (m, { conn, usedPrefix, command }) => {
    let { assistantName, assistantImage } = global.getAssistantConfig(conn.user.jid)
    let ownerBot = global.owner.map(([jid, name]) => ({ jid, name }))
    let _package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}')) || {}

    let groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(_ => ({})) : {}
    let groupName = groupMetadata.subject || 'Chat Privado'
    let totalMembers = groupMetadata.participants ? groupMetadata.participants.length : 0

    let isMenuGrupo = /menu4|menugrupo/i.test(command)
    let thumb = assistantImage

    if (isMenuGrupo && m.isGroup) {
        try {
            const profileUrl = await conn.profilePictureUrl(m.chat, 'image').catch(_ => null)
            if (profileUrl) {
                const res = await fetch(profileUrl)
                if (res.ok) thumb = await res.buffer()
            }
        } catch {
            thumb = assistantImage
        }
    }

    if (typeof thumb === 'string' && thumb.startsWith('http')) {
        try {
            const res = await fetch(thumb)
            if (res.ok) thumb = await res.buffer()
        } catch {
            thumb = assistantImage 
        }
    }

    let adReply = {
        contextInfo: {
            externalAdReply: {
                title: assistantName,
                body: 'Deylin Team',
                mediaType: 1,
                previewType: 0,
                thumbnail: thumb,
                renderLargerThumbnail: true,
                sourceUrl: 'https://deylin.xyz'
            }
        }
    }

    if (/menu2|interaccion/i.test(command)) {
        let animeCommands = `
┏━⊜ *INTERACCIONES* ⊜━┓
┃ ◌ Kiss, Kiss2, Kiss3
┃ ◌ Beso, Beso2, Beso3
┃ ◌ Hug, Hug2, Abrazo
┃ ◌ Slap, Golpe, Cachetada
┃ ◌ Kill, Matar, Disparar
┃ ◌ Pat, Acariciar, Mimar
┃ ◌ Dance, Bailar, Twerk
┃ ◌ Kick2, Patada, Boxeo
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
┃ ◌ Steal, Photo, Record, Skate
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
❒ *Subbot:* deylin.xyz/pairing_code

${animeCommands}`.trim()

        return await conn.sendMessage(m.chat, { text: caption, ...adReply, mentions: [m.sender] }, { quoted: m })
    }

    if (isMenuGrupo) {
        let groupCommands = `
┏━⊜  *GRUPO* ⊜━┓
┃ 
┃ °• cerrar/abrir/open/close
┃ °• detect (Autodetect)
┃ °• setwelcome (Bienvenida)
┃ °• welcome (on/off)
┃ °• antilink (on/off)
┃ °• setpp (Imagen)
┃ °• renombrar (Nombre)
┃ °• setdesc (Descripción)
┃ °• kick (Eliminar)
┃ °• tagall/todos
┃ °• recordatorio
┗━━━━━━━━━━━━━━━┛`;

        let caption = `
⚙️ *MENÚ DE CONFIGURACIÓN* 🍪

❒ *Bot:* ${assistantName}
❒ *Grupo:* ${groupName}
❒ *Miembros:* ${totalMembers}
❒ *Versión:* ${_package.version}

${groupCommands}`.trim()

        return await conn.sendMessage(m.chat, { text: caption, ...adReply, mentions: [m.sender] }, { quoted: m })
    }

    if (/menu3|game|juegos/i.test(command)) {
        let gameCommands = `
┏━⊜ *JUEGOS* ⊜━┓
┃ °• adivinanza / prueba 
┃ °• trivia / wordhard
┃
┣━━►VERDAD-RETO◄━━━▷
┃ °• join / start / stop / leave
┗━━━━━━━━━━━━━━━┛`;

        let caption = `
🎮 *MENÚ DE JUEGOS* 🍪

❒ *Bot:* ${assistantName}
❒ *Versión:* ${_package.version}

${gameCommands}`.trim()

        return await conn.sendMessage(m.chat, { text: caption, ...adReply, mentions: [m.sender] }, { quoted: m })
    }

    let customCommands = `
╭━━〔 📂 *CATÁLOGO* 〕━━╮
┃ 
┃ 💠 \`Principal\` ➜ .menu
┃ ⛩️ \`Animes\` ➜ .menu2
┃ 🎮 \`Juegos\` ➜ .menu3
┃ ⚙️ \`Gestión\` ➜ .menu4
┃
╰━━━━━━━━━━━━━━━╯

╭━━〔 🛠️ *HERRAMIENTAS* 〕━━╮
┃
┃ 📥 *DESCARGAS*
┃ ├ ◦ fb, ig, tiktok
┃
┃ 🔍 *BÚSQUEDA*
┃ ├ ◦ pin, ytsearch, anime
┃ └ ◦ play (Música)
┃
┃ 🎨 *FUNCIONES*
┃ ├ ◦ s (Sticker), gay
┃ └ ◦ hd (Enhancer)
┃
╰━━━━━━━━━━━━━━━╯`.trim();

    let caption = `
👋 *HOLA, SOY ${assistantName.toUpperCase()}*

❒ *Creador:* ${ownerBot[0]?.name || 'Deylin'}
❒ *Versión:* ${_package.version}
❒ *Activo:* ${msToDate(process.uptime() * 1000)}

${customCommands}`.trim()

    await conn.sendMessage(m.chat, { text: caption, ...adReply, mentions: [m.sender] }, { quoted: m })
}

handler.command = ['menu', 'comandos', 'funcioned', 'ayuda', 'menu2', 'menu3', 'game', 'juegos', 'menu4', 'menugrupo']

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
