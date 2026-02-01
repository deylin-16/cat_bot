import fetch from 'node-fetch'
import { format } from 'util'

const getCommand = {
    name: 'get',
    alias: ['fetch', 'get'],
    category: 'tools',
    rowner: false,
    run: async (m, { conn, text }) => {
        try {
            await m.react('⏳')

            if (m.quoted && m.quoted.mimetype) {
                const mime = m.quoted.mimetype
                const buffer = await m.quoted.download()

                if (/text|json|javascript|html|css|xml/.test(mime)) {
                    let txt = buffer.toString('utf-8')
                    try { txt = format(JSON.parse(txt)) } catch {}

                    await conn.sendMessage(m.chat, { 
                        text: `${txt.slice(0, 4000)}` 
                    }, { quoted: m })
                    return m.react('📜')
                }

                await conn.sendMessage(m.chat, { 
                    document: buffer, 
                    mimetype: mime, 
                    fileName: m.quoted.fileName || 'file_system' 
                }, { quoted: m })
                return m.react('📦')
            }

            if (!text || !/^https?:\/\//.test(text)) {
                return conn.sendMessage(m.chat, { 
                    text: `┏━━━〔 sʏsᴛᴇᴍ ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ɪɴғᴏ: ᴜʀʟ ɪɴᴠᴀʟɪᴅ.\n┃ ✎ ᴜsᴀɢᴇ: .ɢᴇᴛ <ʟɪɴᴋ>\n┗━━━━━━━━━━━━━━━━━━┛` 
                }, { quoted: m })
            }

            const res = await fetch(text)
            const type = res.headers.get('content-type') || ''
            const buffer = await res.buffer() // Descargamos el buffer siempre

            // Si es texto, lo formateamos
            if (/text|json|javascript/.test(type)) {
                let txt = buffer.toString('utf-8')
                try { txt = format(JSON.parse(txt)) } catch {}
                await conn.sendMessage(m.chat, { text: txt.slice(0, 4000) }, { quoted: m })
                return m.react('✅')
            }

            // Si es binario (imagen, audio, video), enviamos el buffer directamente
            await conn.sendMessage(m.chat, { 
                document: buffer, 
                mimetype: type, 
                fileName: 'downloaded_file' 
            }, { quoted: m })
            
            await m.react('📡')

        } catch (err) {
            await m.react('❌')
            await conn.sendMessage(m.chat, { 
                text: `┏━━━〔 ғᴀᴛᴀʟ ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ᴍsɢ: ${err.message}\n┗━━━━━━━━━━━━━━━━━━┛` 
            }, { quoted: m })
        }
    }
}

export default getCommand
