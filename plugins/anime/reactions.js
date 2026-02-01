/*import axios from 'axios'
import fs from 'fs'
import { join } from 'path'

const path = join(process.cwd(), 'db', 'social_reactions.json')
let dbReacciones = {}
if (fs.existsSync(path)) {
    try {
        dbReacciones = JSON.parse(fs.readFileSync(path, 'utf-8'))
    } catch (e) {}
}

const socialCommand = {
    name: 'reactions',
    alias: [
        'beso', 'kiss', 'kiss2', 'kiss3', 'beso2', 'beso3', 'abrazo', 'hug', 'hug2', 'abrazo2', 
        'golpe', 'slap', 'matar', 'kill', 'pat', 'acariciar', 'bailar', 'dance', 'patada', 'kick2', 
        'reir', 'laugh', 'triste', 'sad', 'cry', 'enojado', 'angry', 'saludo', 'wave', 'morder', 
        'bite', 'lamer', 'lick', 'dormir', 'sleep', 'comer', 'eat', 'asustar', 'scare', 'disparar', 
        'shoot', 'correr', 'run', 'mirar', 'stare', 'asombro', 'wow', 'tímido', 'blush', 'cafe', 
        'coffee', 'suicidio', 'suicide', 'aplaudir', 'clap', 'vomitar', 'vomit', 'cocinar', 'cook', 
        'casar', 'marry', 'divorcio', 'divorce', 'twerk', 'estudiar', 'study', 'trabajar', 'work', 
        'ejercicio', 'workout', 'bañarse', 'shower', 'espiar', 'stalk', 'volar', 'fly', 'beber', 
        'drink', 'beer', 'fútbol', 'soccer', 'baloncesto', 'basketball', 'nadar', 'swim', 'cantar', 
        'sing', 'tocar_guitarra', 'guitar', 'tocar_piano', 'piano', 'dibujar', 'draw', 'escribir', 
        'write', 'leer', 'read', 'viajar', 'travel', 'comprar', 'shop', 'limpiar', 'clean', 
        'conducir', 'drive', 'montar_bici', 'bike', 'teletransportarse', 'teleport', 'explotar', 
        'explode', 'congelar', 'freeze', 'quemar', 'burn', 'electrocutar', 'lightning', 'invocar', 
        'summon', 'transformarse', 'morph', 'sanar', 'heal', 'proteger', 'protect', 'caerse', 
        'fall', 'pescar', 'fish', 'jardinería', 'garden', 'meditar', 'apostar', 'gamble', 'robar', 
        'steal', 'mentir', 'lie', 'asustarse', 'fear', 'suplicar', 'beg', 'desprecio', 'disgust', 
        'orgulloso', 'smug', 'aburrido', 'bored', 'confundido', 'emocionado', 'excited', 'cansado', 
        'tired', 'beber_agua', 'water', 'comer_hamburguesa', 'burger', 'comer_dulces', 'candy', 
        'desayunar', 'cenar', 'dinner', 'comer_helado', 'icecream', 'beber_jugo', 'juice', 
        'comer_fruta', 'fruit', 'vapear', 'vape', 'peinarse', 'brush', 'maquillarse', 'makeup', 
        'vestirse', 'dress', 'mirarse_espejo', 'mirror', 'money', 'pc', 'tv', 'music', 'photo', 
        'record', 'skate', 'surf', 'ski', 'camp', 'pesadilla', 'wakeup', 'sneeze', 'sick', 
        'spank', 'cuddle', 'pillowfight', 'stars'
    ],
    category: 'interacciones',
    run: async (m, { conn, command }) => {
        const cmd = command.toLowerCase()
        const alias = { 
            'kiss': 'beso', 'kiss2': 'beso2', 'kiss3': 'beso3',
            'hug': 'abrazo', 'hug2': 'abrazo2', 'slap': 'golpe', 
            'kill': 'matar', 'pat': 'acariciar', 'dance': 'bailar', 
            'kick2': 'patada', 'laugh': 'reir', 'cry': 'triste', 
            'sad': 'triste', 'angry': 'enojado', 'wave': 'saludo', 
            'bite': 'morder', 'lick': 'lamer', 'sleep': 'dormir', 
            'eat': 'comer', 'scare': 'asustar', 'shoot': 'disparar', 
            'run': 'correr', 'stare': 'mirar', 'wow': 'asombro', 
            'blush': 'tímido', 'coffee': 'cafe', 'suicide': 'suicidio', 
            'clap': 'aplaudir', 'vomit': 'vomitar', 'cook': 'cocinar', 
            'marry': 'casar', 'divorce': 'divorcio', 'twerk': 'twerk', 
            'study': 'estudiar', 'work': 'trabajar', 'workout': 'ejercicio', 
            'shower': 'bañarse', 'stalk': 'espiar', 'fly': 'volar', 
            'drink': 'beber', 'beer': 'beber', 'stars': 'mirar_estrellas'
        }

        const key = alias[cmd] || cmd
        const data = dbReacciones[key]
        if (!data) return

        const user = m.sender
        const target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        const userName = `@${user.split('@')[0]}`
        const menciones = [user]
        let textoFinal = ''

        if (target) {
            menciones.push(target)
            const targetName = `@${target.split('@')[0]}`
            textoFinal = target === user 
                ? data.txt_solo.replace('@user', userName)
                : data.txt_mencion.replace('@user', userName).replace('@target', targetName)
        } else {
            textoFinal = data.txt_grupo.replace('@user', userName)
        }

        try {
            const [reaccion, tenorRes] = await Promise.all([
                conn.sendMessage(m.chat, { react: { text: data.emoji, key: m.key } }),
                axios.get(`https://api.tenor.com/v1/search?q=${encodeURIComponent(data.search)}&key=LIVDSRZULELA&limit=2&media_filter=mp4`)
            ])

            const res = tenorRes.data?.results
            if (!res?.length) return

            const videoUrl = res[Math.floor(Math.random() * res.length)].media[0].mp4.url

            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: textoFinal,
                gifPlayback: true,
                mentions: menciones
            }, { quoted: m })

        } catch (e) {
            console.error(e)
        }
    }
}

export default socialCommand*/
