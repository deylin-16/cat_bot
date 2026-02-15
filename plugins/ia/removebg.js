import fetch from 'node-fetch'

const deleteBgCommand = {
    name: 'delfon',
    alias: ['nofondo', 'removebg'],
    category: 'tools',
    run: async (m, { conn, usedPrefix, command }) => {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        
        if (!/image/.test(mime)) {
            return conn.reply(m.chat, `> ★ Etiqueta una imagen con el comando #*${command}* para eliminar su fondo.`, m)
        }

        try {
            await m.react('⏳')

            const buffer = await q.download()
            const formData = new FormData()
            formData.append('image_file', new Blob([buffer]), 'image.png')
            formData.append('size', 'auto')

            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': 'zCdVbVyLkHkVkqRRzycSzMrc' 
                },
                body: formData
            })

            if (!response.ok) {
                await m.react('❌')
                return conn.reply(m.chat, `♛ La API respondió con un error: ${response.statusText}`, m)
            }

            const resultBuffer = Buffer.from(await response.arrayBuffer())

            await conn.sendMessage(m.chat, { 
                image: resultBuffer, 
                caption: '⍰ Fondo eliminado correctamente.' 
            }, { quoted: m })
            
            await m.react('✅')

        } catch (err) {
            console.error(err)
            await m.react('❌')
            conn.reply(m.chat, `▶  Ocurrió un fallo técnico al procesar la imagen.`, m)
        }
    }
}

export default deleteBgCommand
