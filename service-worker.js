const CACHE_NAME = "Smartbook-v4";

// Fichiers statiques + tous les MP3
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./Smartbook.html",
  "./lecteur.html",
  "./manifest.json",
  "./logo-icon-192.png",
  "./logo-icon-512.png",
  "./Couverture_resized.jpg",
  "./PLANCHE-1a.jpg",
  "./Logo_resized.jpg",
  "./lecteur.js",
  "./style.css",
  "./plyr.css",
  "./plyr.polyfilled.js",


  // 🎧 Toutes les pistes audio (à compléter avec les tiennes)
  "./Introduction.mp3",
  "./Chapitre1-1.mp3",
  "./Chapitre1-2.mp3",
  "./Chapitre1-3.mp3",
  "./Chapitre2-1.mp3",
  "./Chapitre2-2.mp3",
  "./Chapitre2-3.mp3",
  "./Chapitre3-1.mp3",
  "./Chapitre3-2.mp3",
  "./Chapitre3-3.mp3",
  "./Chapitre4-1.mp3",
  "./Chapitre4-2.mp3",
  "./Chapitre4-3.mp3",
  "./Chapitre5-1.mp3",
  "./Chapitre5-2.mp3",
  "./Chapitre5-3.mp3",
  "./Chapitre6-1.mp3",
  "./Chapitre6-2.mp3",
  "./Chapitre6-3.mp3",
  "./Chapitre7-1.mp3",
  "./Chapitre7-2.mp3",
  "./Chapitre7-3.mp3",
  "./Chapitre8-1.mp3",
  "./Chapitre8-2.mp3",
  "./Chapitre8-3.mp3",
  "./Conclusion.mp3",

  // PDF annexes
  "./Annexes.pdf",
  "./mentions_legales.pdf"
];

// 📦 INSTALLATION : tout mettre en cache
self.addEventListener("install", (event) => {
  console.log("📦 Mise en cache initiale de tous les fichiers…");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 🧹 ACTIVATION : nettoyer les anciens caches
self.addEventListener("activate", (event) => {
  console.log("⚙️ Activation du service worker…");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 🌍 FETCH : cache d’abord, sinon réseau
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
