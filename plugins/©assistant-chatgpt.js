import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return global.design(conn, m, ` ¡Hola! ¿cómo puedo ayudarte hoy?`);
  }
    await m.react('✨')

  try {
    const url = `${url_api}/api/ai/text/chatgpt?q=${encodeURIComponent(text)}&apikey=by_deylin`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.response) {
      return global.design(conn, m, "❌ No recibí respuesta de la IA, intenta de nuevo.");
    }
    await m.react('🌟')
    await global.design(conn, m, `${data.response}`);
  } catch (e) {
    console.error(e);
    await global.design(conn, m, "⚠️ Hubo un error al conectar con la IA.");
  }
};

handler.command =['ia']

export default handler;