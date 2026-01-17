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
        'dance': 'bailar', 'kick2': 'patada', 'laugh': 'reir',
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

    if (!data.wa_ids) data.wa_ids = []

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
        if (data.wa_ids.length >= 5) {
            let randomMsg = data.wa_ids[Math.floor(Math.random() * data.wa_ids.length)]
            await conn.sendMessage(m.chat, {
                video: randomMsg.message.videoMessage,
                caption: textoFinal,
                gifPlayback: true,
                mentions: menciones
            }, { quoted: m })
            return 
        }

        const { data: tenorRes } = await axios.get(
            `https://api.tenor.com/v1/search?q=${encodeURIComponent(data.search)}&key=LIVDSRZULELA&limit=15`
        )

        if (!tenorRes?.results?.length) throw new Error()
        const randomGif = tenorRes.results[Math.floor(Math.random() * tenorRes.results.length)]
        const videoUrl = randomGif.media[0].mp4.url

        let sentMsg = await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: textoFinal,
            gifPlayback: true,
            mentions: menciones
        }, { quoted: m })

        data.wa_ids.push(sentMsg) 
        fs.writeFileSync(path, JSON.stringify(dbReacciones, null, 2))

    } catch (e) {
        console.error(e)
        m.reply('❌ Error.')
    }
}

handler.command = /^(beso|kiss[23]?|beso[23]|abrazo|hug|hug2|abrazo2|golpe|slap|matar|kill|pat|acariciar|bailar|dance|patada|kick2|reir|laugh|triste|sad|cry|enojado|angry|saludo|wave|morder|bite|lamer|lick|dormir|sleep|comer|eat|asustar|scare|disparar|shoot|correr|run|mirar|stare|asombro|wow|tímido|blush|cafe|coffee|pizza|ramen|tee|boxeo|gritar|pensar|fumar|jugar|esconderse|suicidio|suicide|ignorar|aplaudir|clap|vomit|vomitar|cook|cocinar|marry|casar|divorce|divorcio|cachetada|twerk|study|estudiar|work|trabajar|workout|ejercicio|shower|bañarse|stalk|espiar|fly|volar|drink|beber|beer|soccer|fútbol|basketball|baloncesto|swim|nadar|sing|cantar|guitar|tocar_guitarra|piano|tocar_piano|draw|dibujar|write|escribir|read|leer|travel|viajar|shop|comprar|clean|limpiar|drive|conducir|bike|montar_bici|teleport|teletransportarse|explode|explotar|freeze|congelar|burn|quemar|lightning|electrocutar|summon|invocar|morph|transformarse|heal|sanar|protect|proteger|fall|caerse|fish|pescar|garden|jardinería|meditate|yoga|gamble|apostar|steal|robar|lie|mentir|fear|asustarse|beg|suplicar|disgust|desprecio|smug|orgulloso|bored|aburrido|confused|confundido|excited|emocionado|avergonzado|tired|cansado|water|beber_agua|burger|comer_hamburguesa|candy|comer_dulces|breakfast|desayunar|dinner|cenar|icecream|helado|juice|jugo|fruit|fruta|vape|vapear|brush|peinarse|makeup|maquillarse|dress|vestirse|mirror|mirarse_espejo|llorar_risa|money|dinero|pc|tv|music|escuchar_musica|photo|fotografiar|record|grabar|skate|patinar|surf|surfear|ski|esquiar|camp|acampar|nightmare|pesadilla|wakeup|despertar|sneeze|estornudar|sick|enfermo|curar|spank|mimar|cuddle|beso_mano|beso_frente|cargar_hombros|pillowfight|pelea_almohadas|stars|mirar_estrellas)$/i
handler.group = true

export default handler
