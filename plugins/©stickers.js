import { sticker } from '../lib/sticker.js'
import Jimp from 'jimp'
import fetch from 'node-fetch'

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
  } catch { return 100 }
}

const makeImageWithText = async (buffer, text, color) => {
  const image = await Jimp.read(buffer)
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
      lines.push(line); line = word
    } else line = test
  }
  if (line) lines.push(line)

  const padding = 20
  const textHeight = lines.length * (Jimp.measureTextHeight(font, 'M', maxWidth) + 20)
  const boxHeight = textHeight + padding * 2
  const boxY = h - boxHeight - 20
  
  const box = new Jimp(w, boxHeight, color === 'white' ? 0x00000088 : 0xFFFFFF88)
  image.composite(box, 0, boxY)
  
  let y = boxY + padding
  for (let ln of lines) {
    const textW = Jimp.measureText(font, ln)
    image.print(font, Math.floor((w - textW) / 2), y, ln)
    y += Jimp.measureTextHeight(font, ln, maxWidth) + 20
  }
  return await image.getBufferAsync(Jimp.MIME_PNG)
}

let handler = async (m, { conn, args }) => {
  try {
    let txt = args.join(' ').trim()
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    let buffer

    if (/image|sticker|video|gif/.test(mime) || (m.quoted && /sticker/.test(q.mtype))) {
      buffer = await q.download()
    } else if (args[0] && isUrl(args[0])) {
      const res = await fetch(args[0])
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      return m.reply('*⚠️ Responde a una imagen, video o gif*')
    }

    if (!buffer) return
    await m.react('🕓')

    let finalBuffer = buffer
    if (txt && /image/.test(mime) && !/gif|video/.test(mime)) {
       try {
          const brightness = await averageBrightness(buffer)
          finalBuffer = await makeImageWithText(buffer, txt, brightness < 128 ? 'white' : 'black')
       } catch (e) { console.error(e) }
    }

    const stiker = await sticker(finalBuffer, false, 'Deylin-Bot', m.pushName || 'User')

    if (stiker) {
        await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m, linkPreview: false })
        await m.react('✅')
    }
  } catch (e) {
    await m.react('✖️')
    console.error(e)
  }
}

handler.command = ['s', 'sticker']
export default handler
