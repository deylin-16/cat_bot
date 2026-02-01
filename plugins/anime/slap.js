import axios from 'axios'

const reaction = {
    emoji: '🫲',
    txt_solo: '> ❒ @user1 se dió una Bofetada a si mismo/a...',
    txt_mencion: '> ❏ @user1 le dio una Bofetada a @user2 🫲',
    links: [
'https://media.tenor.com/wOCOTBGZJyEAAAPo/chikku-neesan-girl-hit-wall.mp4',
'https://media.tenor.com/Ws6Dm1ZW_vMAAAPo/girl-slap.mp4',
'https://media.tenor.com/XiYuU9h44-AAAAPo/anime-slap-mad.mp4',
'https://media.tenor.com/6K-2Qflhb4IAAAPo/barakamon-kid.mp4',
'https://media.tenor.com/s8rSKVbvcZUAAAPo/anime-anime-slap.mp4',
'https://media.tenor.com/awwbHH-cEB4AAAPo/slap-angry.mp4'
]
}

const slap = {
    name: 'slap',
    alias: ['slap', 'bofetada'],
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

export default slap