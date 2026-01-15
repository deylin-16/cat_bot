import fs from 'fs'

global.adivinaPalabra = global.adivinaPalabra || {}

let handler = async (m, { conn, command }) => {
  let textos = [
    { palabra: 'CAMISETA', tema: 'Ropa', pista: 'C' },
    { palabra: 'MANZANA', tema: 'Fruta', pista: 'M' },
    { palabra: 'ZAPATO', tema: 'Calzado', pista: 'Z' },
    { palabra: 'ESPEJO', tema: 'Hogar', pista: 'E' },
    { palabra: 'MESA', tema: 'Muebles', pista: 'M' },
    { palabra: 'PERRO', tema: 'Animales', pista: 'P' },
    { palabra: 'GATO', tema: 'Animales', pista: 'G' },
    { palabra: 'PAN', tema: 'Comida', pista: 'P' },
    { palabra: 'PLATA', tema: 'Metales', pista: 'P' },
    { palabra: 'Silla', tema: 'Muebles', pista: 'S' },
    { palabra: 'LLAVE', tema: 'Objetos', pista: 'L' },
    { palabra: 'PELOTA', tema: 'Deportes', pista: 'P' },
    { palabra: 'VENTANA', tema: 'Hogar', pista: 'V' },
    { palabra: 'QUESO', tema: 'Comida', pista: 'Q' },
    { palabra: 'LIBRO', tema: 'Cultura', pista: 'L' },
    { palabra: 'MOCHILA', tema: 'Objetos', pista: 'M' },
    { palabra: 'RELOJ', tema: 'Accesorios', pista: 'R' },
    { palabra: 'COCHE', tema: 'Vehículos', pista: 'C' },
    { palabra: 'AVION', tema: 'Vehículos', pista: 'A' },
    { palabra: 'PIZZA', tema: 'Comida', pista: 'P' },
    { palabra: 'GUITARRA', tema: 'Música', pista: 'G' },
    { palabra: 'Cuchillo', tema: 'Cocina', pista: 'C' },
    { palabra: 'CUADERNO', tema: 'Papelería', pista: 'C' },
    { palabra: 'MARTILLO', tema: 'Herramientas', pista: 'M' },
    { palabra: 'DEDO', tema: 'Cuerpo', pista: 'D' }
  ]

  let juego = textos[Math.floor(Math.random() * textos.length)]
  let oculto = juego.palabra.replace(/[A-Z]/g, '*')

  let texto = `🧩 *ADIVINA LA PALABRA (FÁCIL)*\n\n` +
    `🏷️ *Categoría:* ${juego.tema}\n` +
    `📖 *Palabra:* \`${oculto}\`\n` +
    `💡 *Pista:* Empieza con "${juego.pista}"\n` +
    `📏 *Letras:* ${juego.palabra.length}\n\n` +
    `📌 *Responde citando este mensaje.*`

  let enviado = await conn.reply(m.chat, texto, m)

  global.adivinaPalabra[m.sender] = {
    palabra: juego.palabra.toUpperCase(),
    intentos: 2,
    msgId: enviado.key.id,
    fase: 'facil'
  }
}

handler.before = async function (m) {
  global.adivinaPalabra = global.adivinaPalabra || {}
  let juego = global.adivinaPalabra[m.sender]

  if (!juego || m.fromMe || !m.text) return
  if (!m.quoted || m.quoted.id !== juego.msgId) return

  let textos2 = [
    { palabra: 'ALGORITMO', tema: 'Programación' },
    { palabra: 'SISTEMAS', tema: 'Informática' },
    { palabra: 'CRIPTOGRAFIA', tema: 'Seguridad' },
    { palabra: 'ESTRUCTURA', tema: 'Ingeniería' },
    { palabra: 'MICROPROCESADOR', tema: 'Hardware' },
    { palabra: 'RECURSIVIDAD', tema: 'Lógica' },
    { palabra: 'POLIMORFISMO', tema: 'Programación' },
    { palabra: 'HIDRODINAMICA', tema: 'Ciencia' },
    { palabra: 'TERMODINAMICA', tema: 'Física' },
    { palabra: 'CONCATENACION', tema: 'Programación' },
    { palabra: 'ASTRONAUTICA', tema: 'Espacio' },
    { palabra: 'BIOTECNOLOGIA', tema: 'Ciencia' },
    { palabra: 'ESPECTROFOTOMETRIA', tema: 'Química' },
    { palabra: 'SINCROTRON', tema: 'Física' },
    { palabra: 'CIBERSEGURIDAD', tema: 'Tecnología' },
    { palabra: 'METAMORFOSIS', tema: 'Biología' },
    { palabra: 'PALEONTOLOGIA', tema: 'Ciencia' },
    { palabra: 'ESTOCASTICO', tema: 'Matemáticas' },
    { palabra: 'YUXTAPOSICION', tema: 'Gramática' },
    { palabra: 'PARALELISMO', tema: 'Informática' },
    { palabra: 'DESCENTRALIZADO', tema: 'Redes' },
    { palabra: 'VULNERABILIDAD', tema: 'Seguridad' },
    { palabra: 'INFRAESTRUCTURA', tema: 'Ingeniería' },
    { palabra: 'NEUROCIENCIA', tema: 'Medicina' },
    { palabra: 'ARQUITECTURA', tema: 'Construcción' }
  ]

  let respuesta = m.text.trim().toUpperCase()

  if (respuesta === juego.palabra) {
    let expGanada = juego.fase === 'facil' ? 50 : 200
    m.exp = (m.exp || 0) + expGanada

    let winTxt = `✅ *¡CORRECTO!* Adivinaste: *${juego.palabra}*\n\n`
    winTxt += `*Nivel:* ${juego.fase.toUpperCase()}\n`
    winTxt += `*Recompensa:* +${expGanada} XP`

    delete global.adivinaPalabra[m.sender]
    return this.reply(m.chat, winTxt, m)

  } else {
    juego.intentos--

    if (juego.intentos <= 0) {
      let failTxt = `❌ *GAME OVER.* No pudiste con el reto.\n`
      failTxt += `La palabra final era: *${juego.palabra}*`
      delete global.adivinaPalabra[m.sender]
      return this.reply(m.chat, failTxt, m)
    }

    if (juego.fase === 'facil') {
      let nuevoJuego = textos2[Math.floor(Math.random() * textos2.length)]
      let ocultoDificil = nuevoJuego.palabra.replace(/[A-Z]/g, '*')
      
      juego.palabra = nuevoJuego.palabra.toUpperCase()
      juego.fase = 'dificil'
      
      let tryTxt = `❌ *¡FALLASTE EL NIVEL FÁCIL!*\n\n`
      tryTxt += `🔥 *ULTIMÁTUM: NIVEL DIFÍCIL*\n`
      tryTxt += `🏷️ *Categoría:* ${nuevoJuego.tema}\n`
      tryTxt += `📖 *Palabra:* \`${ocultoDificil}\`\n`
      tryTxt += `🚫 *Pistas:* Desactivadas`
      
      await m.react('💀')
      return this.reply(m.chat, tryTxt, m)
    }
  }
}

handler.command = /^(wordhard|adivinala|hardgame)$/i

export default handler
