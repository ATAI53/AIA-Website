import './stil/basis.css'
import './stil/start.css'
import { geraetebuehne } from './szene/buehne.js'
import { stufeAufbauen } from './szene/stufe.js'
import { ablaufAufbauen } from './szene/ablauf.js'
// Kulisse (Konturlinien) — RÜCKBAU: diese Zeile, den Aufruf unten und
// szene/kulisse.js samt »Kulisse«-Block in basis.css entfernen.
import { kulisseAufbauen } from './szene/kulisse.js'

/**
 * Der Ablauf der Startseite.
 *
 * **Bewegung ist hier Führung, nicht Zierde.** Jede Regung hat eine Aufgabe:
 * Das Einblenden ordnet die Lesereihenfolge, die hochzählenden Zahlen machen
 * den Umfang begreifbar, das wegkippende Gerät zeigt, dass der Kopfbereich
 * endet. Wer Bewegung im System abgeschaltet hat, bekommt dieselbe Seite in
 * ruhig — nicht eine kaputte.
 */

/**
 * **Jeder Aufruf beginnt oben.**
 *
 * Browser merken sich die Scroll-Position und stellen sie beim Neuladen wieder
 * her. Bei einer Seite, deren Abschnitte den Scroll selbst führen, ist das
 * fatal: Man landet mitten in einer Bedienschrittfolge, ohne zu wissen, wie man
 * dorthin kam. Deshalb übernehmen wir die Wiederherstellung selbst — und tun
 * nichts.
 */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
// Ein Anker aus einem früheren Besuch (#workout in der Adresse) würde die
// Seite beim Laden mitten in eine Stufe setzen — weg damit, bevor der Browser
// ihn anfährt.
if (location.hash) history.replaceState(null, '', location.pathname + location.search)
window.scrollTo(0, 0)
// Der zweite Rücksetzer fängt späte Wiederherstellung ab — aber nur, solange
// der Nutzer die Seite nicht angefasst hat. Bilder laden nach; wer bis dahin
// schon scrollt, darf nicht an den Anfang zurückgerissen werden.
let beruehrt = false
const merkeBeruehrung = () => {
  beruehrt = true
}
for (const art of ['wheel', 'touchstart', 'keydown', 'mousedown']) {
  window.addEventListener(art, merkeBeruehrung, { passive: true, capture: true })
}
window.addEventListener('load', () => {
  if (!beruehrt) window.scrollTo(0, 0)
})
// Safari holt Seiten aus dem Verlaufs-Zwischenspeicher zurück, ohne das Modul
// neu auszuführen — dann steht die Seite dort, wo sie verlassen wurde.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.scrollTo(0, 0)
})

const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Die driftenden Konturlinien hinter allem. RÜCKBAU: siehe Import oben.
kulisseAufbauen()

/* --- Scrollen -------------------------------------------------------------- */

/**
 * **Die Seite führt den Scroll vollständig selbst** — segmentweise, siehe
 * `szene/ablauf.js`. Keine Bibliothek, kein Einrasten hinterher: Genau das
 * Nebeneinander von freiem Browser-Scroll und nachträglichem Einrasten war die
 * Ursache des Reload-Fehlers und des zähen Gefühls.
 */

/* --- Marke: Wortmarke + Volt-Strich, rein im Markup/Stylesheet ------------- */

/* --- Bildmarke: zeichnet sich wie beim App-Start ---------------------------- */

/**
 * Der Auftritt der Marke, übernommen vom Kaltstart der App (`LogoDraw` im
 * nativen Projekt): Jede Kontur zieht sich wie mit einem Stift, die Konturen
 * setzen versetzt an, und wenn alle stehen, füllt sich das A. Der Takt ist
 * gegenüber der App gestaucht (Vorgabe vom 03.09.: **unter 2 Sekunden
 * gesamt**) — die Datei enthält nur die 5 Marken-Konturen, der unsichtbare
 * Schriftzug zählt nicht mehr mit: 4 × 90 ms Versatz + 1100 ms Zug +
 * 450 ms Füllung = 1910 ms. Läuft **nur beim Laden** (04.09.; das erneute
 * Zeichnen bei jeder Rückkehr war gebaut und wurde verworfen —
 * `markeNeuZeichnen` bleibt als Griff dafür stehen, ruft aber niemand mehr).
 */
const ZUG_DAUER = 1100
const ZUG_VERSATZ = 90
const FUELL_DAUER = 450
const heroMarke = document.querySelector('.hero-marke')
let markeNeuZeichnen = () => {}
if (heroMarke) {
  fetch('/bildmarke.svg')
    .then((antwort) => antwort.text())
    .then((svgText) => {
      heroMarke.innerHTML = svgText
      const pfade = [...heroMarke.querySelectorAll('path')]
      const fertigNach = (pfade.length - 1) * ZUG_VERSATZ + ZUG_DAUER
      pfade.forEach((pfad) => {
        if (pfad.dataset.fuellt === '1') pfad.style.fill = 'var(--volt)'
      })
      if (ruhig) return
      const daten = pfade.map((pfad) => ({ pfad, laenge: pfad.getTotalLength() + 4 }))

      markeNeuZeichnen = () => {
        // Zurück auf Anfang, ohne Übergang — sonst zöge der Rückweg sichtbar.
        for (const { pfad, laenge } of daten) {
          pfad.style.transition = 'none'
          pfad.style.strokeDasharray = String(laenge)
          pfad.style.strokeDashoffset = String(laenge)
          if (pfad.dataset.fuellt === '1') pfad.style.fillOpacity = '0'
        }
        void heroMarke.offsetWidth
        daten.forEach(({ pfad }, i) => {
          const fuellt = pfad.dataset.fuellt === '1'
          pfad.style.transition =
            `stroke-dashoffset ${ZUG_DAUER}ms cubic-bezier(0.33, 1, 0.68, 1) ${i * ZUG_VERSATZ}ms` +
            (fuellt ? `, fill-opacity ${FUELL_DAUER}ms linear ${fertigNach}ms` : '')
        })
        // Zwei Bilder warten, damit der Anfangszustand sicher steht — sonst
        // springt der Zug statt zu ziehen.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            for (const { pfad } of daten) {
              pfad.style.strokeDashoffset = '0'
              if (pfad.dataset.fuellt === '1') pfad.style.fillOpacity = '1'
            }
          }),
        )
      }
      markeNeuZeichnen()
    })
    .catch(() => {})
}

/* --- Zahlen hochzählen ----------------------------------------------------- */

function zaehlen(el) {
  const ziel = Number(el.dataset.zahl)
  if (ruhig || ziel === 0) {
    el.textContent = String(ziel)
    return
  }
  const dauer = 1100
  const start = performance.now()
  const schritt = (jetzt) => {
    const t = Math.min((jetzt - start) / dauer, 1)
    // Am Ende auslaufen, damit die Zahl ankommt statt abzubrechen.
    const weich = 1 - Math.pow(1 - t, 3)
    el.textContent = String(Math.round(ziel * weich))
    if (t < 1) requestAnimationFrame(schritt)
  }
  requestAnimationFrame(schritt)
}

const zahlenBeobachter = new IntersectionObserver(
  (eintraege) => {
    for (const e of eintraege) {
      if (!e.isIntersecting) continue
      zaehlen(e.target)
      zahlenBeobachter.unobserve(e.target)
    }
  },
  { threshold: 0.6 },
)
document.querySelectorAll('[data-zahl]').forEach((el) => zahlenBeobachter.observe(el))

/* --- Leiste beim Scrollen -------------------------------------------------- */

const leiste = document.querySelector('[data-leiste]')
const buehne = document.querySelector('[data-buehne]')

/* --- Gerätebühne ----------------------------------------------------------- */

const buehneEl = document.querySelector('[data-geraetebuehne]')
const szene = buehneEl ? geraetebuehne(buehneEl) : null

function beimScrollen() {
  const y = window.scrollY
  leiste?.classList.toggle('fest', y > 40)
  if (szene && buehne) {
    const hoehe = buehne.offsetHeight || window.innerHeight
    szene.zeigeFortschritt(y / hoehe)
  }
}
beimScrollen()
window.addEventListener('scroll', beimScrollen, { passive: true })

/* --- Segmente -------------------------------------------------------------- */

/**
 * Die Abschnitte der Seite, in Reihenfolge. Jede Stufe bringt ihre
 * Bedienschrittfolge mit; der Ablauf ruft sie beim Eintritt und bei jeder
 * Bewegung auf dem Segment an.
 */
const segmente = [...document.querySelectorAll('[data-segment]')].map((el) => ({
  el,
  stufe: el.hasAttribute('data-stufe') ? stufeAufbauen(el) ?? undefined : undefined,
}))

// Der Fuss ist das letzte Ziel: Eine Bewegung über den letzten Abschnitt
// hinaus zeigt ihn, sonst wären Impressum und Datenschutz nie erreichbar.
const fuss = document.querySelector('.fuss')
if (fuss) segmente.push({ el: fuss })

/**
 * **Der Kopfbereich spielt seinen Auftritt nur beim Laden** (Entscheidung vom
 * 04.09. — davor lief er bei jeder Rückkehr ins Start-Segment erneut, das
 * war zu viel). Auftauch-Animationen und Marken-Zeichnung starten einmal von
 * selbst; Segmentwechsel zurück zum Start lösen nichts mehr aus.
 */

/* --- Segment-Punkte am rechten Rand ---------------------------------------- */

/**
 * Ein Punkt je Segment, der aktive in Volt: Man sieht, wo man steht und wie
 * viel noch kommt. Die Punkte springen ihr Segment auch direkt an.
 */
const punkteNav = document.createElement('nav')
punkteNav.className = 'segment-punkte'
punkteNav.setAttribute('aria-label', 'Abschnitte der Seite')
const punkte = segmente.map(({ el }, i) => {
  const knopf = document.createElement('button')
  knopf.type = 'button'
  const name = el.dataset.name || `Abschnitt ${i + 1}`
  knopf.setAttribute('aria-label', name)
  knopf.title = name
  knopf.addEventListener('click', () => ablauf?.springeZu(el))
  punkteNav.append(knopf)
  return knopf
})
document.body.append(punkteNav)

const zeigePunkt = (i) => {
  punkte.forEach((p, n) => p.classList.toggle('aktiv', n === i))
  // Ab dem zweiten Segment weicht die Leisten-Pille der Diagonalkante aus
  // (rutscht an den linken Rand und klappt die Nav ein) — siehe Stylesheet.
  leiste?.classList.toggle('kompakt', i > 0)
}
zeigePunkt(0)

/**
 * **Nur auf breiten Bildschirmen.** Unter 901 px stapeln sich Text und Gerät,
 * die Abschnitte sind höher als ein Bildschirm — ein Segment-Raster passt dort
 * nicht, die Seite scrollt frei (derselbe Umbruch wie im Stylesheet).
 */
const breit = window.matchMedia('(min-width: 901px)')
let ablauf = null

function ablaufSchalten() {
  if (breit.matches && !ablauf && segmente.length > 0) {
    ablauf = ablaufAufbauen(segmente, { beiWechsel: zeigePunkt })
  } else if (!breit.matches && ablauf) {
    ablauf.abbauen()
    ablauf = null
  }
}
ablaufSchalten()
breit.addEventListener('change', ablaufSchalten)

/**
 * Verweise innerhalb der Seite fahren durch den Ablauf zu ihrem Segment —
 * ein nackter Anker-Sprung liefe an der Segmentführung vorbei.
 */
document.querySelectorAll('a[href^="#"]').forEach((verweis) => {
  verweis.addEventListener('click', (e) => {
    const ziel = document.querySelector(verweis.getAttribute('href'))
    if (!ziel || !ablauf) return
    e.preventDefault()
    ablauf.springeZu(ziel)
  })
})
