const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3052;
const YT_DLP_PATH = path.join(__dirname, "yt-dlp");
const COOKIES_PATH = path.join(__dirname, "cookies.txt");

app.get("/get-direct-link", async (req, res) => {
    const { url, type } = req.query;
    if (!url) return res.status(400).json({ error: "URL requerida" });

    const isAudio = type === "mp3";
    const format = isAudio ? "bestaudio[ext=m4a]/bestaudio" : "best[ext=mp4]/best";

    const args = [
        "--no-warnings",
        "--dump-single-json",
        "--no-playlist",
        "-f", format,
        url
    ];

    if (fs.existsSync(COOKIES_PATH)) args.push("--cookies", COOKIES_PATH);

    const proc = spawn(YT_DLP_PATH, args);
    let stdout = "";

    proc.stdout.on("data", d => stdout += d.toString());
    proc.on("close", async (code) => {
        if (code !== 0) return res.status(500).json({ error: "Error yt-dlp" });

        try {
            const json = JSON.parse(stdout);
            const directUrl = json.url;

            if (directUrl.includes("manifest") || directUrl.includes(".m3u8")) {
                return res.json({
                    status: "proxy",
                    title: json.title,
                    thumbnail: json.thumbnail,
                    download_url: `http://185.16.39.160:3052/stream?url=${encodeURIComponent(url)}&type=${type}`
                });
            }

            res.json({
                status: "success",
                title: json.title,
                thumbnail: json.thumbnail,
                download_url: directUrl,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                    "Referer": "https://www.youtube.com/",
                    "Range": "bytes=0-"
                }
            });
        } catch (e) {
            res.status(500).json({ error: "JSON Error" });
        }
    });
});

app.get("/stream", (req, res) => {
    const { url, type } = req.query;
    const isAudio = type === "mp3";
    
    res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");
    
    const args = ["--no-warnings", "-o", "-", "-f", isAudio ? "bestaudio[ext=m4a]" : "best[ext=mp4]", url];
    if (fs.existsSync(COOKIES_PATH)) args.push("--cookies", COOKIES_PATH);

    const yt = spawn(YT_DLP_PATH, args);
    yt.stdout.pipe(res);
    req.on("close", () => yt.kill());
});

app.listen(PORT, "0.0.0.0");
