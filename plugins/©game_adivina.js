import fs from 'fs'

global.adivinaPalabra = global.adivinaPalabra || {}

let handler = async (m, { conn, command }) => {
  let textos = [
    { palabra: 'ALGORITMO', tema: 'Programación' },
    { palabra: 'SISTEMA', tema: 'Informática' },
    { palabra: 'WHATSAPP', tema: 'Aplicaciones' },
    { palabra: 'MICROSOFT', tema: 'Empresas' },
    { palabra: 'SERVIDOR', tema: 'Redes' },
    { palabra: 'VARIABLE', tema: 'Programación' },
    { palabra: 'PYTHON', tema: 'Lenguajes' },
    { palabra: 'JAVASCRIPT', tema: 'Lenguajes' }
  ]

  let juego = textos[Math.floor(Math.random() * textos.length)]
  let oculto = juego.palabra.replace(/[A-Z]/g, '*')

  let texto = `🧩 *ADIVINA LA PALABRA OCULTA*\n\n` +
    `🏷️ *Categoría:* ${juego.tema}\n` +
    `📖 *Palabra:* \`${oculto}\`\n` +
    `📏 *Letras:* ${juego.palabra.length}\n\n` +
    `📌 *Responde con la palabra completa citando este mensaje.*\n` +
    `⚠️ *Solo tienes 2 intentos.*`

  let enviado = await conn.reply(m.chat, texto, m)

  global.adivinaPalabra[m.sender] = {
    palabra: juego.palabra,
    intentos: 2,
    msgId: enviado.key.id
  }
}

handler.before = async function (m) {
  global.adivinaPalabra = global.adivinaPalabra || {}
  let juego = global.adivinaPalabra[m.sender]

  if (!juego || m.fromMe || !m.text) return
  if (!m.quoted || m.quoted.id !== juego.msgId) return

  let respuesta = m.text.trim().toUpperCase()

  if (respuesta === juego.palabra) {
    let expGanada = Math.floor(Math.random() * 80) + 50
    let coinsGanados = Math.floor(Math.random() * 20) + 10
    
    m.exp = (m.exp || 0) + expGanada
    m.bitcoins = (m.bitcoins || 0) + coinsGanados

    let winTxt = `✅ *¡BRUTAL!* Adivinaste la palabra difícil: *${juego.palabra}*\n\n`
    winTxt += `*Recompensa:*\n`
    winTxt += `+${expGanada} XP\n`
    winTxt += `+${coinsGanados} ₿ Bitcoins`

    delete global.adivinaPalabra[m.sender]
    return this.reply(m.chat, winTxt, m)

  } else {
    juego.intentos--
    if (juego.intentos <= 0) {
      let failTxt = `❌ *Fracasaste.* La palabra oculta era: *${juego.palabra}*\n\n`
      failTxt += `*Recompensa:* 0 XP / 0 ₿ Bitcoins`
      
      delete global.adivinaPalabra[m.sender]
      return this.reply(m.chat, failTxt, m)
    } else {
      await m.react('❌')
      return this.reply(m.chat, `❌ *Respuesta incorrecta.* Te queda *${juego.intentos}* último intento.`, m)
    }
  }
}

handler.command = /^(wordhard|adivinala|hardgame)$/i

export default handler
