import axios from 'axios'

const reaction = {
    emoji: '☕',
    txt_solo: '> ❒ @user1 está tomando café....',
    txt_mencion: '> ❏ @user1 le invito un café a @user2 ☕',
    links: [
'https://media.tenor.com/MpCcg8u5LlAAAAPo/yui-hirasawa-k-on.mp4',
'https://media.tenor.com/6pMSj_Ulci4AAAPo/cream-tea.mp4',
'https://media.tenor.com/Ny0Es5mpN5MAAAPo/coffee-ashita-no-joe.mp4',
'https://media.tenor.com/mLofbKJoHzYAAAPo/kirby-kirby-right-back-at-ya.mp4',
'https://media.tenor.com/-FuVAsEDlZcAAAPo/aesthetic-coffee.mp4',
'https://media.tenor.com/YlOvlmcMs-0AAAPo/cat-anime.mp4'
]
}

const coffee = {
    name: 'coffee',
    alias: ['coffee', 'cafe'],
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

export default coffee