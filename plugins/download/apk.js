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
            const resThumb = await fetch('https://files.catbox.moe/rxpw9c.png')
            const thumb2 = Buffer.from(await resThumb.arrayBuffer())

            const fkontak = {
                key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "CAT-BOT" },
                message: { locationMessage: { name: '𝗔𝗣𝗞 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗗𝗔', jpegThumbnail: thumb2 } },
                participant: "0@s.whatsapp.net"
            }

            let searchA = await search(text)
            if (!searchA.length) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] No se encontraron resultados.*' }, { quoted: m })
            }

            let data5 = await download(searchA[0].id)
            
            if (data5.size.includes('GB') || parseFloat(data5.size.replace(' MB', '')) > 999) {
                await m.react('❌')
                return conn.sendMessage(m.chat, { text: '*[!] El archivo supera el límite de peso.*' }, { quoted: m })
            }

            let txt = `┏━━━━━━━━━━━━━━━━☒\n`
            txt += `┇➙ *❒ APTOIDE - DOWNLOADER*\n`
            txt += `┣━━━━━━━━━━━━━━━━⚄\n`
            txt += `┋➙ *Nombre:* ${data5.name}\n`
            txt += `┋➙ *Package:* ${data5.package}\n`
            txt += `┋➙ *Peso:* ${data5.size}\n`
            txt += `┗━━━━━━━━━━━━━━━━⍰`

            await conn.sendFile(m.chat, data5.icon, 'thumbnail.jpg', txt, fkontak)

            await conn.sendMessage(m.chat, {
                document: { url: data5.dllink },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${data5.name}.apk`
            }, { quoted: m })

            await m.react('✅')

        } catch (e) {
            console.error(e)
            await m.react('❌')
            return conn.sendMessage(m.chat, { text: '*[!] Fallo en el servidor de descarga.*' }, { quoted: m })
        }
    }
}

export default apkCommand
