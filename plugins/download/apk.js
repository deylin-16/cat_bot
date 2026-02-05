import { search, download } from 'aptoide-scraper'
import fetch from 'node-fetch'

const apkCommand = {
    name: 'apk',
    alias: ['modapk', 'aptoide'],
    category: 'descargas',
    run: async (m, { conn, args }) => {
        const text = args.join(' ')
        if (!text) return conn.sendMessage(m.chat, { text: '*[!] Ingrese el nombre de la APK.*' }, { quoted: m })

        try {
            await m.react('⏳')
            
            // 1. Buscar la aplicación
            let searchA = await search(text)
            if (!searchA.length) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] No se encontraron resultados.*' }, { quoted: m })
            }

            // 2. Descargar datos de la APK
            let data5 = await download(searchA[0].id)
            
            // 3. Validar peso máximo
            if (data5.size.includes('GB') || parseFloat(data5.size.replace(' MB', '')) > 999) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] El archivo es demasiado pesado.*' }, { quoted: m })
            }

            // 4. Preparar miniatura (Icono de la APK)
            const resThumb = await fetch(data5.icon)
            const thumbBuffer = Buffer.from(await resThumb.arrayBuffer())

            // 5. Diseño de información (Tu estilo)
            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ APTOIDE - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Nombre:* ${data5.name}\n`
            txt += `┋➙ *Package:* ${data5.package}\n`
            txt += `┋➙ *Peso:* ${data5.size}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            // 6. Envío Único: Archivo + Texto + Miniatura
            await conn.sendMessage(m.chat, {
                document: { url: data5.dllink },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${data5.name}.apk`,
                caption: txt,
                   contextInfo: {
                    externalAdReply: {
                       // title: `\t\t\t\t\t\t\t\t${name()}`,
                        thumbnailUrl: thumbBuffer || '', 
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: '*[!] Error en el proceso de descarga.*' }, { quoted: m })
        }
    }
}

export default apkCommand
