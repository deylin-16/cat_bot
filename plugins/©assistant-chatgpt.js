import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, ` ¡Hola! ¿cómo puedo ayudarte hoy?`, m);
  }
    await m.react('✨')

  try {
    const url = `${url_api}/api/ai/text/chatgpt?q=${encodeURIComponent(text)}&apikey=by_deylin`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.response) {
      return conn.reply(m.chat, "❌ No recibí respuesta de la IA, intenta de nuevo.", m);
    }
    await m.react('🌟')
    await conn.reply(m.chat, `${data.response}`, m);
  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, "⚠️ Hubo un error al conectar con la IA.", m);
  }
};

handler.command =['ia']

export default handler;