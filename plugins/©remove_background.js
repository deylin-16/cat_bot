import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    if (!/image/.test(mime)) return conn.reply(m.chat, `🖼️ Etiqueta una imagen con el comando *${usedPrefix + command}* para eliminar su fondo.`, m)


    const buffer = await q.download()


    const formData = new FormData()
    formData.append('image_file', new Blob([buffer]), 'image.png')
    formData.append('size', 'auto') 

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': '3SqybUm2S1uEb9yGzErTrdfP' 
      },
      body: formData
    })

    if (!response.ok) throw new Error(`Error eliminando fondo: ${response.statusText}`)
    const resultBuffer = Buffer.from(await response.arrayBuffer())


    await conn.sendMessage(m.chat, { image: resultBuffer, caption: '✅ Fondo eliminado correctamente.' }, { quoted: m })

  } catch (err) {
    console.error(err)
    conn.reply(m.chat, `❌ Error: ${err.message}`, m)
  }
}


handler.command = ['delfon','nofondo']

export default handler