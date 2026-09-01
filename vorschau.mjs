/**
 * Winziger Dateiserver für die lokale Vorschau von `docs/`.
 *
 * Gehört nicht zur Website — GitHub Pages liefert die Dateien selbst aus. Er
 * existiert, weil `python3 -m http.server` in dieser Umgebung nicht startet:
 * der Prozess beginnt in einem Verzeichnis ohne Leserecht und scheitert schon
 * an `getcwd`. Node über den absoluten Pfad umgeht das.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), 'docs')
const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.js': 'text/javascript' }

createServer(async (anfrage, antwort) => {
  const pfad = decodeURIComponent(new URL(anfrage.url, 'http://x').pathname)
  const datei = join(WURZEL, normalize(pfad === '/' ? '/index.html' : pfad))
  if (!datei.startsWith(WURZEL)) {
    antwort.writeHead(403).end('verboten')
    return
  }
  try {
    const inhalt = await readFile(datei)
    antwort.writeHead(200, { 'content-type': TYPEN[extname(datei)] ?? 'application/octet-stream' }).end(inhalt)
  } catch {
    antwort.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('nicht gefunden')
  }
}).listen(5191, '127.0.0.1', () => console.log('Vorschau auf http://localhost:5191'))
