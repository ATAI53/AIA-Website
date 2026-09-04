/**
 * Die Kulisse: **topografische Konturlinien** — die Design-Philosophie der
 * App („Kinetic Cartography") als Hintergrund. Drei Bewegungen (03.09.):
 *
 * 1. **Die Landschaft atmet.** Die Wellen der Linien verformen sich in
 *    Zeitlupe (wandernde Phasen, langsam schwellende Amplituden) — die Pfade
 *    werden dafür laufend neu gerechnet, gedrosselt auf jedes zweite Bild.
 * 2. **Die Karte reist mit.** Beim Scrollen schwenkt die ganze Karte anteilig
 *    mit (SCHWENK Kartenpixel je Scrollpixel) — jedes Segment liegt in einer
 *    anderen Region. Weil der Ablauf den Scroll selbst animiert, ist der
 *    Schwenk exakt synchron zur Fahrt.
 * 3. **Die Karte zeichnet sich beim Laden** einmal selbst (Strichmuster wird
 *    aufgezogen, Linie für Linie leicht versetzt), danach Ruhe.
 *
 * **Nur Linien, keine Flächenverläufe** — Linien können nicht banden; daran
 * sind mehrere Verlaufs-Versuche gescheitert. Verworfen und nicht ohne neue
 * Entscheidung zurückholen: Messimpulse auf den Linien, Vermessungszeichen/
 * Höhenzahlen, Maus-Parallax.
 *
 * **RÜCKBAU:** In `haupt.js` Import und Aufruf entfernen, diese Datei
 * löschen, in `basis.css` den mit »Kulisse« überschriebenen Block löschen.
 */

/** Abstand der Höhenlinien in der Kachel. */
const LINIEN_ABSTAND = 110

/** Abtastschritt der Wellen — klein genug, dass die Kurve rund wirkt. */
const PUNKT_SCHRITT = 36

/** Breite der gezeichneten Linien; deckt jede Bildschirmdiagonale ab. */
const BREITE = 3400

/** Kartenschwenk: so viele Kartenpixel wandern je gescrolltem Pixel. */
const SCHWENK = 0.22

const PI2 = Math.PI * 2

/* Deterministischer Zufall (mulberry32): Die Karte sieht bei jedem Laden
   gleich aus — eine Landschaft, kein Rauschen. */
function zufall(startwert) {
  let a = startwert
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Die Wellenparameter einer Linie. `s…` sind die Zeitlupen-Geschwindigkeiten
 *  der Phasen, `atem` versetzt das Amplituden-Schwellen je Linie. */
function linieAnlegen(wert, basisY) {
  return {
    basisY,
    a1: 16 + wert() * 20,
    f1: 0.0035 + wert() * 0.0035,
    p1: wert() * PI2,
    s1: 0.04 + wert() * 0.05,
    a2: 5 + wert() * 9,
    f2: 0.009 + wert() * 0.009,
    p2: wert() * PI2,
    s2: 0.06 + wert() * 0.07,
    atem: wert() * PI2,
  }
}

/** Der Pfad einer Linie zum Zeitpunkt t (Sekunden). */
function dFuer(l, t) {
  // Berge wachsen und senken sich: Die lange Welle schwillt um ±22 %.
  const hub = 1 + 0.22 * Math.sin(t * 0.045 + l.atem)
  let d = ''
  for (let x = 0; x <= BREITE; x += PUNKT_SCHRITT) {
    const y =
      l.basisY +
      hub * l.a1 * Math.sin(x * l.f1 + l.p1 + t * l.s1) +
      l.a2 * Math.sin(x * l.f2 + l.p2 + t * l.s2)
    d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`
  }
  return d
}

const SVG_NS = 'http://www.w3.org/2000/svg'

function schichtBauen(startwert, anzahl) {
  const kachel = anzahl * LINIEN_ABSTAND
  const wert = zufall(startwert)

  const lage = document.createElement('div')
  lage.className = 'kulisse-lage'
  lage.style.marginLeft = `${-BREITE / 2}px`
  lage.style.marginTop = `${-kachel}px`
  lage.style.setProperty('--kachel', `${kachel}px`)

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', String(BREITE))
  svg.setAttribute('height', String(kachel * 2))
  svg.setAttribute('viewBox', `0 0 ${BREITE} ${kachel * 2}`)

  // Dieselbe Kachel zweimal untereinander: Wandert die Schicht um genau eine
  // Kachelhöhe, sieht das Ende aus wie der Anfang — die Schleife ist nahtlos.
  // Beide Kopien einer Linie bekommen bei jedem Morph denselben Pfad.
  const oben = document.createElementNS(SVG_NS, 'g')
  const unten = document.createElementNS(SVG_NS, 'g')
  unten.setAttribute('transform', `translate(0 ${kachel})`)

  const linien = []
  for (let i = 0; i < anzahl; i++) {
    const l = linieAnlegen(wert, i * LINIEN_ABSTAND)
    const paar = [oben, unten].map((gruppe) => {
      const pfad = document.createElementNS(SVG_NS, 'path')
      // Normierte Länge fürs Selbstzeichnen: Strichmuster 100 deckt den
      // ganzen Pfad, die Aufzieh-Animation schiebt den Versatz auf 0.
      pfad.setAttribute('pathLength', '100')
      // Zwei Messgrössen wie in der App: Volt = Kraft, Cyan = Puls/Ausdauer.
      // (Nur im Breit-Layout sichtbar — schmal sind sie ersatzlos aus,
      // Entscheidung vom 04.09.: ohne Diagonale kein Sonderstrich.)
      if (i === Math.floor(anzahl / 3)) pfad.setAttribute('class', 'kulisse-volt')
      else if (i === Math.floor((anzahl * 2) / 3)) pfad.setAttribute('class', 'kulisse-cyan')
      // Linie für Linie leicht versetzt zeichnen.
      pfad.style.animationDelay = `${(i * 0.06).toFixed(2)}s`
      gruppe.append(pfad)
      return pfad
    })

    /**
     * **Wanderstücke fürs Schmal-Layout** (neue Entscheidung des Nutzers vom
     * 04.09. — die am 03.09. verworfenen Messimpulse kehren mobil zurück):
     * Auf jeder vierten grauen Linie fährt ein kurzes Farbstück von links
     * nach rechts, abwechselnd Volt und Cyan, jedes mit eigenem Tempo und
     * Versatz. Der Träger ist die normale graue Linie — das Stück liegt als
     * eigener Pfad darüber und bekommt beim Morph dasselbe `d` (er steckt im
     * selben `paar`). Breit sind die Stücke per Stylesheet aus.
     */
    // Jede zweite Linie trägt ein Stück („mehr Wanderstücke", 04.09.) —
    // Farben im Wechsel, Tempi weiterhin je Linie eigen.
    const traegt = i % 2 === 1
    if (traegt) {
      const dauer = (9 + wert() * 6).toFixed(1)
      const versatz = (-wert() * 12).toFixed(1)
      for (const gruppe of [oben, unten]) {
        const stueck = document.createElementNS(SVG_NS, 'path')
        stueck.setAttribute('pathLength', '100')
        stueck.setAttribute('class', i % 4 === 1 ? 'kulisse-stueck-volt' : 'kulisse-stueck-cyan')
        stueck.style.animationDuration = `${dauer}s`
        stueck.style.animationDelay = `${versatz}s`
        gruppe.append(stueck)
        paar.push(stueck)
      }
    }

    linien.push({ l, paar })
  }

  svg.append(oben, unten)
  lage.append(svg)
  return { lage, linien }
}

export function kulisseAufbauen() {
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const halter = document.createElement('div')
  halter.className = 'kulisse'
  halter.setAttribute('aria-hidden', 'true')

  const neigung = document.createElement('div')
  neigung.className = 'kulisse-neigung'
  const a = schichtBauen(11, 14)
  a.lage.classList.add('kulisse-lage-a')
  const b = schichtBauen(29, 17)
  b.lage.classList.add('kulisse-lage-b')
  neigung.append(b.lage, a.lage) // die langsamere Schicht liegt hinten

  const alle = [...a.linien, ...b.linien]
  const malen = (t) => {
    for (const { l, paar } of alle) {
      const d = dFuer(l, t)
      // Alle Kopien einer Linie — inklusive eventueller Wanderstücke.
      for (const pfad of paar) pfad.setAttribute('d', d)
    }
  }
  malen(0)

  halter.append(neigung)
  document.body.prepend(halter)

  /* Kartenschwenk: an der echten Scroll-Position, damit auch Rollbalken und
     Anker mitgenommen werden. Die Karte fährt der Seite entgegen — man reist
     über sie hinweg. */
  let letztY = -1
  const schwenken = () => {
    const y = window.scrollY
    if (y === letztY) return
    letztY = y
    neigung.style.translate = `0 ${(-(y * SCHWENK)).toFixed(1)}px`
  }
  schwenken()

  let laeuft = true
  // **Das Atmen ist ein Breitbild-Luxus** (04.09.): Auf dem Handy ist der
  // laufende Pfad-Morph reine Dauerrechnung fürs Nichts — Drift und
  // Wanderstücke sind CSS-Animationen und tragen die Bewegung dort allein.
  const breit = window.matchMedia('(min-width: 901px)')
  if (ruhig) {
    // Ohne Systembewegung: Landschaft statisch, aber die Karte folgt weiter
    // dem vom Nutzer ausgelösten Scroll.
    window.addEventListener('scroll', schwenken, { passive: true })
  } else {
    // Morph auf jedem zweiten Bild (~30 Hz) — für Zeitlupe mehr als genug,
    // und halbiert die Rechenarbeit.
    let gerade = false
    const bild = (jetzt) => {
      if (!laeuft) return
      schwenken()
      gerade = !gerade
      if (gerade && breit.matches) malen(jetzt / 1000)
      requestAnimationFrame(bild)
    }
    requestAnimationFrame(bild)
  }

  return () => {
    laeuft = false
    window.removeEventListener('scroll', schwenken)
    halter.remove()
  }
}
