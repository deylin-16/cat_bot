import ws from 'ws';

let handler = async (m, { conn: _envio, usedPrefix }) => {
  const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];

  function convertirMs(ms) {
    var segundos = Math.floor(ms / 1000);
    var minutos = Math.floor(segundos / 60);
    var horas = Math.floor(minutos / 60);
    var días = Math.floor(horas / 24);
    segundos %= 60;
    minutos %= 60;
    horas %= 24;
    var resultado = "";
    if (días !== 0) resultado += días + "d ";
    if (horas !== 0) resultado += horas + "h ";
    if (minutos !== 0) resultado += minutos + "m ";
    if (segundos !== 0) resultado += segundos + "s";
    return resultado.trim();
  }

  const message = users.map((v, i) => 
`[ #${i + 1} ]
• Nombre: ${v.user.name || 'Asistente'}
• Enlace: wa.me/${v.user.jid.replace(/[^0-9]/g, '')}
• Tiempo: ${v.uptime ? convertirMs(Date.now() - v.uptime) : '---'}`).join('\n\n');

  const responseMessage = `*LISTA DE VINCULACIÓNES*\n\nConectados: ${users.length}\n\n${message || 'No hay conexiones activas.'}`.trim();

  await _envio.sendMessage(m.chat, { text: responseMessage, mentions: _envio.parseMention(responseMessage) }, { quoted: m })
}


handler.command = ['bots']

export default handler