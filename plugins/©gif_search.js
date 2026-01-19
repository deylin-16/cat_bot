import axios from 'axios'

let handler = async (m, { conn, text }) => {
  if (!text) return conn.reply(m.chat, `⚠️ Ingresa un texto para buscar GIFs.`, m)

  try {
    const { data } = await axios.get(
      `https://api.tenor.com/v1/search?q=${encodeURIComponent(text)}&key=LIVDSRZULELA&limit=5`
    )

    if (!data?.results || data.results.length === 0)
      return conn.reply(m.chat, `❌ No encontré GIFs para *${text}*`, m)

    for (let gif of data.results) {
      const mediaObj = gif.media[0]
      const url = mediaObj?.mp4?.url || mediaObj?.gif?.url || mediaObj?.tinygif?.url
      if (!url) continue

      await conn.sendMessage(m.chat, {
        video: { url },
        mimetype: 'video/mp4',
        gifPlayback: true,
        caption: `${url}`
      }, { quoted: m })
    }
  } catch (err) {
    console.error('Error Tenor:', err.message)
    conn.reply(m.chat, '❌ Error al obtener GIFs desde Tenor.', m)
  }
}

handler.command = /^gif$/i

export default handler