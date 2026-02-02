import axios from 'axios';
import FormData from 'form-data';

const aimgCommand = {
    name: 'aimg',
    alias: ['iaimg', 'imgg', 'genimg'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: `*✎ Agrega un texto para generar la imagen con 𝗜𝗔 𝗖𝗔𝗧 𝗕𝗢𝗧*` }, { quoted: m });

        await m.react('⏳');

        const setup = {
            cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
            shiftValue: 3,
            dec(text, shift) {
                return [...text].map(c => /[a-z]/.test(c)
                    ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
                    : /[A-Z]/.test(c)
                        ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
                        : c).join('');
            }
        };

        try {
            const token = setup.dec(setup.cipher, setup.shiftValue);
            const headers = {
                'user-agent': 'NB Android/1.0.0',
                'accept-encoding': 'gzip',
                'content-type': 'application/json',
                'authorization': token
            };

            const form = new FormData();
            form.append('prompt', text);
            form.append('token', token);

            const res = await axios.post('https://text2video.aritek.app/text2img', form, { 
                headers: { ...headers, ...form.getHeaders() } 
            });

            const { code, url: imageUrl } = res.data;

            if (code !== 0 || !imageUrl) throw new Error();

            const response = await axios.get(imageUrl.trim(), { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');

            await conn.sendMessage(m.chat, {
                image: imageBuffer,
                caption: `>  *♛ Imagen generada con éxito 𝗜𝗔 𝗖𝗔𝗧 𝗕𝗢𝗧*`
            }, { quoted: m });

            await m.react('✅');

        } catch (err) {
            await m.react('❌');
            console.error(err);
        }
    }
};

export default aimgCommand;
