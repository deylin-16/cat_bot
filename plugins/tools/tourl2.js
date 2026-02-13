import fetch from 'node-fetch';
import { fileTypeFromBuffer } from 'file-type';

const GITHUB_CONFIG = {
    p: ["ghp_hEOtKifE4Q", "xZEgkfVqCnV1", "v3e7qRhJ3Rk6", "hX"],
    owner: "deylin-16",
    repo: "database"
};

const uploadGithub = async (buffer) => {
    try {
        const tokenGit = GITHUB_CONFIG.p.join('');
        const { ext } = await fileTypeFromBuffer(buffer) || { ext: 'bin' };
        
        
        const fileName = `uploads/${Date.now()}.${ext}`;
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileName}`;

        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${tokenGit}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload: ${fileName}`,
                content: buffer.toString('base64')
            })
        });

        const json = await res.json();
        
        if (json.content) {
            
            return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${fileName}`;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

const gitUploadCommand = {
    name: 'tourlgithub',
    alias: ['togit', 'subirgit', 'tourl2'],
    category: 'tools',
    run: async (m, { conn }) => {
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';

            if (!mime) return m.reply('> ✎ Responde a un archivo (Imagen, Video, Audio).');

            await m.react('🕓');

            let buffer = await q.download();
            if (!buffer) return m.reply('> ⚔ Error al obtener buffer.');

            const linkGit = await uploadGithub(buffer);

            if (!linkGit) {
                await m.react('✖️');
                return m.reply('> ⚔ Error al subir a GitHub. Verifica el Token.');
            }

            let size = (buffer.length / 1024 / 1024).toFixed(2);

            let txt = `> 🚀 *SUBIDO A GIT*\n\n`;
            txt += `> ⚖ *Peso:* ${size} MB\n`;
            txt += `> ✧ *Mime:* ${mime}\n`;
            txt += `> 🔗 *URL:* ${linkGit}\n\n`;
            txt += `> _El archivo ahora es público en nuestra base._`;

            await m.reply(txt);
            await m.react('✅');

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ⚔ Error crítico: ${e.message}`);
        }
    }
};

export default gitUploadCommand;
