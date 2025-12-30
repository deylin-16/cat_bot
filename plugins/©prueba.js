import fetch from 'node-fetch'

let handler = async (m, { args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`👻 Uso correcto: 
${usedPrefix + command} <link_post> <emoji1,emoji2,emoji3,emoji4>

Ejemplo: 
${usedPrefix + command} https://whatsapp.com/channel/0029VbArz9fAO7RGy2915k3O/779 😨,🤣,👾,😳`)
  }

  await m.react('🕒')

  try {
    const parts = args.join(' ').split(' ')
    const postLink = parts[0]
    const reacts = parts.slice(1).join(' ')

    if (!postLink || !reacts)
      return m.reply(`🐢 Formato incorrecto. Uso: ${usedPrefix + command} <link> <emoji1,emoji2,emoji3,emoji4>`)

    const emojiArray = reacts.split(',').map(e => e.trim()).filter(e => e)
    const apiKey = '9bdfe7382722555ec9f6eddafcf6144fed413a82f1c22a30659c45ae1b398bcc' 

    const requestData = {
      post_link: postLink,
      reacts: emojiArray.join(',')
    }

    // Enviamos la KEY tanto en URL (como parámetro) como en Header (como Bearer)
    const url = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // Esto es lo que pide la web
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://asitha.top/'
      },
      body: JSON.stringify(requestData)
    })

    const result = await response.json()

    if (response.ok && (result?.status === true || result?.message === 'Success')) {
      await m.react('✅')
      await m.reply('✅ Reacciones enviadas con éxito.')
    } else {
      await m.react('❌')
      // Capturamos el error real para diagnóstico
      let errorDetalle = result?.message || result?.error || JSON.stringify(result)
      
      await m.reply(`❌ **FALLO DE AUTORIZACIÓN** ❌\n\n**Mensaje de la API:** ${errorDetalle}\n\n**Sugerencia:** Si el error persiste sobre "Fresh Token", debes entrar a asitha.top y generar una clave nueva (Website Token), ya que las permanentes están desactivadas para esta función.`)
    }
  } catch (e) {
    console.error(e)
    await m.react('❌')
    await m.reply(`❌ **Error de sistema:** ${e.message}`)
  }
}

handler.help = ['react']
handler.tags = ['tools']
handler.command = ['react']

export default handler
