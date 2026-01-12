let games = {};

const preguntas = [
  "¿Cuál es tu mayor miedo?",
  "¿Quién es tu crush secreto?",
  "¿Qué es lo más vergonzoso que has hecho?",
  "¿Cuál fue tu última mentira?",
  "¿Has stalkeado a alguien aquí?",
  "¿Cuál ha sido tu peor cita?",
  "¿Tienes algún secreto que nadie sepa?",
  "¿Qué harías si fueras invisible por un día?",
  "¿Has fingido estar enfermo para no ir a clase/trabajo?",
  "¿Cuál es tu hábito más extraño?",
  "¿Alguna vez has mentido sobre tu edad?",
  "¿Has enviado un mensaje vergonzoso al contacto equivocado?",
  "¿Qué es lo más loco que harías por amor?",
  "¿Tienes algún apodo vergonzoso?",
  "¿Cuál es tu guilty pleasure?",
  "¿Has tenido un crush con alguien mucho mayor?",
  "¿Cuál es tu peor recuerdo escolar?",
  "¿Has robado algo alguna vez?",
  "¿Te has enamorado de alguien prohibido?",
  "¿Cuál es tu sueño más extraño?"
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
  games[id] = games[id] || { players: [], used: [], started: false, waiting: null };

  switch (command) {
    case "join":
      if (!games[id].players.includes(m.sender)) {
        games[id].players.push(m.sender);
        m.reply(`✅ ${conn.getName(m.sender)} se unió al juego. (${games[id].players.length} jugadores)`);
      } else m.reply("Ya estás dentro.");
      break;

    case "leave":
      if (games[id].players.includes(m.sender)) {
        games[id].players = games[id].players.filter(p => p !== m.sender);
        m.reply(`🚪 ${conn.getName(m.sender)} salió de la partida.`);
      } else m.reply("No estás en la partida.");
      break;

    case "start":
      if (games[id].started) return m.reply("Ya hay una partida en curso.");
      if (games[id].players.length < 2) return m.reply("⚠️ Necesitan al menos 2 jugadores.");
      games[id].started = true;
      games[id].used = [];
      let list = games[id].players.map(p => `• @${p.split("@")[0]}`).join("\n");
      await conn.sendMessage(id, {
        text: `🎉 *¡La partida de VERDAD O RETO ha comenzado!*\n\n👥 Jugadores inscritos:\n${list}\n\n📌 Reglas:\n1. El bot elegirá a un jugador al azar.\n2. Ese jugador debe responder al mensaje del bot con *Verdad* o *Reto*.\n3. Luego el bot dará una pregunta o reto que debes contestar con TEXTO, IMAGEN o VIDEO.\n4. Una vez respondido, el turno pasa a otro jugador al azar.\n\n❌ Usa *.leave* para salir.\n🛑 Usa *.stop* para terminar la partida.\n\n¡Que empiece el juego!`,
        mentions: games[id].players
      });
      nextTurn(conn, id, m);
      break;

    case "stop":
      if (!games[id].started) return m.reply("No hay ninguna partida activa.");
      delete games[id];
      m.reply("🛑 La partida fue detenida.");
      break;
  }
};

async function nextTurn(conn, id, m) {
  let game = games[id];
  if (!game) return;
  if (game.players.length < 2) {
    delete games[id];
    await conn.sendMessage(id, { text: "⚠️ No hay suficientes jugadores para continuar. La partida terminó." });
    return;
  }
  if (game.used.length >= game.players.length) game.used = [];
  let candidates = game.players.filter(p => !game.used.includes(p));
  let chosen = pickRandom(candidates);
  game.used.push(chosen);
  let msg = await conn.sendMessage(id, {
    text: `👉 Turno de @${chosen.split("@")[0]}.\nResponde *Verdad* o *Reto* a este mensaje.`,
    mentions: [chosen]
  }, { quoted: m });
  game.waiting = { player: chosen, stage: "choose", msgId: msg.id };
}

handler.before = async (m, { conn }) => {
  let id = m.chat;
  let game = games[id];
  if (!game?.started || !game.waiting) return;
  if (!m.quoted || m.quoted.id !== game.waiting.msgId) return;
  if (m.sender !== game.waiting.player) return;

  if (game.waiting.stage === "choose") {
    if (!m.text) return m.reply("Responde solo con *Verdad* o *Reto*.");
    let choice = m.text.toLowerCase();
    if (choice !== "verdad" && choice !== "reto") return m.reply("Responde solo con *Verdad* o *Reto*.");
    let content = choice === "verdad" ? pickRandom(preguntas) : pickRandom(retos);
    let msg = await conn.sendMessage(id, {
      text: `🎲 *${choice.toUpperCase()}*\n${content}\n\n👉 Responde a este mensaje con tu respuesta (TEXTO, IMAGEN o VIDEO).`,
      mentions: [game.player]
    }, { quoted: m });
    game.waiting = { player: m.sender, stage: "answer", msgId: msg.id };
    return;
  }

  if (game.waiting.stage === "answer") {
    if (!(m.text || m.imageMessage || m.videoMessage)) return m.reply("⚠️ Debes responder con TEXTO, IMAGEN o VIDEO.");
    game.waiting = null;
    nextTurn(conn, id, m);
  }
};

handler.command = ["join", "leave", "start", "stop"];

export default handler;