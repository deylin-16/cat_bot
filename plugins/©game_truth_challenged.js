let games = {};

const preguntas = [
  "¿Cuál es tu mayor miedo?", "¿Quién es tu crush secreto?", "¿Qué es lo más vergonzoso que has hecho?",
  "¿Cuál fue tu última mentira?", "¿Has stalkeado a alguien aquí?", "¿Cuál ha sido tu peor cita?",
  "¿Tienes algún secreto que nadie sepa?", "¿Qué harías si fueras invisible por un día?",
  "¿Has fingido estar enfermo para no ir a clase/trabajo?", "¿Cuál es tu hábito más extraño?",
  "¿Alguna vez has mentido sobre tu edad?", "¿Has enviado un mensaje vergonzoso al contacto equivocado?",
  "¿Qué es lo más loco que harías por amor?", "¿Tienes algún apodo vergonzoso?",
  "¿Cuál es tu guilty pleasure?", "¿Has tenido un crush con alguien mucho mayor?",
  "¿Cuál es tu peor recuerdo escolar?", "¿Has robado algo alguna vez?",
  "¿Te has enamorado de alguien prohibido?", "¿Cuál es tu sueño más extraño?"
];

const retos = [
  "Cambia tu nombre en WhatsApp por algo gracioso durante 5 minutos.",
  "Envía un audio diciendo 'Soy el rey del grupo'.",
  "Haz 10 flexiones y grábalo.",
  "Escribe 'Te extraño ❤️' al último contacto en tu chat.",
  "Manda tu última foto en galería.",
  "Haz un TikTok improvisado y envíalo al grupo.",
  "Imita a tu celebridad favorita durante 30 segundos en audio.",
  "Cambia tu foto de perfil por una imagen divertida durante 10 minutos.",
  "Manda un mensaje romántico a un amigo elegido por el grupo.",
  "Haz una mini actuación fingiendo ser un animal durante 15 segundos en video.",
  "Baila la canción que el grupo elija y envía el video.",
  "Haz un dibujo rápido y envíalo como imagen.",
  "Escribe un poema ridículo de 4 líneas y envíalo al grupo.",
  "Haz 5 saltos de tijera y grábalo en video.",
  "Canta el coro de tu canción favorita en un audio.",
  "Envía un mensaje con emojis solo para expresar tu estado actual.",
  "Haz una imitación de algún miembro del grupo sin decir quién es.",
  "Manda un mensaje diciendo algo vergonzoso que hiciste recientemente.",
  "Haz una pose ridícula y envía la foto al grupo.",
  "Cuenta un chiste muy malo en un audio."
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const handler = async (m, { conn, command }) => {
  let id = m.chat;
  if (!games[id]) games[id] = { players: [], used: [], started: false, waiting: null };

  switch (command) {
    case "join":
      if (games[id].started) return m.reply("❌ El juego ya inició.");
      if (!games[id].players.includes(m.sender)) {
        games[id].players.push(m.sender);
        m.reply(`✅ @${m.sender.split("@")[0]} unido.`, null, { mentions: [m.sender] });
      } else m.reply("Ya estás en la lista.");
      break;

    case "leave":
      if (games[id].started) return m.reply("No puedes salir con la partida en curso.");
      games[id].players = games[id].players.filter(p => p !== m.sender);
      m.reply("🚪 Saliste del juego.");
      break;

    case "start":
      if (games[id].started) return m.reply("Ya hay una partida activa.");
      if (games[id].players.length < 2) return m.reply("⚠️ Mínimo 2 jugadores.");
      games[id].started = true;
      nextTurn(conn, id, m);
      break;

    case "stop":
      delete games[id];
      m.reply("🛑 Juego finalizado.");
      break;
  }
};

async function nextTurn(conn, id, m) {
  let game = games[id];
  if (!game || !game.started) return;

  if (game.used.length >= game.players.length) game.used = [];
  let candidates = game.players.filter(p => !game.used.includes(p));
  let chosen = pickRandom(candidates);
  game.used.push(chosen);

  let msg = await conn.sendMessage(id, {
    text: `👉 Turno de: @${chosen.split("@")[0]}\n\nResponde a este mensaje con: *Verdad* o *Reto*`,
    mentions: [chosen]
  });

  game.waiting = { 
    player: chosen, 
    stage: "choose", 
    msgId: msg.key.id 
  };
}

handler.before = async (m, { conn }) => {
  let id = m.chat;
  let game = games[id];

  if (!game || !game.started || !game.waiting) return;
  
  const isReply = m.quoted && m.quoted.id === game.waiting.msgId;
  const isPlayer = m.sender === game.waiting.player;

  if (!isReply || !isPlayer) return;

  if (game.waiting.stage === "choose") {
    let text = m.text?.toLowerCase().trim();
    if (text !== "verdad" && text !== "reto") return m.reply("⚠️ Opción inválida. Escribe *Verdad* o *Reto*.");

    let content = text === "verdad" ? pickRandom(preguntas) : pickRandom(retos);
    let msg = await conn.sendMessage(id, {
      text: `🎲 *${text.toUpperCase()}*\n\n${content}\n\nResponde a este mensaje con el cumplimiento (Texto, Imagen o Video).`,
      mentions: [game.waiting.player]
    }, { quoted: m });

    game.waiting.stage = "answer";
    game.waiting.msgId = msg.key.id;
    return;
  }

  if (game.waiting.stage === "answer") {
    const hasContent = m.text || m.mtype?.includes('image') || m.mtype?.includes('video') || m.mtype?.includes('audio');
    
    if (hasContent) {
      await conn.sendMessage(id, { text: "✅ ¡Excelente! Siguiente turno..." });
      game.waiting = null;
      setTimeout(() => nextTurn(conn, id, m), 2000);
    } else {
      m.reply("⚠️ Debes enviar tu respuesta o prueba del reto.");
    }
  }
};

handler.command = ["join", "leave", "start", "stop"];

export default handler;
