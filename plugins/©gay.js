import fetch from "node-fetch";

const handler = async (m, { conn }) => {
  try {

    let who;
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      who = m.mentionedJid[0]; 
    } else if (m.quoted) {
      who = m.quoted.sender; 
    } else {
      who = m.sender; 
    }


    const avatarUrl = await conn.profilePictureUrl(who, "image").catch(
      () => "https://telegra.ph/file/24fa902ead26340f3df2c.png"
    );


    const processedImageUrl = `https://canvas-8zhi.onrender.com/api/gay?profile=${encodeURIComponent(avatarUrl)}`;

        await m.react('🏳️‍🌈')
    await m.react('🌈')
await m.react('🏳️‍🌈')
    const frases = [
  "🏳️‍🌈 La ciencia lo confirma: ha nacido una verdadera icône de la comunidad.",
  "🌈 El universo ha hablado… y dijo: energía gay detectada con mucho encanto.",
  "💫 Las estrellas brillan más fuerte cuando esta persona aparece.",
  "✨ La NASA lo aprueba: el aura más luminosa y carismática del sistema solar.",
  "⚡ No es un bug, es pura inteligencia artificial llena de color y corazón.",
  "🌈 Bendecido con elegancia, estilo y mucha alegría.",
  "💎 Nivel de estilo detectado: fuera de serie. Carisma por las nubes.",
  "🔥 Cuando pasa el arcoíris, hasta él se queda mirando con admiración.",
  "🌟 La IA ha decidido: presencia radiante y llena de calidez.",
  "👑 Una figura inspiradora y querida de la comunidad ha llegado."
];

    const randomFrase = frases[Math.floor(Math.random() * frases.length)];


    await conn.sendMessage(
      m.chat,
      {
        image: { url: processedImageUrl },
        caption: randomFrase
      },
      { quoted: m }
    );
  } catch (e) {
    m.reply(`⚠️ Ocurrió un error al procesar la imagen gay 😭\nError: ${e.message}`);
  }
};


handler.command = ["marica", "gay", "gey"];

export default handler;