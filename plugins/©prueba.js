import fs from 'fs'
import path from 'path'

const handler = async (m, { conn }) => {
    // Carpetas donde buscaremos errores
    const directories = ['./plugins', './lib', './src', './']
    let report = []
    
    await m.reply('🚀 *Iniciando escaneo de sintaxis...* Por favor espera.')

    const scanDir = (dir) => {
        const files = fs.readdirSync(dir)

        for (const file of files) {
            const fullPath = path.join(dir, file)
            let stat
            try {
                stat = fs.statSync(fullPath)
            } catch (e) { continue }

            if (stat.isDirectory()) {
                // Omitir carpetas pesadas o innecesarias
                if (['node_modules', '.git', 'sessions', 'db'].includes(file)) continue
                scanDir(fullPath)
            } else if (file.endsWith('.js')) {
                try {
                    const code = fs.readFileSync(fullPath, 'utf8')
                    // Intentamos validar la sintaxis creando una función con el código
                    new Function('import', 'export', code)
                } catch (err) {
                    report.push(`❌ *Archivo:* \`${fullPath}\`\n⚠️ *Error:* ${err.message}\n───────────`)
                }
            }
        }
    }

    try {
        directories.forEach(d => {
            if (fs.existsSync(d)) scanDir(d)
        })
    } catch (e) {
        return m.reply(`❌ Error crítico durante el escaneo: ${e.message}`)
    }

    if (report.length > 0) {
        let finalMsg = `🔍 *RESULTADOS DEL ESCANEO SCAN*\n\n${report.join('\n\n')}\n\n💡 *Consejo:* Revisa las líneas mencionadas, usualmente falta cerrar una llave \`}\` o hay un \`return\` fuera de una función.`
        await m.reply(finalMsg)
    } else {
        await m.reply('✅ *Escaneo finalizado:* No se detectaron errores de sintaxis en los archivos .js analizados.')
    }
}

handler.command = ['scan']
handler.rowner = true // Solo tú puedes usarlo

export default handler
