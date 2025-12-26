import fs from 'fs'
import path from 'path'
import { vm } from 'node:vm'

const handler = async (m, { conn }) => {
    const folders = ['./plugins', './lib', './']
    let errors = []

    await m.reply('🔍 Iniciando investigación profunda de sintaxis...')

    const checkSyntax = (dir) => {
        const files = fs.readdirSync(dir)

        files.forEach(file => {
            const fullPath = path.join(dir, file)
            let stat
            try {
                stat = fs.statSync(fullPath)
            } catch (e) { return }

            if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git')) {
                checkSyntax(fullPath)
            } else if (file.endsWith('.js')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8')
                    // Intentamos crear un script en memoria para validar la sintaxis
                    new Function(content) 
                } catch (e) {
                    errors.push(`📍 *Archivo:* ${fullPath}\n⚠️ *Error:* ${e.message}\n───────────`)
                }
            }
        })
    }

    folders.forEach(folder => {
        if (fs.existsSync(folder)) checkSyntax(folder)
    })

    if (errors.length > 0) {
        let report = `❌ *ERRORES DE SINTAXIS ENCONTRADOS:*\n\n${errors.join('\n\n')}`
        await m.reply(report)
    } else {
        await m.reply('✅ No se detectaron errores de sintaxis obvios. Si el error persiste, revisa el archivo `config.js` manualmente al final de las funciones.')
    }
}

handler.command = ['investigacion', 'investigar']
handler.rowner = true

export default handler
