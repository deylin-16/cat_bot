import acrcloud from 'acrcloud'
import yts from 'yt-search'
import fetch from 'node-fetch'

let acr = new acrcloud({
  host: 'identify-eu-west-1.acrcloud.com',
  access_key: 'c33c767d683f78bd17d4bd4991955d81',
  access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu'
})

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    if (!/video|audio/.test(mime)) {
      return conn.reply(
        m.chat,
        `${emoji} Etiqueta un *audio* o *video corto* con *${usedPrefix + command}* para identificar la música.`,
        m,
        rcanal
      )
    }

    let buffer = await q.download()
    if (!buffer) {
      return conn.reply(m.chat, '❌ No pude descargar el archivo.', m, rcanal)
    }

    let duration = q.seconds || 0
    if (duration > 40) {
      return conn.reply(
        m.chat,
        `⚠️ El archivo solo puede durar *40 segundos máximo*. El que enviaste dura *${duration}s*.`,
        m,
        rcanal
      )
    }

    const res = await fetch('https://files.catbox.moe/64ots5.png')
    const thumb2 = Buffer.from(await res.arrayBuffer())

    const fkontak = {
      key: {
        participants: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'Halo'
      },
      message: {
        locationMessage: {
          name: `𝗥𝗘𝗦𝗨𝗟𝗧𝗔𝗗𝗢𝗦 𝗗𝗘 𝗔𝗖𝗥𝗖𝗟𝗢𝗨𝗗`,
          jpegThumbnail: thumb2
        }
      },
      participant: '0@s.whatsapp.net'
    }

    let result = await acr.identify(buffer)

    if (!result || !result.status) {
      throw new Error('Respuesta inválida del servidor ACRCloud.')
    }

    let { status, metadata } = result

    if (status.code !== 0) {
      return conn.reply(m.chat, `❌ ${status.msg}`, m, rcanal)
    }

    if (!metadata || !metadata.music || metadata.music.length === 0) {
      return conn.reply(m.chat, '❌ No se pudo identificar la música.', m, rcanal)
    }

    let music = metadata.music[0]
    let { title, artists, album, genres, release_date } = music

    let txt = '┏╾❑「 *Whatmusic Tools* 」\n'
    txt += `┃  ≡◦ *Título ∙* ${title || 'Desconocido'}\n`
    if (artists) txt += `┃  ≡◦ *Artista ∙* ${artists.map(v => v.name).join(', ')}\n`
    if (album) txt += `┃  ≡◦ *Álbum ∙* ${album.name}\n`
    if (genres) txt += `┃  ≡◦ *Género ∙* ${genres.map(v => v.name).join(', ')}\n`
    txt += `┃  ≡◦ *Fecha de lanzamiento ∙* ${release_date || 'Desconocida'}\n`


    const searchResults = await yts.search(title).catch(() => null)

    if (searchResults && searchResults.videos && searchResults.videos.length > 0) {
      const video = searchResults.videos[0]
      const { url, title: ytTitle, author, views, timestamp, thumbnail } = video

      txt += `┃  ≡◦ *YouTube:* ${ytTitle}\n`
      txt += `┃  ≡◦ *Canal:* ${author?.name || 'Desconocido'}\n`
      txt += `┃  ≡◦ *Vistas:* ${views}\n`
      txt += `┃  ≡◦ *Duración:* ${timestamp}\n`
      txt += `┃  ≡◦ *URL del video:* ${url}\n`
      txt += `┗╾❑`

      const thumbRes = await fetch(thumbnail)
      const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer())

      await conn.sendMessage(
        m.chat,
        { image: thumbBuffer, caption: txt },
        { quoted: fkontak }
      )
    } else {

      txt += `┗╾❑`
      await conn.sendMessage(
        m.chat,
        { text: txt },
        { quoted: fkontak }
      )
    }
  } catch (err) {
    console.error(err)
    conn.reply(m.chat, `❌ Error al procesar la música: ${err.message}`, m, rcanal)
  }
}

handler.command = ['whatmusic']

export default handler