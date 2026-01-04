import { sticker } from '../lib/sticker.js'
import { webp2png } from '../lib/webp2mp4.js'
import Jimp from 'jimp'
import { uploadFile } from '../lib/uploadFile.js'

const isUrl = (text) => text && text.match(/https?:\/\/[^\s]+/i)

const averageBrightness = async (buffer) => {
  try {
    const img = await Jimp.read(buffer)
    const w = img.bitmap.width
    const h = img.bitmap.height
    let total = 0, count = 0
    for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 50))) {
      for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 50))) {
        const { r, g, b } = Jimp.intToRGBA(img.getPixelColor(x, y))
        total += (0.299 * r + 0.587 * g + 0.114 * b)
        count++
      }
    }
    return total / count
  } catch {
    return 100
  }
}

const makeImageWithText = async (buffer, text, color) => {
  const image = await Jimp.read(buffer)
  image.cover(512, 512)
  const w = image.bitmap.width
  const h = image.bitmap.height
  const maxWidth = w - 60
  const font = color === 'white' ? await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE) : await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)

  const lines = []
  const words = text.split(/\s+/)
  let line = ''
  for (let word of words) {
    const test = line ? line + ' ' + word : word
    if (Jimp.measureText(font, test) > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)

  const padding = 20
  const textHeight = lines.length * 70 
  const boxHeight = textHeight + padding
  const boxY = h - boxHeight - 20
  const box = new Jimp(w, boxHeight, color === 'white' ? 0x00000088 : 0xFFFFFF88)
  image.composite(box, 0, boxY)

  let y = boxY + 10
  for (let ln of lines) {
    const textW = Jimp.measureText(font, ln)
    const x = Math.floor((w - textW) / 2)
    image.print(font, x, y, ln)
    y += 70
  }
  return await image.getBufferAsync(Jimp.MIME_PNG)
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let txt = args.join(' ').trim()
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ''
  let buffer

  try {
    if (/webp|sticker/.test(mime)) {
      let img = await q.download()
      let out = await webp2png(img).catch(_ => null) || await uploadFile(img)
      const res = await fetch(out)
      buffer = Buffer.from(await res.arrayBuffer())
    } else if (/image|video/.test(mime)) {
      buffer = await q.download()
      if (/video/.test(mime) && txt) {
        let out = await webp2png(buffer).catch(_ => null) || await uploadFile(buffer)
        const res = await fetch(out)
        buffer = Buffer.from(await res.arrayBuffer())
      }
    } else if (args[0] && isUrl(args[0])) {
      const res = await fetch(args[0])
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      return conn.reply(m.chat, `📝 *Uso:* ${usedPrefix + command} [texto]`, m)
    }

    await m.react('🕓')

    if (txt) {
      const brightness = await averageBrightness(buffer)
      const color = brightness < 128 ? 'white' : 'black'
      buffer = await makeImageWithText(buffer, txt, color)
    }

    const stiker = await sticker(buffer, false, global.packname || 'Bot', global.author || 'Deylin')
    
    if (stiker) {
      await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
      await m.react('✅')
    }

  } catch (e) {
    console.error(e)
    await m.react('✖️')
    await conn.reply(m.chat, `⚠️ *Error:* ${e.message}`, m)
  }
}

handler.command = ['s', 'sticker']
export default handler
