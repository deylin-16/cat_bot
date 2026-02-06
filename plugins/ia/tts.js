import fetch from 'node-fetch'

const ttsCommand = {
    name: 'tts',
    alias: ['voz'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return
        try {
            await m.react('⏳')
            
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`

            const res = await fetch(url)
            const buffer = await res.buffer()

            // ENVIAR COMO AUDIO ESTÁNDAR (Como lo hace tu comando 'get')
            await conn.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: 'audio/mpeg', // MP3 es audio/mpeg
                ptt: false, // IMPORTANTE: Ponlo en false para que no intente ser nota de voz
                fileName: `tts.mp3`
            }, { quoted: m })

            await m.react('✅')
        } catch (err) {
            console.error(err)
            await m.react('❌')
        }
    }
}

export default ttsCommand
