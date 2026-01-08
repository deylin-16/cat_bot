import fs from 'fs'

let handler = async (m, { conn }) => {
    conn.trivia = conn.trivia ? conn.trivia : {}
    if (conn.trivia[m.chat]) return

    let db = JSON.parse(fs.readFileSync('./db/trivia.json'))
    let list = db.sort(() => 0.5 - Math.random()).slice(0, 3)

    conn.trivia[m.chat] = {
        pos: 0,
        list,
        score: 0,
        msg: null
    }

    await nextQ(conn, m)
}

async function nextQ(conn, m) {
    if (!conn.trivia || !conn.trivia[m.chat]) return
    let t = conn.trivia[m.chat]
    let q = t.list[t.pos]
    
    let txt = `*PREGUNTA ${t.pos + 1}/3*\n\n`
    txt += `*${q.pregunta}*\n\n`
    txt += q.opciones.map((v, i) => `${i + 1}. ${v}`).join('\n')
    
    t.msg = await conn.reply(m.chat, txt, m)
}

handler.before = async function (m) {
    if (!this.trivia || !this.trivia[m.chat] || !m.text) return

    let t = this.trivia[m.chat]
    let cur = t.list[t.pos]

    let choices = cur.opciones.map(v => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    let answer = m.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    let correct = cur.respuesta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    let isNumber = !isNaN(m.text) && choices[parseInt(m.text) - 1] === correct
    let isText = answer === correct

    if (isNumber || isText) t.score++

    if (m.quoted && m.quoted.id === t.msg.id || isNumber || isText) {
        t.pos++
        
        if (t.pos < 3) {
            return nextQ(this, m)
        } else {
            let randomXp = Math.floor(Math.random() * 100) + 1
            let randomCoins = Math.floor(Math.random() * 100) + 1
            
            if (t.score > 0) {
                m.exp = randomXp * t.score
                m.bitcoins = randomCoins * t.score
            }

            let finalTxt = `*TRIVIA FINALIZADA*\n\n`
            finalTxt += `*Aciertos:* ${t.score}/3\n`
            finalTxt += `*Recompensa Total:*\n`
            finalTxt += `+${m.exp || 0} XP\n`
            finalTxt += `+${m.bitcoins || 0} ₿ Bitcoins`
            
            await m.reply(finalTxt)
            delete this.trivia[m.chat]
        }
    }
}

handler.command = /^(trivia|triv)$/i
export default handler
