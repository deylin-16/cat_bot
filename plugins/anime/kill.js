import axios from 'axios'

const reaction = {
    emoji: '☠️',
    txt_solo: '> ❒ @user1 se intentó matar a todos los integrantes del grupo... ☠️',
    txt_mencion: '> ❏ @user1 mato a @user2 ☠️',
    links: [
'https://media.tenor.com/WU4sP7m_FD8AAAPo/anime.mp4',
'https://media.tenor.com/Ce8ZMfAcjdoAAAPo/anime.mp4',
'https://media.tenor.com/KfyGv-4RtGYAAAPo/anime-reality.mp4',
'https://media.tenor.com/cc1EzfBVr4oAAAPo/yandere-tagged.mp4',
'https://media.tenor.com/adQHri2oFZ8AAAPo/mitsuha-miyamizu-sayaka-natori.mp4',
'https://media.tenor.com/5seqBijq-pUAAAPo/kill-la-kill-sakuga.mp4'
]
}

const kill = {
    name: 'kill',
    alias: ['kill', 'matar'],
    category: 'interacciones',
    run: async (m, { conn }) => {
        if (!reaction.links.length) return
        const user1 = m.sender
        const user2 = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        const name1 = '@' + user1.split('@')[0]
        const menciones = [user1]
        let textoFinal = ''
        if (user2) {
            menciones.push(user2)
            const name2 = '@' + user2.split('@')[0]
            textoFinal = reaction.txt_mencion.replace(/@user1/g, name1).replace(/@user2/g, name2)
        } else {
            textoFinal = reaction.txt_solo.replace(/@user1/g, name1)
        }
        try {
            if (m.react) await m.react(reaction.emoji)
            const videoUrl = reaction.links[Math.floor(Math.random() * reaction.links.length)]
            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: textoFinal,
                gifPlayback: true,
                mentions: menciones
            }, { quoted: m })
        } catch (e) {
            console.error(e)
        }
    }
}

export default kill