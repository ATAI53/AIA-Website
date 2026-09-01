/**
 * Erzeugt die Website aus den Quellen der App.
 *
 * **Die Rechtstexte werden nicht abgeschrieben, sondern importiert** — aus
 * `AIA-native/src/data/rechtstexte.ts`, derselben Datei, aus der die App sie
 * anzeigt. Zwei Fassungen desselben Textes laufen sonst auseinander, und beim
 * Datenschutz ist die Fassung in der App die verbindliche.
 *
 * Dasselbe gilt fürs Logo: `logoPaths.ts` liefert die echten Konturen, die aus
 * der Bildmarke gewonnen wurden. Hier wird nichts nachgezeichnet.
 *
 * Aufruf: `node bauen.mjs` — schreibt nach `docs/`, dem Ordner, den GitHub
 * Pages ausliefert. `stil.css` liegt dort fest und wird nicht überschrieben.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HIER = dirname(fileURLToPath(import.meta.url))

/**
 * Wo das App-Projekt liegt. Standard ist der Nachbarordner — absolute Pfade
 * stünden sonst mit dem Benutzernamen des Rechners in einem öffentlichen
 * Repository. Andernorts: `AIA_NATIVE=/pfad/zu/AIA-native node bauen.mjs`.
 */
const APP = join(process.env.AIA_NATIVE ?? join(HIER, '..', 'AIA-native'), 'src', 'data') + '/'

let RECHTSTEXTE, logoKonturen, LOGO_VIEWBOX
try {
  ;({ RECHTSTEXTE } = await import(APP + 'rechtstexte.ts'))
  ;({ logoKonturen, LOGO_VIEWBOX } = await import(APP + 'logoPaths.ts'))
} catch (fehler) {
  console.error(`Das App-Projekt wurde unter ${APP} nicht gefunden.`)
  console.error('Erwartet wird es im Nachbarordner AIA-native, sonst AIA_NATIVE setzen.')
  process.exit(1)
}
const AUS = join(HIER, 'docs')

const KONTAKT = 'aia.support@icloud.com'
const BETREIBER = 'Atahan Kiraz'

/** Dateinamen der Rechtstexte. `agb` heisst im Web wie im Store-Formular. */
const DATEI = { datenschutz: 'datenschutz.html', agb: 'nutzungsbedingungen.html', impressum: 'impressum.html' }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Die Bildmarke. `gefuellt` färbt die Buchstaben A-i-A, wie im Startbildschirm. */
function logo({ klasse = '', strich = 6, animiert = false } = {}) {
  const teile = logoKonturen
    .map((k, i) => {
      const fuellung = k.istAIA ? 'var(--volt)' : 'none'
      const verzug = animiert ? ` style="--laenge:${k.laenge};animation-delay:${(i * 45).toFixed(0)}ms"` : ''
      return `<path d="${k.d}" fill="${fuellung}" stroke="var(--volt)" stroke-width="${strich}" stroke-linejoin="round" stroke-linecap="round"${verzug}/>`
    })
    .join('')
  return `<svg class="${klasse}" viewBox="${LOGO_VIEWBOX}" role="img" aria-label="AIA" xmlns="http://www.w3.org/2000/svg">${teile}</svg>`
}

const KOPF_LOGO = logo({ strich: 26 })

function seite({ titel, beschreibung, datei, inhalt }) {
  const nav = (ziel, text) =>
    `<a href="${ziel}"${datei === ziel ? ' aria-current="page"' : ''}>${text}</a>`
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beschreibung)}">
<meta name="color-scheme" content="dark">
<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(beschreibung)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700&family=Outfit:wght@400;500;600&family=Red+Hat+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="stil.css">
</head>
<body>
<header class="kopf">
  <div class="huelle">
    <a class="marke-zeile" href="index.html" aria-label="AIA — Startseite">
      <span style="width:34px;display:block">${KOPF_LOGO}</span>
      <span class="wortmarke">AIA</span>
    </a>
    <nav>
      ${nav('index.html', 'Start')}
      ${nav('support.html', 'Support')}
      ${nav('datenschutz.html', 'Datenschutz')}
    </nav>
  </div>
</header>
<main>
${inhalt}
</main>
<footer>
  <div class="huelle">
    <nav>
      <a href="impressum.html">Impressum</a>
      <a href="datenschutz.html">Datenschutz</a>
      <a href="nutzungsbedingungen.html">Nutzungsbedingungen</a>
      <a href="support.html">Support</a>
      <a href="mailto:${KONTAKT}">${KONTAKT}</a>
    </nav>
    <span class="fuss-hinweis">© ${new Date().getFullYear()} ${BETREIBER}</span>
  </div>
</footer>
</body>
</html>
`
}

/* ---------- Startseite ---------- */

const ikone = (d) =>
  `<svg class="ikone" viewBox="0 0 24 24" fill="none" stroke="var(--volt)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`

const haken = `<svg class="haken" viewBox="0 0 24 24" fill="none" stroke="var(--volt)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>`

const KARTEN = [
  {
    ikone: '<path d="M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8"/>',
    titel: 'Training, das mitzählt',
    text: 'Sätze, Wiederholungen, Gewicht und RPE — mit Vorschlägen aus deinem eigenen Verlauf. 89 Übungen mit Muskelgruppen und Anleitung, eigene Routinen oder fertige Pläne.',
  },
  {
    ikone: '<path d="M12 3a9 9 0 100 18 9 9 0 000-18z"/><path d="M12 7v5l3.5 2"/>',
    titel: 'Essen ohne Rechnen',
    text: '86 Rezepte und 333 Zutaten mit vollständigen Nährwerten, Barcode-Suche, Vorrat-Modus und ein Tagebuch, das die Reste des Tages kennt statt nur die Summe.',
  },
  {
    ikone: '<path d="M4 19h16"/><path d="M7 19V9M12 19V5M17 19v-7"/>',
    titel: 'Auswertung mit Achsen',
    text: 'Volumen, Rekorde, Körpergewicht und -maße, Wasser, Cardio — jeder Graph mit Achsen und Ableseleiste. Zahlen mit Kontext, nicht nur Kurven.',
  },
  {
    ikone: '<path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/><path d="M9.5 12.2l1.8 1.8 3.4-3.6"/>',
    titel: 'Deine Daten bleiben hier',
    text: 'Gewicht, Maße, Training und Ernährung liegen verschlüsselt auf deinem iPhone. Kein Server sieht sie — nicht, weil wir es versprechen, sondern weil die App keinen Weg dorthin hat.',
  },
]

const ZAHLEN = [
  ['89', 'Übungen'],
  ['86', 'Rezepte'],
  ['333', 'Zutaten'],
  ['0', 'Tracker'],
]

const SCHUTZ = [
  'Gesundheits- und Trainingsdaten verlassen dein Gerät nicht. Es gibt keine Schnittstelle, über die sie es könnten.',
  'Der Speicher der App ist mit AES-256 verschlüsselt; der Schlüssel liegt in der iOS-Keychain, geschützt von der Secure Enclave.',
  'Ein Konto ist freiwillig. Ohne Anmeldung funktioniert die App vollständig — das Konto trägt nur den Abo-Status.',
  'Keine Werbung, keine Analyse-Werkzeuge, keine Absturzberichte von Dritten, kein Tracking über Apps hinweg.',
  'Alles exportierbar, alles löschbar — Konto samt Daten mit einem Weg in der App.',
]

const start = `
<div class="buehne">
  <div class="huelle">
    ${logo({ klasse: 'logo zeichnen', strich: 8, animiert: true })}
    <p class="claim">All in All</p>
    <p class="satz">Krafttraining und Ernährung in einer App — ohne dass jemand mitliest.</p>
    <p class="untersatz">AIA führt Training, Essen und Auswertung an einer Stelle zusammen. Gebaut für iPhone, gedacht für Leute, die ihre Zahlen ernst nehmen.</p>
    <span class="abzeichen"><span class="punkt"></span> Bald im App Store</span>
    <div class="zahlen">
      ${ZAHLEN.map(([z, t]) => `<div class="zahl"><b>${z}</b><span>${t}</span></div>`).join('')}
    </div>
  </div>
</div>

<section>
  <div class="huelle">
    <p class="marke-klein">Was drin ist</p>
    <h2>Eine App statt vier</h2>
    <div class="raster">
      ${KARTEN.map((k) => `<article class="karte">${ikone(k.ikone)}<h3>${esc(k.titel)}</h3><p>${esc(k.text)}</p></article>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="huelle">
    <div class="schutz">
      <p class="marke-klein">Datenschutz</p>
      <h2>Auf dem Gerät, nicht in der Wolke</h2>
      <ul class="liste">
        ${SCHUTZ.map((s) => `<li>${haken}<span>${esc(s)}</span></li>`).join('')}
      </ul>
      <p style="margin-top:26px"><a href="datenschutz.html">Vollständige Datenschutzerklärung</a></p>
    </div>
  </div>
</section>

<section>
  <div class="huelle">
    <p class="marke-klein">Fragen</p>
    <h2>Schreib einfach</h2>
    <p style="color:var(--muted);max-width:52ch">Support, Fehler, Wünsche — eine Adresse, ein Mensch dahinter. <a href="mailto:${KONTAKT}">${KONTAKT}</a></p>
  </div>
</section>
`

writeFileSync(
  join(AUS, 'index.html'),
  seite({
    titel: 'AIA — Krafttraining und Ernährung, offline auf deinem iPhone',
    beschreibung:
      'AIA führt Training, Ernährung und Auswertung in einer iPhone-App zusammen. Gesundheitsdaten bleiben verschlüsselt auf dem Gerät.',
    datei: 'index.html',
    inhalt: start,
  }),
)

/* ---------- Support ---------- */

const support = `
<div class="dokument">
  <div class="eng">
    <p class="marke-klein">Support</p>
    <h1>Hilfe zu AIA</h1>
    <p class="stand">Antwort in der Regel innerhalb weniger Tage</p>

    <div class="abschnitt">
      <h2>Kontakt</h2>
      <p>Schreib an <a href="mailto:${KONTAKT}">${KONTAKT}</a>. Hilfreich sind: welches iPhone, welche iOS-Fassung, welche Fassung der App (Profil → Einstellungen) und was genau passiert ist.</p>
      <p>Bitte schick keine Screenshots mit Gesundheitsdaten, wenn sie zur Frage nicht nötig sind.</p>
    </div>

    <div class="abschnitt">
      <h2>Deine Daten einsehen oder löschen</h2>
      <p>Beides geht in der App selbst, ohne Umweg über den Support: Profil → Einstellungen → Daten exportieren gibt dir alles als Datei; Konto löschen entfernt das Konto samt Abo-Status vom Server.</p>
      <p>Deine Trainings- und Ernährungsdaten liegen ohnehin nur auf dem Gerät — sie verschwinden, wenn du die App löschst. Ein Export vorher ist der einzige Weg, sie zu behalten.</p>
    </div>

    <div class="abschnitt">
      <h2>Abo</h2>
      <p>Abonnements laufen über deine Apple-ID. Verwalten und kündigen kannst du sie in den iOS-Einstellungen unter deinem Namen → Abonnements. Bei Abrechnungsfragen ist Apple zuständig, nicht wir.</p>
    </div>

    <div class="abschnitt">
      <h2>Kein Ersatz für ärztlichen Rat</h2>
      <p>AIA ist kein Medizinprodukt und behandelt keine Krankheiten. Die Empfehlungen der App sind Richtwerte für gesunde Erwachsene. Bei Beschwerden, Erkrankungen, in Schwangerschaft und Stillzeit gilt das, was deine Ärztin oder dein Arzt sagt.</p>
    </div>
  </div>
</div>
`

writeFileSync(
  join(AUS, 'support.html'),
  seite({
    titel: 'Support — AIA',
    beschreibung: 'Hilfe, Kontakt und Datenauskunft zur AIA-App.',
    datei: 'support.html',
    inhalt: support,
  }),
)

/* ---------- Rechtstexte ---------- */

let anzahl = 2
for (const text of RECHTSTEXTE) {
  const datei = DATEI[text.id]
  if (!datei) continue

  const verzeichnis =
    text.abschnitte.length > 5
      ? `<nav class="inhalt" aria-label="Inhalt"><ol>${text.abschnitte
          .map((a, i) => `<li><a href="#a${i}">${esc(a.titel)}</a></li>`)
          .join('')}</ol></nav>`
      : ''

  const koerper = text.abschnitte
    .map(
      (a, i) =>
        `<section class="abschnitt" id="a${i}"><h2>${esc(a.titel)}</h2>${a.absaetze
          .map((p) => `<p>${esc(p)}</p>`)
          .join('')}</section>`,
    )
    .join('')

  const inhalt = `
<div class="dokument">
  <div class="eng">
    <p class="marke-klein">Rechtliches</p>
    <h1>${esc(text.titel)}</h1>
    <p class="stand">Fassung vom ${esc(text.version)}</p>
    <p style="color:var(--muted);margin-top:14px">${esc(text.kurz)}</p>
    ${verzeichnis}
    ${koerper}
  </div>
</div>
`
  writeFileSync(
    join(AUS, datei),
    seite({ titel: `${text.titel} — AIA`, beschreibung: text.kurz, datei, inhalt }),
  )
  anzahl++
}

console.log(`${anzahl} Seiten geschrieben nach docs/`)
