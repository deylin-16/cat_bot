import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const handler = async (m, { conn }) => {
  await m.react("🧹");
  
  try {
    let report = "✨ *Limpieza de Servidor Realizada*\n\n";

    // 1. Limpiar carpeta de descargas (downloads)
    const downloadsPath = path.join(process.cwd(), "downloads");
    if (fs.existsSync(downloadsPath)) {
      const files = fs.readdirSync(downloadsPath);
      files.forEach(file => {
        fs.unlinkSync(path.join(downloadsPath, file));
      });
      report += `🗑️ *Downloads:* ${files.length} archivos eliminados.\n`;
    }

    // 2. Limpiar archivos temporales de sesiones de sub-bots (.tmp, auth_info antiguos)
    // Nota: Esto busca carpetas temporales comunes en bots de WhatsApp
    exec("rm -rf tmp/* && rm -rf sessions/*/baileys_store.json", (err) => {
      if (!err) console.log("Temporales de sub-bots limpiados.");
    });
    report += `📁 *Sesiones:* Archivos basura de sub-bots eliminados.\n`;

    // 3. Forzar liberación de RAM
    if (global.gc) {
      global.gc();
      report += `🧠 *RAM:* Memoria caché liberada con éxito.\n`;
    } else {
      report += `⚠️ *RAM:* Optimización limitada (inicia con --expose-gc).\n`;
    }

    await conn.reply(m.chat, report, m);
    await m.react("✅");

  } catch (error) {
    console.error(error);
    await m.react("❌");
    m.reply("⚠️ Error durante la limpieza: " + error.message);
  }
};

handler.command = /^(clean|limpiar|borrartodo)$/i;
handler.rowner = true; // Solo tú puedes usarlo para evitar que apaguen el bot por error
export default handler;
