import axios from 'axios';
import FormData from 'form-data';

const aimgCommand = {
    name: 'aimg',
    alias: ['iaimg', 'imgg', 'genimg'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: `*✎ Agrega un texto para generar la imagen con 𝗜𝗔 𝗖𝗔𝗧 𝗕𝗢𝗧*` }, { quoted: m });

        await m.react('⏳');

        try {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'; 
            const form = new FormData();
            form.append('prompt', text);
            form.append('token', token);

            const { data } = await axios.post('https://text2video.aritek.app/text2img', form, {
                headers: {
                    'user-agent': 'NB Android/1.0.0',
                    'authorization': token,
                    ...form.getHeaders()
                }
            });

            if (data.code !== 0 || !data.url) throw new Error();

            const imageRes = await axios.get(data.url.trim(), { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageRes.data, 'binary');

            await conn.sendMessage(m.chat, {
                image: buffer,
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
