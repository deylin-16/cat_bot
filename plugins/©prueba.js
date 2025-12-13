import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../db/group_configs.json')

const loadConfigs = () => {
    let content = '{}'
    if (fs.existsSync(DB_PATH)) {
        content = fs.readFileSync(DB_PATH, 'utf8').trim()
    }
    
    if (content === '') {
        fs.writeFileSync(DB_PATH, JSON.stringify({}), 'utf8')
        return {}
    }
    
    try {
        return JSON.parse(content)
    } catch (e) {
        console.error("El archivo group_configs.json está corrupto. Restableciendo a {}.", e)
        fs.writeFileSync(DB_PATH, JSON.stringify({}), 'utf8')
        return {}
    }
}

const saveConfigs = (configs) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(configs, null, 2), 'utf8')
}

const handler = async (m, { conn, text, command, isROwner }) => {
    
    if (!isROwner) return m.reply('❌ Este comando solo puede ser ejecutado por el Propietario/Desarrollador del bot.')
    if (!m.isGroup) return m.reply('❌ Esta personalización es específica para grupos.')
    
    const chatId = m.chat
    const configs = loadConfigs()
    
    const args = text.split(' ')
    const action = args[0].toLowerCase()
    const value = args.slice(1).join(' ').trim()

    if (!action) {
        return m.reply(`*Uso:*
*${command} nombre* [Nuevo Nombre del Asistente]
*${command} imagen* (Responde a una imagen para guardarla como logo del asistente)
*${command} reset* (Para volver a la configuración predeterminada)
`)
    }

    if (!configs[chatId]) {
        configs[chatId] = { assistantName: null, assistantImage: null }
    }
    
    if (action === 'nombre') {
        if (!value) return m.reply('⚠️ Por favor, introduce el nuevo nombre del asistente para este grupo.')
        
        configs[chatId].assistantName = value
        saveConfigs(configs)
        m.reply(`✅ Nombre del asistente para este grupo cambiado a: *${value}*.`)

    } else if (action === 'imagen') {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''

        if (!/image\/(jpe?g|png)|webp/.test(mime)) {
            return m.reply('🖼️ Debe responder a una imagen para guardarla como logo/imagen del asistente en este grupo.')
        }
        
        try {
            let media = await q.download?.()
            const base64Image = media.toString('base64') 

            configs[chatId].assistantImage = base64Image
            saveConfigs(configs)
            
            m.reply('✅ Imagen del asistente guardada exitosamente para este grupo.')
            
        } catch (e) {
            console.error(e)
            m.reply('❌ Falló la descarga o guardado de la imagen.')
        }
        
    } else if (action === 'reset') {
        delete configs[chatId]
        saveConfigs(configs)
        m.reply('✅ Configuración del asistente restablecida a la identidad predeterminada.')
        
    } else {
        return m.reply(`*Acción desconocida:* '${action}'. Use 'nombre', 'imagen', o 'reset'.`)
    }
}

handler.command = ['setassistant']
handler.tags = ['owner']
handler.rowner = true

export default handler
