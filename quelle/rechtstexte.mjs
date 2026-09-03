/**
 * Erzeugt die Pflichtseiten der Website aus den **echten** Rechtstexten der
 * App: `datenschutz.html`, `nutzungsbedingungen.html`, `impressum.html` und
 * `support.html` im Projektstamm (die Einstiegspunkte aus `vite.config.js`).
 *
 * **Importiert, nicht abgeschrieben** — die Quelle ist
 * `AIA-native/src/data/rechtstexte.ts`. Abgetippte Kopien liefen bei der
 * nächsten Textänderung auseinander, und die Zustimmung in der App hängt an
 * genau diesen Fassungen (`version`).
 *
 * **Der Abschnitt „Diese Website"** wird nur der Datenschutz-Seite angehängt:
 * Hosting durch GitHub Pages samt Zugriffsdaten, keine Cookies, nichts von
 * fremden Servern. Er gehört ausschliesslich auf die Website, nicht in die
 * App (Vorgabe aus WEBSITE.md §6).
 *
 * Aufruf: `npx tsx quelle/rechtstexte.mjs` — läuft auch vor jedem Bau
 * (package.json, Skript `vorbau`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = dirname(fileURLToPath(import.meta.url))
const APP = join(process.env.AIA_NATIVE ?? join(HIER, '..', '..', 'AIA-native'), 'src', 'data')

const { RECHTSTEXTE } = await import(join(APP, 'rechtstexte.ts'))
const { RECHTSTEXTE_EN } = await import(join(APP, 'rechtstexteEn.ts'))

const entschaerfen = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Nackte Adressen im Text werden anklickbar — mehr HTML steckt nicht darin. */
const verlinken = (s) =>
  entschaerfen(s).replace(
    /https?:\/\/[^\s)]+/g,
    (adresse) => `<a href="${adresse}">${adresse}</a>`,
  )

/**
 * `sprache: 'en'` erzeugt die englische Huelle: html lang, Fusszeile und
 * Rueckverweis auf Englisch, Verweise auf die englischen Schwesterseiten.
 * Die englischen Seiten liegen unter `en/`, deshalb zeigen ihre Pfade eine
 * Ebene nach oben.
 */
function seite({ titel, untertitel, inhalt, sprache = 'de', sprachwechsel }) {
  const en = sprache === 'en'
  const wurzel = en ? '../' : './'
  return `<!doctype html>
<html lang="${sprache}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${entschaerfen(titel)} — AIA</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/marke.svg" type="image/svg+xml">
<link rel="stylesheet" href="/src/stil/basis.css">
<style>
  body { padding: 48px var(--rand) 80px; }
  .kopf { display: flex; align-items: center; justify-content: space-between; max-width: 720px; margin: 0 auto 44px; }
  .kopf a { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); }
  .kopf img { width: 32px; height: 19px; }
  .kopf b { font-family: "Big Shoulders", sans-serif; font-size: 24px; letter-spacing: 0.05em; }
  .kopf .zurueck { color: var(--gedaempft); font-size: 14px; }
  main { max-width: 720px; margin: 0 auto; }
  h1 { font-family: "Big Shoulders", sans-serif; font-size: clamp(36px, 6vw, 56px); line-height: 1; margin-bottom: 6px; }
  .stand { color: var(--schwach); font-size: 13px; margin-bottom: 36px; }
  h2 { font-size: 19px; margin: 34px 0 10px; }
  p { color: var(--gedaempft); margin: 0 0 14px; overflow-wrap: anywhere; }
  a { color: var(--volt); text-underline-offset: 3px; }
  .fuss { max-width: 720px; margin: 64px auto 0; padding-top: 24px; border-top: 1px solid var(--linie); display: flex; flex-wrap: wrap; gap: 18px; color: var(--schwach); font-size: 14px; }
  .fuss a { color: var(--gedaempft); text-decoration: none; }
</style>
</head>
<body>
<header class="kopf">
  <a href="${wurzel}"><img src="/marke.svg" alt=""><b>AIA</b></a>
  <span>
    ${sprachwechsel ? `<a class="zurueck" href="${sprachwechsel.href}">${sprachwechsel.label}</a> · ` : ''}<a class="zurueck" href="${wurzel}">${en ? 'Back to home' : 'Zur Startseite'}</a>
  </span>
</header>
<main>
  <h1>${entschaerfen(titel)}</h1>
  ${untertitel ? `<p class="stand">${entschaerfen(untertitel)}</p>` : ''}
  ${inhalt}
</main>
<footer class="fuss">
  ${en
    ? `<a href="legal-notice.html">Legal notice</a>
  <a href="privacy.html">Privacy</a>
  <a href="terms.html">Terms of use</a>
  <a href="support.html">Support</a>`
    : `<a href="impressum.html">Impressum</a>
  <a href="datenschutz.html">Datenschutz</a>
  <a href="nutzungsbedingungen.html">Nutzungsbedingungen</a>
  <a href="support.html">Support</a>`}
  <span>© 2026 Atahan Kiraz</span>
</footer>
</body>
</html>
`
}

function abschnitteZuHtml(abschnitte) {
  return abschnitte
    .map(
      (a) =>
        `<h2>${entschaerfen(a.titel)}</h2>` +
        a.absaetze.map((p) => `<p>${verlinken(p)}</p>`).join(''),
    )
    .join('')
}

/** Deutsche und englische Datei je Text — für den Sprachwechsel im Kopf. */
const DATEIEN = {
  datenschutz: ['datenschutz.html', 'privacy.html'],
  agb: ['nutzungsbedingungen.html', 'terms.html'],
  impressum: ['impressum.html', 'legal-notice.html'],
}

function rechtsSeite(id, dateiname, extraAbschnitte = [], sprache = 'de') {
  const quelle = sprache === 'en' ? RECHTSTEXTE_EN : RECHTSTEXTE
  const text = quelle.find((t) => t.id === id)
  if (!text) throw new Error(`Rechtstext »${id}« nicht gefunden`)
  const [de, enDatei] = DATEIEN[id]
  const sprachwechsel = sprache === 'en'
    ? { href: `../${de}`, label: 'Deutsche Fassung (maßgeblich)' }
    : { href: `en/${enDatei}`, label: 'English version' }
  const html = seite({
    titel: text.titel,
    untertitel: sprache === 'en' ? `Version of ${text.version}` : `Fassung vom ${text.version}`,
    inhalt: abschnitteZuHtml([...text.abschnitte, ...extraAbschnitte]),
    sprache,
    sprachwechsel,
  })
  writeFileSync(join(HIER, '..', dateiname), html)
  console.log(`geschrieben: ${dateiname} (Fassung ${text.version})`)
}

/**
 * Nur auf der Website: was beim Aufruf DIESER Seite passiert. Faktenlage:
 * GitHub Pages liefert aus und führt technische Zugriffsprotokolle; die Seite
 * selbst setzt keine Cookies und ruft keine fremden Server auf (Schriften und
 * Bilder liegen lokal — bewusst, siehe vite.config.js).
 */
const DIESE_WEBSITE = {
  titel: 'Diese Website',
  absaetze: [
    'Diese Website wird über GitHub Pages bereitgestellt, einen Dienst der GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Beim Aufruf verarbeitet GitHub technisch notwendige Zugriffsdaten — insbesondere die IP-Adresse deines Geräts — in Server-Protokollen, um die Seite auszuliefern und den Betrieb abzusichern (Rechtsgrundlage: berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO). Auf diese Protokolle haben wir keinen Zugriff. GitHub ist unter dem EU-U.S. Data Privacy Framework zertifiziert; Einzelheiten stehen in der Datenschutzerklärung von GitHub: https://docs.github.com/site-policy/privacy-policies/github-privacy-statement',
    'Die Website selbst setzt keine Cookies, verwendet keine Analyse- oder Werbedienste und lädt nichts von fremden Servern nach — auch Schriften und Bilder liegen lokal. Wir selbst erheben beim Besuch keine personenbezogenen Daten.',
  ],
}

rechtsSeite('datenschutz', 'datenschutz.html', [DIESE_WEBSITE])
rechtsSeite('agb', 'nutzungsbedingungen.html')
rechtsSeite('impressum', 'impressum.html')

/* Derselbe Abschnitt fuer die englische Datenschutz-Seite. */
const THIS_WEBSITE = {
  titel: 'This website',
  absaetze: [
    'This website is served via GitHub Pages, a service of GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. When you visit, GitHub processes technically necessary access data — in particular the IP address of your device — in server logs to deliver the page and secure its operation (legal basis: legitimate interest, Art. 6(1)(f) GDPR). We have no access to these logs. GitHub is certified under the EU-U.S. Data Privacy Framework; details are in GitHub\u2019s privacy statement: https://docs.github.com/site-policy/privacy-policies/github-privacy-statement',
    'The website itself sets no cookies, uses no analytics or advertising services and loads nothing from third-party servers — fonts and images are hosted locally. We ourselves collect no personal data when you visit.',
  ],
}

mkdirSync(join(HIER, '..', 'en'), { recursive: true })
rechtsSeite('datenschutz', join('en', 'privacy.html'), [THIS_WEBSITE], 'en')
rechtsSeite('agb', join('en', 'terms.html'), [], 'en')
rechtsSeite('impressum', join('en', 'legal-notice.html'), [], 'en')

/* Support ist kein Rechtstext — eine kurze, eigene Seite. */
writeFileSync(
  join(HIER, '..', 'support.html'),
  seite({
    titel: 'Support',
    untertitel: '',
    sprachwechsel: { href: 'en/support.html', label: 'English version' },
    inhalt: [
      '<h2>So erreichst du uns</h2>',
      '<p>Schreib eine E-Mail an <a href="mailto:aia.support@icloud.com">aia.support@icloud.com</a> — am besten mit einer kurzen Beschreibung, was passiert ist, und auf welchem iPhone. Wir antworten in der Regel innerhalb weniger Tage.</p>',
      '<h2>Häufige Fragen</h2>',
      '<p>Die wichtigsten Antworten — Konto, Datenspeicherung, Offline-Betrieb, Premium, Kündigung — stehen auf der Startseite im Abschnitt <a href="./#fragen">Fragen &amp; Antworten</a>.</p>',
      '<h2>Deine Daten</h2>',
      '<p>Zur Erinnerung: Deine Trainings- und Ernährungsdaten liegen ausschliesslich auf deinem Gerät. Wir können sie weder einsehen noch wiederherstellen — sichere sie über die normale iPhone-Datenübernahme oder den Datenexport in der App.</p>',
    ].join(''),
  }),
)
console.log('geschrieben: support.html')

/* Die englische Support-Seite — kurz, wie die deutsche. */
writeFileSync(
  join(HIER, '..', 'en', 'support.html'),
  seite({
    titel: 'Support',
    untertitel: '',
    sprache: 'en',
    sprachwechsel: { href: '../support.html', label: 'Deutsche Fassung' },
    inhalt: [
      '<h2>How to reach us</h2>',
      '<p>Send an email to <a href="mailto:aia.support@icloud.com">aia.support@icloud.com</a> — ideally with a short description of what happened and on which iPhone. We usually reply within a few days.</p>',
      '<h2>Your data</h2>',
      '<p>A reminder: your training and nutrition data lives exclusively on your device. We can neither view nor restore it — back it up via the normal iPhone transfer or the data export in the app.</p>',
    ].join(''),
  }),
)
console.log('geschrieben: en/support.html')
