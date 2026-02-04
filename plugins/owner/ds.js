import { existsSync, promises as fs } from 'fs'
import path from 'path'

const dsCommand = {
    name: 'ds',
    alias: ['cleansession', 'limpiar'],
    category: 'owner',
    rowner: true,
    run: async (m, { conn }) => {
        const MAIN_NUMBER = '50432569059@s.whatsapp.net'
        if (conn.user.jid !== MAIN_NUMBER) {
            return conn.sendMessage(m.chat, { text: '> *Este comando solo puede ser ejecutado por el número principal.*' }, { quoted: m })
        }

        const sessionPath = `./${global.sessions || 'sessions'}/`
        const tmpPath = './tmp/'
        let filesDeleted = 0

        try {
            
            if (existsSync(sessionPath)) {
                const sessionFiles = await fs.readdir(sessionPath)
                for (const file of sessionFiles) {
                    if (file !== 'creds.json') {
                        await fs.unlink(path.join(sessionPath, file))
                        filesDeleted++
                    }
                }
            }

            if (existsSync(tmpPath)) {
                const tmpFiles = await fs.readdir(tmpPath)
                for (const file of tmpFiles) {
                    await fs.unlink(path.join(tmpPath, file))
                    filesDeleted++
                }
            }

            if (filesDeleted === 0) {
                await conn.sendMessage(m.chat, { text: '> *No se encontraron archivos prescindibles para eliminar.*' }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, { 
                    text: `> *𝗟𝗜𝗠𝗣𝗜𝗘𝗭𝗔 𝗣𝗥𝗢𝗙𝗨𝗡𝗗𝗔 𝗙𝗜𝗡𝗔𝗟𝗜𝗭𝗔𝗗𝗔*\n\n*Archivos eliminados:* ${filesDeleted}\n*Estado:* Memoria optimizada y sesiones huérfanas purgadas.` 
                }, { quoted: m })
            }

        } catch (err) {
            console.error(err)
            await conn.sendMessage(m.chat, { text: '> *Error crítico durante la purga de archivos.*' }, { quoted: m })
        }
    }
}

export default dsCommand
