import { promises } from 'fs'
import { join, dirname } from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      let tmp = join(__dirname, '../tmp', + new Date + '.' + ext)
      let out = tmp + '.' + ext2
      await promises.writeFile(tmp, buffer)
      spawn('ffmpeg', [
        '-y',
        '-i', tmp,
        ...args,
        out
      ])
        .on('error', reject)
        .on('close', async (code) => {
          try {
            await promises.unlink(tmp)
            if (code !== 0) return reject(code)
            resolve({
              data: await promises.readFile(out),
              filename: out,
              delete() {
                return promises.unlink(out)
              }
            })
          } catch (e) {
            reject(e)
          }
        })
    } catch (e) {
      reject(e)
    }
  })
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-ar', '48000', 
    '-f', 'ogg'     
  ], ext, 'ogg')
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus')
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ab', '64k',
    '-ar', '44100',
    '-crf', '35',
    '-preset', 'ultrafast',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=12',
    '-t', '7'
  ], ext, 'mp4')
}

export { toAudio, toPTT, toVideo, ffmpeg }
