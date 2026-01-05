import axios from 'axios'
import fs from 'fs'
import { join } from 'path'

let handler = async (m, { conn, command }) => {
    const path = join(process.cwd(), 'db', 'social_reactions.json')
    if (!fs.existsSync(path)) return

    let dbReacciones = JSON.parse(fs.readFileSync(path, 'utf-8'))
    let cmd = command.toLowerCase()

    
    const alias = { 
        'kiss': 'beso', 'kiss2': 'beso2', 'kiss3': 'beso3',
        'hug': 'abrazo', 'hug2': 'abrazo2', 
        'slap': 'golpe', 'kill': 'matar', 'pat': 'acariciar', 
        'dance': 'bailar', 'kick': 'patada', 'laugh': 'reir',
        'cry': 'triste', 'sad': 'triste', 'angry': 'enojado', 
        'wave': 'saludo', 'bite': 'morder', 'lick': 'lamer', 
        'sleep': 'dormir', 'eat': 'comer', 'scare': 'asustar', 
        'shoot': 'disparar', 'run': 'correr', 'stare': 'mirar', 
        'wow': 'asombro', 'blush': 'tímido', 'coffee': 'cafe',
        'suicide': 'suicidio', 'clap': 'aplaudir', 'vomit': 'vomitar',
        'cook': 'cocinar', 'marry': 'casar', 'divorce': 'divorcio',
        'twerk': 'twerk', 'study': 'estudiar', 'work': 'trabajar',
        'workout': 'ejercicio', 'shower': 'bañarse', 'stalk': 'espiar',
        'fly': 'volar', 'drink': 'beber', 'beer': 'beber',
        'soccer': 'fútbol', 'basketball': 'baloncesto', 'swim': 'nadar',
        'sing': 'cantar', 'guitar': 'tocar_guitarra', 'piano': 'tocar_piano',
        'draw': 'dibujar', 'write': 'escribir', 'read': 'leer',
        'travel': 'viajar', 'shop': 'comprar', 'clean': 'limpiar',
        'drive': 'conducir', 'bike': 'montar_bici', 'teleport': 'teletransportarse',
        'explode': 'explotar', 'freeze': 'congelar', 'burn': 'quemar',
        'lightning': 'electrocutar', 'summon': 'invocar', 'morph': 'transformarse',
        'heal': 'sanar', 'protect': 'proteger', 'fall': 'caerse',
        'fish': 'pescar', 'garden': 'jardinería', 'meditate': 'meditar',
        'gamble': 'apostar', 'steal': 'robar', 'lie': 'mentir',
        'fear': 'asustarse', 'beg': 'suplicar', 'disgust': 'desprecio',
        'smug': 'orgulloso', 'bored': 'aburrido', 'confused': 'confundido',
        'excited': 'emocionado', 'tired': 'cansado', 'water': 'beber_agua',
        'burger': 'comer_hamburguesa', 'candy': 'comer_dulces', 'breakfast': 'desayunar',
        'dinner': 'cenar', 'icecream': 'comer_helado', 'juice': 'beber_jugo',
        'fruit': 'comer_fruta', 'vape': 'vapear', 'brush': 'peinarse',
        'makeup': 'maquillarse', 'dress': 'vestirse', 'mirror': 'mirarse_espejo',
        'money': 'dar_dinero', 'pc': 'trabajar_pc', 'tv': 'ver_tv',
        'music': 'escuchar_musica', 'photo': 'fotografiar', 'record': 'grabar',
        'skate': 'patinar', 'surf': 'surfear', 'ski': 'esquiar',
        'camp': 'acampar', 'nightmare': 'pesadilla', 'wakeup': 'despertar',
        'sneeze': 'estornudar', 'sick': 'enfermo', 'spank': 'abofetear_trasero',
        'cuddle': 'mimar', 'pillowfight': 'pelea_almohadas', 'stars': 'mirar_estrellas'
    }

    let key = alias[cmd] || cmd
    let data = dbReacciones[key]
    if (!data) return

    await conn.sendMessage(m.chat, { react: { text: data.emoji, key: m.key } })

    let user = m.sender
    let target = m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
    let textoFinal = ''
    let menciones = [user]

    if (target) {
        if (target === user) {
            textoFinal = data.txt_solo.replace('@user', `@${user.split('@')[0]}`)
        } else {
            textoFinal = data.txt_mencion.replace('@user', `@${user.split('@')[0]}`).replace('@target', `@${target.split('@')[0]}`)
            menciones.push(target)
        }
    } else {
        textoFinal = data.txt_grupo.replace('@user', `@${user.split('@')[0]}`)
    }

    try {
        const { data: tenorRes } = await axios.get(
            `https://api.tenor.com/v1/search?q=${encodeURIComponent(data.search)}&key=LIVDSRZULELA&limit=15`
        )

        if (!tenorRes?.results?.length) throw new Error()

        const randomGif = tenorRes.results[Math.floor(Math.random() * tenorRes.results.length)]
        const videoUrl = randomGif.media[0].mp4.url

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: textoFinal,
            gifPlayback: true,
            mentions: menciones
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Error al obtener el GIF.')
    }
}


handler.command = /^(beso|kiss[23]?|beso[23]|abrazo|hug|hug2|abrazo2|golpe|slap|matar|kill|pat|acariciar|bailar|dance|patada|kick|reir|laugh|triste|sad|cry|enojado|angry|saludo|wave|morder|bite|lamer|lick|dormir|sleep|comer|eat|asustar|scare|disparar|shoot|correr|run|mirar|stare|asombro|wow|tímido|blush|cafe|coffee|pizza|ramen|tee|boxeo|gritar|pensar|fumar|jugar|esconderse|suicidio|suicide|ignorar|aplaudir|clap|vomitar|vomit|cocinar|cook|casar|marry|divorcio|divorce|cachetada|twerk|estudiar|study|trabajar|work|ejercicio|workout|bañarse|shower|espiar|stalk|volar|fly|beber|drink|beer|fútbol|soccer|baloncesto|basketball|nadar|swim|cantar|sing|tocar_guitarra|guitar|tocar_piano|piano|dibujar|draw|escribir|write|leer|read|viajar|travel|comprar|shop|limpiar|clean|conducir|drive|montar_bici|bike|teletransportarse|teleport|explotar|explode|congelar|freeze|quemar|burn|electrocutar|lightning|invocar|summon|transformarse|morph|sanar|heal|proteger|protect|caerse|fall|pescar|fish|jardinería|garden|meditar|yoga|apostar|gamble|robar|steal|mentir|lie|asustarse|fear|suplicar|beg|desprecio|disgust|orgulloso|smug|aburrido|bored|confundido|emocionado|excited|avergonzado|cansado|tired|beber_agua|water|comer_hamburguesa|burger|comer_dulces|candy|desayunar|cenar|dinner|comer_helado|icecream|beber_jugo|juice|comer_fruta|fruit|vapear|vape|peinarse|brush|maquillarse|makeup|vestirse|dress|mirarse_espejo|mirror|llorar_risa|dar_dinero|money|pedir_dinero|trabajar_pc|pc|ver_tv|tv|escuchar_musica|music|fotografiar|photo|grabar|record|patinar|skate|surfear|surf|esquiar|ski|acampar|camp|pesadilla|despertar|wakeup|estornudar|sneeze|enfermo|sick|curar|abofetear_trasero|spank|mimar|cuddle|beso_mano|beso_frente|cargar_hombros|pelea_almohadas|pillowfight|jugar_cartas|beber_soda|comer_tacos|comer_chocolate|mirar_estrellas|stars)$/i

handler.group = true

export default handler
