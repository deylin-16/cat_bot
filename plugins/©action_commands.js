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
┏━━⬣   *INTERACCIONES*  ⬣━━┓
┃ ◌ Kiss / Kiss2 / Kiss3
┃ ◌ Beso / Beso2 / Beso3
┃ ◌ Hug / Hug2 / Abrazo / Abrazo2
┃ ◌ Slap / Golpe / Cachetada
┃ ◌ Kill / Matar / Disparar / Shoot
┃ ◌ Pat / Acariciar / Mimar / Cuddle
┃ ◌ Dance / Bailar / Twerk
┃ ◌ Kick / Patada / Boxeo
┃ ◌ Laugh / Reir / Llorar_risa
┃ ◌ Sad / Triste / Cry / Sneeze
┃ ◌ Angry / Enojado / Gritar
┃ ◌ Wave / Saludo / Desprecio
┃ ◌ Bite / Morder / Lamer / Lick
┃ ◌ Sleep / Dormir / Despertar
┃ ◌ Eat / Comer / Burger / Pizza
┃ ◌ Ramen / Tacos / Icecream
┃ ◌ Drink / Beber / Coffee / Tea
┃ ◌ Soda / Juice / Water / Beer
┃ ◌ Scare / Asustar / Fear / Beg
┃ ◌ Run / Correr / Viajar / Travel
┃ ◌ Stare / Mirar / Mirror / Stars
┃ ◌ Wow / Asombro / Smug
┃ ◌ Blush / Tímido / Avergonzado
┃ ◌ Think / Pensar / Confundido
┃ ◌ Smoke / Fumar / Vape / Candy
┃ ◌ Play / Jugar / Pc / Tv / Music
┃ ◌ Hide / Esconderse / Stalk
┃ ◌ Suicide / Suicidio / Lie
┃ ◌ Ignore / Ignorar / Bored
┃ ◌ Clap / Aplaudir / Excited
┃ ◌ Vomit / Vomitar / Sick / Curar
┃ ◌ Cook / Cocinar / Clean / Shop
┃ ◌ Marry / Casar / Divorce
┃ ◌ Study / Estudiar / Write / Read
┃ ◌ Work / Trabajar / Money
┃ ◌ Workout / Ejercicio / Gym
┃ ◌ Shower / Bañarse / Dress / Makeup
┃ ◌ Fly / Volar / Teleport
┃ ◌ Explode / Explotar / Burn
┃ ◌ Freeze / Congelar / Lightning
┃ ◌ Summon / Invocar / Morph
┃ ◌ Heal / Sanar / Protect
┃ ◌ Fall / Caerse / Fish / Garden
┃ ◌ Yoga / Meditar / Gamble / Steal
┃ ◌ Photo / Record / Skate / Surf
┃ ◌ Ski / Camp / Guitar / Piano
┃ ◌ Sing / Cantar / Draw / Bike
┃ ◌ Soccer / Basketball / Swim
┃ ◌ Spank / Beso_mano / Beso_frente
┃ ◌ Pillowfight / Carrito_hombros
┗━━━━━━━━━━━━━━━━━━━━━━┛`;

        let caption = `*⛩️ ANIME INTERACTION MENU ⛩️*

— *Usuario:* @${m.sender.split('@')[0]}
— *Bot:* ${assistantName}
— *Versión:* ${_package.version}

${animeCommands}

*Nota:* _Puedes usarlos sin prefijo._`.trim()

        try {
            let sendImage = typeof assistantImage === 'string' ? { url: assistantImage } : assistantImage
            await conn.sendMessage(m.chat, { image: sendImage, caption, mentions: [m.sender] }, { quoted: m })
        } catch (e) {
            await conn.reply(m.chat, caption, m)
        }
        return
    }

    
    let customCommands = `
*• GRUPOS*
◦ \`cierra\` / \`abre\`
◦ \`renombrar\` / \`setdesc\`

*• UTILIDADES*
◦ \`kick\` / \`elimina\`
◦ \`todos\` / \`tagall\`

*• DESCARGAS*
◦ \`descarga\` (FB, IG, TK)
◦ \`pin\` / \`play\` / \`ttss\`

*• IA & TOOLS*
◦ \`ia\` / \`hd\` / \`res\`
◦ \`s\` (Sticker) / \`toimg\`
◦ \`ver\` (Read ViewOnce)
`;

    let caption = `*HOLA, SOY ${assistantName.toUpperCase()}* *— Creador:* ${ownerBot[0].name}
*— Activo:* ${msToDate(process.uptime() * 1000)}

${customCommands}

*Para ver los comandos de anime usa:* \`.menu2\``

    try {
        let sendImage = typeof assistantImage === 'string' ? { url: assistantImage } : assistantImage
        await conn.sendMessage(m.chat, { image: sendImage, caption: caption.trim() }, { quoted: m })
    } catch (e) {
        await conn.reply(m.chat, caption.trim(), m)
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
