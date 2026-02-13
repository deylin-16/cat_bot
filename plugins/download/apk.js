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

            let searchA = await search(text)
            if (!searchA || !searchA.length) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] No se encontraron resultados.*' }, { quoted: m })
            }

            let data5 = await download(searchA[0].id)

            if (data5.size.includes('GB') || parseFloat(data5.size.replace(/[^0-9.]/g, '')) > 999) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] El archivo es demasiado pesado.*' }, { quoted: m })
            }

            const resThumb = await fetch(data5.icon)
            const thumbBuffer = Buffer.from(await resThumb.arrayBuffer())

            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ APTOIDE - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Nombre:* ${data5.name}\n`
            txt += `┋➙ *Package:* ${data5.package}\n`
            txt += `┋➙ *Peso:* ${data5.size}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            await conn.sendMessage(m.chat, {
                document: { url: data5.dllink },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${data5.name}.apk`,
                caption: txt,
                contextInfo: {
                    externalAdReply: {
                        title: data5.name,
                        body: 'Click para descargar',
                        thumbnail: thumbBuffer,
                        sourceUrl: data5.dllink,
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
