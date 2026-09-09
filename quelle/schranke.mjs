/**
 * **Die Schranke** (04.09.): Bis zum App-Start ist die Website nur mit
 * Passwort zugänglich — als „Coming Soon"-Tor, Entwurf W1/M1 aus
 * mockups-comingsoon.html (nur Logo, Name, Eingabe, Kulisse; null Infos).
 *
 * **Verschlüsselung statt Abfrage.** Eine blosse JavaScript-Weiche wäre im
 * Quellcode mit einer Zeile ausgehebelt — und das Repository ist öffentlich.
 * Deshalb wird jede gebaute HTML-Seite mit AES-256-GCM verschlüsselt; der
 * Schlüssel entsteht per PBKDF2 (SHA-256, 310 000 Runden) aus dem Passwort.
 * Ausgeliefert wird nur das Tor samt Zifferblob: Wer das Tor umgeht, hält
 * Ciphertext in der Hand. Richtiges Passwort → entschlüsseln → die echte
 * Seite ersetzt das Dokument; der abgeleitete Schlüssel (nie das Passwort)
 * wird im localStorage gemerkt, damit jede weitere Seite von selbst öffnet.
 *
 * **Das Passwort steht in `quelle/.schranke-passwort`** (erste Zeile; zweite
 * Zeile ist das einmal gewürfelte Salz) — die Datei ist in .gitignore und
 * darf NIE ins Repository: Es ist öffentlich. In den Bau-Artefakten landet
 * nur Salz + Ciphertext.
 *
 * **Grenzen, ehrlich:** Bilder, Stylesheets und Skripte in docs/ bleiben
 * unverschlüsselt (im öffentlichen Repo einsehbar) — geschützt ist der
 * Seiteninhalt. Und die Mauer ist so stark wie das Passwort: Der Blob lässt
 * sich offline durchprobieren, PBKDF2 macht das nur teuer, nicht unmöglich.
 *
 * **RÜCKBAU zum Launch:** Aufruf aus package.json (`build`) entfernen, neu
 * bauen — fertig. Diese Datei kann bleiben.
 *
 * Läuft als letzter Schritt von `npm run build` (nach vite build).
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pbkdf2Sync, randomBytes, createCipheriv } from 'node:crypto'

const HIER = dirname(fileURLToPath(import.meta.url))
const DOCS = join(HIER, '..', 'docs')
const GEHEIM = join(HIER, '.schranke-passwort')

const RUNDEN = 310000

if (!existsSync(GEHEIM)) {
  console.error('quelle/.schranke-passwort fehlt (Zeile 1: Passwort) — Schranke NICHT gebaut.')
  process.exit(1)
}
const zeilen = readFileSync(GEHEIM, 'utf8').split('\n').map((z) => z.trim()).filter(Boolean)
const passwort = zeilen[0]
/* Das Salz bleibt über Bauten hinweg stabil, sonst müssten alle Tester nach
   jedem Hochladen neu eingeben (der gemerkte Schlüssel hinge am alten Salz). */
let salzB64 = zeilen[1]
if (!salzB64) {
  salzB64 = randomBytes(16).toString('base64')
  appendFileSync(GEHEIM, `${salzB64}\n`)
}
const salz = Buffer.from(salzB64, 'base64')
const schluessel = pbkdf2Sync(passwort, salz, RUNDEN, 32, 'sha256')

/** iv(12) + ciphertext + tag(16), base64 — WebCrypto erwartet den Tag hinten. */
function verschluesseln(klartext) {
  const iv = randomBytes(12)
  const chiffre = createCipheriv('aes-256-gcm', schluessel, iv)
  const daten = Buffer.concat([chiffre.update(klartext, 'utf8'), chiffre.final(), chiffre.getAuthTag()])
  return Buffer.concat([iv, daten]).toString('base64')
}

/** Das Tor: Entwurf W1/M1 — Logo oben, Kulisse, Wortmarke, Eingabe. */
function tor(blob, tiefe) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<title>AIA</title>
<link rel="icon" href="${tiefe}marke.svg" type="image/svg+xml">
<style>
  @font-face { font-family: "Big Shoulders"; src: url("${tiefe}schriften/BigShoulders-Bold.ttf") format("truetype"); font-weight: 700; font-display: swap; }
  @font-face { font-family: Outfit; src: url("${tiefe}schriften/Outfit-Regular.ttf") format("truetype"); font-weight: 400; font-display: swap; }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; background: #0c0e13; color: #f5f6f7; font-family: Outfit, system-ui, sans-serif; overflow: hidden; }
  .kulisse { position: absolute; left: 50%; top: 50%; width: 3400px; height: 3080px; margin: -1540px 0 0 -1700px; rotate: -22deg; pointer-events: none; }
  .kulisse svg { display: block; animation: drift 150s linear infinite; }
  @keyframes drift { to { transform: translateY(-1540px); } }
  .kulisse path { fill: none; stroke: rgba(42, 47, 56, 0.55); stroke-width: 1.4px; vector-effect: non-scaling-stroke; }
  .kulisse path.volt { stroke: rgba(200, 255, 77, 0.07); }
  .kulisse path.cyan { stroke: rgba(61, 219, 255, 0.065); }
  @media (prefers-reduced-motion: reduce) { .kulisse svg { animation: none; } }
  .logo { position: absolute; left: 50%; top: clamp(36px, 7vh, 64px); translate: -50% 0; width: clamp(104px, 26vw, 150px); }
  .mitte { position: absolute; inset: 0; display: grid; place-items: center; padding: 0 24px; }
  .inhalt { display: grid; justify-items: center; gap: clamp(20px, 4vh, 30px); width: 100%; max-width: 420px; text-align: center; }
  h1 { font-family: "Big Shoulders", "Arial Narrow", sans-serif; font-weight: 700; font-size: clamp(58px, 16vw, 110px); line-height: 0.92; text-transform: uppercase; letter-spacing: -0.005em; margin: 0; white-space: nowrap; }
  h1 b { color: #c8ff4d; font-weight: inherit; }
  /* Coming Soon — gesperrt unter der Wortmarke, C und S in Volt. */
  .bald { font-family: "Big Shoulders", "Arial Narrow", sans-serif; font-weight: 700; font-size: clamp(19px, 5vw, 26px); letter-spacing: 0.5em; margin: clamp(2px, 1vh, 8px) -0.5em 0 0; color: #ced3dc; text-transform: uppercase; white-space: nowrap; }
  .bald b { color: #c8ff4d; font-weight: inherit; }
  form { display: flex; gap: 10px; width: 100%; }
  input { flex: 1; min-width: 0; background: rgba(23, 26, 32, 0.8); border: 1px solid #2a2f38; border-radius: 999px; padding: 13px 20px; color: #f5f6f7; font-size: 16px; font-family: inherit; outline: none; }
  input::placeholder { color: #838c9d; }
  input:focus-visible { border-color: #c8ff4d; }
  input.falsch { border-color: #ff6b4a; }
  button { background: #c8ff4d; color: #10130a; border: none; border-radius: 999px; padding: 13px 24px; font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer; }
  button:active { transform: scale(0.97); }
  button[disabled] { opacity: 0.6; }
</style>
</head>
<body>
<div class="kulisse" aria-hidden="true"></div>
<img class="logo" src="${tiefe}bildmarke.svg" alt="">
<div class="mitte">
  <div class="inhalt">
    <h1><b>A</b>ll <b>i</b>n <b>A</b>ll<span style="color:#c8ff4d">.</span></h1>
    <form>
      <input type="password" placeholder="Passwort" autocomplete="current-password" autofocus>
      <button type="submit">Öffnen</button>
    </form>
    <p class="bald"><b>C</b>oming <b>S</b>oon</p>
  </div>
</div>
<script>
(function () {
  'use strict'
  /* **WebCrypto gibt es nur im sicheren Kontext.** Über http:// existiert
     crypto.subtle nicht — die Eingabe täte dann kommentarlos nichts (so
     am 04.09. live passiert). Öffentliche Aufrufe werden deshalb sofort
     auf https umgeleitet; localhost und LAN-Tests bleiben unberührt. */
  if (location.protocol === 'http:' && !/^(localhost|127\\.|192\\.168\\.|10\\.)/.test(location.hostname)) {
    location.replace('https://' + location.host + location.pathname + location.search)
    return
  }
  /* Kulisse: dieselben Wellen wie die Website (kulisse.js), statisch gerechnet,
     als Doppel-Kachel für die nahtlose Drift-Schleife. */
  var NS = 'http://www.w3.org/2000/svg'
  var saat = 11
  function zufall() { saat = (saat * 16807) % 2147483647; return saat / 2147483647 }
  var svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '3400'); svg.setAttribute('height', '3080')
  svg.setAttribute('viewBox', '0 0 3400 3080')
  var oben = document.createElementNS(NS, 'g')
  var unten = document.createElementNS(NS, 'g')
  unten.setAttribute('transform', 'translate(0 1540)')
  for (var i = 0; i < 14; i++) {
    var basisY = i * 110
    var a1 = 16 + zufall() * 20, f1 = 0.0035 + zufall() * 0.0035, p1 = zufall() * 6.283
    var a2 = 5 + zufall() * 9, f2 = 0.009 + zufall() * 0.009, p2 = zufall() * 6.283
    var d = ''
    for (var x = 0; x <= 3400; x += 36) {
      var y = basisY + a1 * Math.sin(x * f1 + p1) + a2 * Math.sin(x * f2 + p2)
      d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1)
    }
    ;[oben, unten].forEach(function (g) {
      var pfad = document.createElementNS(NS, 'path')
      pfad.setAttribute('d', d)
      if (i === 4) pfad.setAttribute('class', 'volt')
      if (i === 9) pfad.setAttribute('class', 'cyan')
      g.appendChild(pfad)
    })
  }
  svg.appendChild(oben); svg.appendChild(unten)
  document.querySelector('.kulisse').appendChild(svg)

  /* Die Schranke: PBKDF2 → AES-256-GCM. Falscher Schlüssel scheitert an der
     GCM-Prüfsumme — es gibt keinen „Vergleich", den man im Quelltext
     umbiegen könnte; ohne Passwort bleibt der Blob Zifferbrei. */
  var SALZ = Uint8Array.from(atob('${salzB64}'), function (c) { return c.charCodeAt(0) })
  var RUNDEN = ${RUNDEN}
  var BLOB = '${blob}'
  var MERKER = 'aia-zugang'

  function blobBytes() { return Uint8Array.from(atob(BLOB), function (c) { return c.charCodeAt(0) }) }

  function ableiten(passwort) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey'])
      .then(function (grund) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: SALZ, iterations: RUNDEN, hash: 'SHA-256' },
          grund, { name: 'AES-GCM', length: 256 }, true, ['decrypt'])
      })
  }

  function oeffnen(schluessel) {
    var roh = blobBytes()
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: roh.slice(0, 12) }, schluessel, roh.slice(12))
      .then(function (klar) {
        var html = new TextDecoder().decode(klar)
        document.open(); document.write(html); document.close()
      })
  }

  function merken(schluessel) {
    crypto.subtle.exportKey('raw', schluessel).then(function (roh) {
      try { localStorage.setItem(MERKER, btoa(String.fromCharCode.apply(null, new Uint8Array(roh)))) } catch (e) {}
    })
  }

  /* Wer schon einmal drin war, kommt ohne Eingabe durch. Erst NACH dem
     load-Ereignis: document.open() während des Parsens wird verschluckt —
     der erste Wurf feuerte zu früh und das Tor blieb kommentarlos stehen. */
  function autoVersuchen() {
    try {
      var gemerkt = localStorage.getItem(MERKER)
      if (gemerkt) {
        crypto.subtle.importKey('raw', Uint8Array.from(atob(gemerkt), function (c) { return c.charCodeAt(0) }),
          { name: 'AES-GCM' }, true, ['decrypt'])
          .then(function (schluessel) { return oeffnen(schluessel) })
          .catch(function () { try { localStorage.removeItem(MERKER) } catch (e) {} })
      }
    } catch (e) {}
  }
  if (document.readyState === 'complete') autoVersuchen()
  else window.addEventListener('load', autoVersuchen)

  var form = document.querySelector('form')
  var feld = document.querySelector('input')
  var knopf = document.querySelector('button')
  form.addEventListener('submit', function (e) {
    e.preventDefault()
    if (!feld.value) return
    if (!window.crypto || !window.crypto.subtle) {
      feld.value = ''
      feld.classList.add('falsch')
      feld.placeholder = 'Nur über https:// möglich'
      return
    }
    knopf.disabled = true
    feld.classList.remove('falsch')
    ableiten(feld.value)
      .then(function (schluessel) {
        return oeffnen(schluessel).then(function () { merken(schluessel) })
      })
      .catch(function () {
        knopf.disabled = false
        feld.value = ''
        feld.classList.add('falsch')
        feld.placeholder = 'Falsches Passwort'
        feld.focus()
      })
  })
})()
</script>
</body>
</html>
`
}

const SEITEN = [
  'index.html',
  'datenschutz.html',
  'nutzungsbedingungen.html',
  'impressum.html',
  'support.html',
  'en/privacy.html',
  'en/terms.html',
  'en/legal-notice.html',
  'en/support.html',
]

for (const seite of SEITEN) {
  const pfad = join(DOCS, seite)
  const klartext = readFileSync(pfad, 'utf8')
  if (klartext.includes('aia-zugang')) {
    console.error(`${seite} sieht schon wie ein Tor aus — Bau abgebrochen (docs/ erst frisch bauen).`)
    process.exit(1)
  }
  const tiefe = seite.startsWith('en/') ? '../' : ''
  writeFileSync(pfad, tor(verschluesseln(klartext), tiefe))
  console.log(`verschlüsselt: ${seite}`)
}
console.log('Schranke steht — Passwort aus quelle/.schranke-passwort (nicht im Repo).')
