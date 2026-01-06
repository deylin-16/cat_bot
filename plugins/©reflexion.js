import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mensajesUsados = []

let handler = async (m, { conn }) => {
  try {
    const mensajesPath = path.join(__dirname, '../db/reflexion.json')
    const rawData = fs.readFileSync(mensajesPath, 'utf-8')
    const data = JSON.parse(rawData)
    const mensajes = data.mensajes

    if (mensajesUsados.length >= mensajes.length) {
      mensajesUsados = []
    }

    const mensajesDisponibles = mensajes.filter(msg => !mensajesUsados.includes(msg))
    const mensaje = mensajesDisponibles[Math.floor(Math.random() * mensajesDisponibles.length)]

    mensajesUsados.push(mensaje)

    await conn.reply(m.chat, `🌟 *Mensaje para ti:*\n\n"${mensaje}"`, m)
  } catch (e) {
    await conn.reply(m.chat, `⚠️ Ocurrió un error al leer los mensajes.\n${e.message}`, m)
    console.error(e)
  }
}

handler.command = ['motivacion', 'consejo', 'reflexion', 'superación']

export default handler