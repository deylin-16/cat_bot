
import fetch from 'node-fetch';

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`🍪 Escribe una palabra para buscar en YouTube.\n\nEjemplo:\n*${command} gatos*`);

  try {
    const response = await fetch(`https://ytumode-api.vercel.app/api/search?q=${encodeURIComponent(text)}`);
    const data = await response.json();

    if (!data.status || !data.resultado || data.resultado.length === 0) {
      return m.reply(`❌ No se encontraron resultados para *${text}*.`);
    }

    const resultados = data.resultado.slice(0, 10); 

    let mensaje = `🔎 *Resultados de búsqueda para:* ${text}\n\n`;

    for (let i = 0; i < resultados.length; i++) {
      const vid = resultados[i];
      mensaje += `
╭─────────────
│🎬 *${vid.titulo}*
│📺 ${vid.canal}
│⏱️ ${vid.duracion} | 🕒 ${vid.publicado || "Fecha desconocida"}
│👁️ ${vid.vistas.toLocaleString()} vistas
│🔗 ${vid.url}
╰─────────────\n`;
    }

    conn.sendMessage(m.chat, { text: mensaje.trim() }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply(`❌ Error al buscar:\n${e.message}`);
  }
};

handler.command = ['ytsearch'];

export default handler;