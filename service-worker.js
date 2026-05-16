const CACHE = "rechnungsapp-v6";

const urls = [
"./",
"index.html",
"style.css",
"app.js",
"manifest.json",
"assets/fussnote.svg",
"icons/icon.svg"
];

self.addEventListener("install", e=>{
e.waitUntil(
caches.open(CACHE).then(cache=>cache.addAll(urls))
);
});

self.addEventListener("fetch", e=>{
e.respondWith(
caches.match(e.request).then(r=>r || fetch(e.request))
);
});
