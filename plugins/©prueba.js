import os from 'os'
import { execSync } from 'child_process'

let handler = async (m, { conn }) => {
  try {

    let uptimeMs = process.uptime() * 1000
    let h = Math.floor(uptimeMs / 3600000)
    let mnt = Math.floor((uptimeMs % 3600000) / 60000)
    let s = Math.floor((uptimeMs % 60000) / 1000)
    let uptimeStr = `${h}h ${mnt}m ${s}s`


    let totalMem = os.totalmem()
    let freeMem = os.freemem()
    let usedMem = totalMem - freeMem
    let memPercent = ((usedMem / totalMem) * 100).toFixed(2)


    const progressBar = (percent, max = 100) => {
      let bars = 20
      let filled = Math.round((percent / max) * bars)
      let empty = bars - filled
      return '█'.repeat(filled) + '░'.repeat(empty)
    }


    const cpus = os.cpus()
    let totalLoad = 0
    for (let cpu of cpus) {
      const times = cpu.times
      const load = ((times.user + times.nice + times.sys) /
        (times.user + times.nice + times.sys + times.idle)) * 100
      totalLoad += load
    }
    const cpuCores = cpus.length
    const cpuActual = totalLoad.toFixed(2)
    const cpuMax = cpuCores * 100 // 
    const cpuBar = progressBar(cpuActual, cpuMax)


    const cpuModel = cpus[0].model
    const cpuSpeed = cpus[0].speed


    let diskUsed = 0, diskTotal = 0
    try {
      const df = execSync('df -BG /').toString().split('\n')[1]
      diskTotal = parseInt(df.split(/\s+/)[1].replace('G',''))
      diskUsed = parseInt(df.split(/\s+/)[2].replace('G',''))
    } catch(e) {
      diskUsed = 0
      diskTotal = 0
    }
    const diskPercent = ((diskUsed / diskTotal) * 100).toFixed(2)
    const diskBar = progressBar(diskPercent, 100)


    const msg = `
⏱ *Uptime:* ${uptimeStr}

💻 *Sistema:* ${os.platform()} ${os.arch()}
🖥 *CPU:* ${cpuModel} @ ${cpuSpeed}MHz
${cpuBar} ${cpuActual}% / ${cpuMax}% CPU Usage

🗄 *RAM:* ${(usedMem / 1024 / 1024).toFixed(2)}MB / ${(totalMem / 1024 / 1024).toFixed(2)}MB
${progressBar(memPercent)} ${memPercent}% RAM usada

💽 *Disco:* ${diskUsed} GiB / ${diskTotal} GiB
${diskBar} ${diskPercent}% Disk Usage

🟢 *Estado del bot:* Online
`

    conn.reply(m.chat, msg, m)
  } catch (e) {
    conn.reply(m.chat, `❌ Error al obtener el uptime: ${e}`, m)
  }
}

handler.help = ['uptime', 'estado']
handler.tags = ['info']
handler.command = ['uptime','estado']

export default handler