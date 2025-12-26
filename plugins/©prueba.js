import fs from 'fs'
import path from 'path'

const handler = async (m, { conn }) => {
    const folders = ['./plugins', './lib', './db', './']
    let errors = []

    await m.reply('🔍 Iniciando investigación de errores de sintaxis (*Illegal return*)...')

    const checkIllegalReturn = (dir) => {
        const files = fs.readdirSync(dir)

        files.forEach(file => {
            const fullPath = path.join(dir, file)
            let stat
            try {
                stat = fs.statSync(fullPath)
            } catch (e) { return }

            if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git')) {
                checkIllegalReturn(fullPath)
            } else if (file.endsWith('.js')) {
                const content = fs.readFileSync(fullPath, 'utf8')
                const lines = content.split('\n')
                
                lines.forEach((line, index) => {
                    const trimmed = line.trim()
                    if (trimmed.startsWith('return ') || trimmed === 'return') {
                        const beforeContent = content.substring(0, content.indexOf(line))
                        const openBraces = (beforeContent.match(/{/g) || []).length
                        const closeBraces = (beforeContent.match(/}/g) || []).length
                        const depth = openBraces - closeBraces
                        
                        if (depth <= 0) {
                            errors.push(`📍 *Archivo:* ${fullPath}\n│ 🔢 *Línea:* ${index + 1}\n│ 💡 *Código:* \`${trimmed}\`\n╰───────────`)
                        }
                    }
                })
            }
        })
    }

    folders.forEach(folder => {
        if (fs.existsSync(folder)) checkIllegalReturn(folder)
    })

    if (errors.length > 0) {
        let report = `❌ *Se encontraron posibles errores de sintaxis:*\n\n${errors.join('\n\n')}\n\nREVISIÓN: Estos "return" están fuera de una función.`
        await m.reply(report)
    } else {
        await m.reply('✅ *Investigación finalizada:* No se encontraron sentencias "return" ilegales en las carpetas rastreadas.')
    }
}

handler.command = ['investigacion', 'investigar']
handler.rowner = true // Solo el dueño puede usarlo por seguridad

export default handler
