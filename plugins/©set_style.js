import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../db/assistant_sessions.json')

const loadConfigs = () => {
    if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}', 'utf8')
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    } catch {
        return {}
    }
}

const saveConfigs = (configs) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(configs, null, 2), 'utf8')
}

const handler = async (m, { conn, text, command }) => {
    const botId = conn.user.jid
    const configs = loadConfigs()

    if (!configs[botId]) {
        configs[botId] = { assistantName: null, assistantImage: null, assistantIcon: null }
    }

    if (command === 'setname') {
        if (!text) return m.reply('⚠️ Introduce el nombre para este asistente.')
        configs[botId].assistantName = text
        saveConfigs(configs)
        m.reply(`✅ Nombre de este asistente cambiado a: *${text}*.`)

    } else if (command === 'setimage') {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        if (!/image\/(jpe?g|png)|webp/.test(mime)) return m.reply('🖼️ Responde a una imagen para el fondo.')

        try {
            let media = await q.download?.()
            configs[botId].assistantImage = media.toString('base64')
            saveConfigs(configs)
            m.reply('✅ Imagen de fondo guardada.')
        } catch (e) {
            console.error(e)
            m.reply('❌ Error al guardar la imagen.')
        }

    } else if (command === 'seticono') {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        if (!/image\/(jpe?g|png)|webp/.test(mime)) return m.reply('🖼️ Responde a una imagen para el icono pequeño.')

        try {
            let media = await q.download?.()
            configs[botId].assistantIcon = media.toString('base64')
            saveConfigs(configs)
            m.reply('✅ Icono pequeño guardado correctamente.')
        } catch (e) {
            console.error(e)
            m.reply('❌ Error al guardar el icono.')
        }
    }
}

handler.command = ['setname', 'setimage', 'seticono']
handler.subBot = true 

export default handler
