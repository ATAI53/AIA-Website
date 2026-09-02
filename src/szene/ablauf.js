/**
 * Der Ablauf der Seite: **ein Scroll, ein Segment.**
 *
 * Die Seite scrollt nicht frei. Sie besteht aus Segmenten von je einer
 * Bildschirmhöhe, und jede Scroll-Bewegung — Radklick, Wischgeste, Tastendruck —
 * bewegt genau ein Segment weiter, vorwärts wie rückwärts. Steht die Seite auf
 * einer Stufe, verbraucht dieselbe Bewegung zuerst die Bedienschritte im Gerät;
 * erst am Ende der Reihe verlässt sie das Segment.
 *
 * **Warum kein Einrasten mehr.** Vorher scrollte der Browser frei, und ein
 * IntersectionObserver zog die Seite nachträglich auf den Abschnitt. Zwei
 * Systeme am selben Rad: Das Einrasten feuerte schon beim Aufbau — deshalb
 * startete die Seite nach dem Neuladen mitten im Workout-Abschnitt, ohne dass
 * jemand gescrollt hatte. Jetzt bewegt sich die Seite ausschliesslich auf eine
 * Eingabe hin; ohne Eingabe steht sie, auch direkt nach dem Laden.
 *
 * **Eine Geste ist eine Bewegung.** Ein Trackpad feuert dutzende Rad-Ereignisse
 * je Wisch, mit auslaufender Stärke. Deshalb wird nach jeder Aktion gesperrt,
 * und die Sperre fällt erst, wenn die Ereignisse eine Weile geschwiegen haben —
 * das Ausrollen einer Geste zählt so nie als zweite.
 */

/** Wie lange der Wechsel zwischen zwei Segmenten dauert, in Millisekunden. */
const DAUER = 700

/** So lange müssen Rad-Ereignisse schweigen, bevor die nächste Geste zählt. */
const RUHE = 140

/** Mindestsperre nach einem Bildschritt — auch ein Mausrad soll nicht rattern. */
const MINDESTSPERRE = 180

/** Rad-Ausschläge darunter sind Zittern, keine Absicht. */
const TOTZONE = 4

/** Ab dieser Fingerbewegung gilt eine Wischgeste als eine Bewegung. */
const WISCH = 50

/**
 * @param {{ el: Element, stufe?: { eintreten(richtung: number): void, bediene(richtung: number): boolean } }[]} segmente
 *   Die Abschnitte in Seitenreihenfolge. `stufe` ist die Bedienschrittfolge,
 *   falls der Abschnitt eine hat: `bediene` gibt zurück, ob der Schritt die
 *   Bewegung verbraucht hat.
 * @param {{ beiWechsel?: (index: number) => void }} [optionen]
 *   `beiWechsel` wird bei jedem Segmentwechsel gerufen — für Anzeigen, die den
 *   Stand spiegeln (die Punkte am rechten Rand).
 */
export function ablaufAufbauen(segmente, { beiWechsel } = {}) {
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let index = 0
  let animiert = false
  let gesperrt = false
  let letzteEingabe = 0

  /**
   * **Vor der ersten echten Eingabe gehört die Position uns.** Browser stellen
   * beim Laden alte Scroll-Positionen und Anker wieder her — teils erst, wenn
   * Bilder geladen sind, und an `scrollRestoration = 'manual'` vorbei. Solange
   * der Nutzer die Seite nicht angefasst hat, wird jede Fremdbewegung auf das
   * aktuelle Segment zurückgesetzt statt übernommen. Das Fenster ist begrenzt,
   * damit ein früher Griff zum Rollbalken nicht dauerhaft abprallt.
   */
  let angefasst = false
  let beginn = performance.now()
  window.addEventListener('load', () => {
    beginn = performance.now()
  })

  /* --- Ziele ----------------------------------------------------------------- */

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

  /**
   * Das letzte Segment zielt ans Dokumentende, nicht an seine Oberkante — so
   * kommt der Fuss mit ins Bild, ohne ein eigenes Segment zu sein.
   */
  function zielFuer(i) {
    if (i === segmente.length - 1) return maxScroll()
    return Math.min(segmente[i].el.offsetTop, maxScroll())
  }

  /* --- Die Fahrt ------------------------------------------------------------- */

  let fahrtNr = 0

  // Immer ausdrücklich `instant`: Ein `scroll-behavior: smooth` am html würde
  // sonst jedem Einzelbild der Fahrt eine eigene Gleitfahrt unterschieben.
  const setzeY = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' })

  /**
   * `beiAnkunft` feuert, sobald **80 % des Weges** zurückgelegt sind (bzw.
   * sofort, wenn ohne Animation gesprungen wird) — daran hängt der Eintritt
   * des Zielsegments: Das Gerät fällt erst, wenn die Fahrt praktisch
   * angekommen ist (Wunsch vom 04.09.), nicht schon beim Losfahren.
   */
  function fahreZu(ziel, beiAnkunft) {
    const start = window.scrollY
    if (ruhig || Math.abs(ziel - start) < 2) {
      setzeY(ziel)
      beiAnkunft?.()
      return
    }
    const nr = ++fahrtNr
    const ab = performance.now()
    animiert = true
    let gemeldet = false
    const schritt = (jetzt) => {
      if (nr !== fahrtNr) return // eine neuere Fahrt hat übernommen
      const t = Math.min(1, (jetzt - ab) / DAUER)
      // Sanft anfahren, sanft ankommen.
      const weich = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      setzeY(start + (ziel - start) * weich)
      if (!gemeldet && weich >= 0.8) {
        gemeldet = true
        beiAnkunft?.()
      }
      if (t < 1) requestAnimationFrame(schritt)
      else {
        animiert = false
        if (!gemeldet) {
          gemeldet = true
          beiAnkunft?.()
        }
      }
    }
    requestAnimationFrame(schritt)
  }

  /* --- Sperre ---------------------------------------------------------------- */

  function entsperren() {
    if (!animiert && performance.now() - letzteEingabe >= RUHE) {
      gesperrt = false
      return
    }
    setTimeout(entsperren, 60)
  }

  function sperren() {
    gesperrt = true
    setTimeout(entsperren, MINDESTSPERRE)
  }

  /* --- Bewegung -------------------------------------------------------------- */

  function bewegung(richtung) {
    if (animiert) return
    const hier = segmente[index]
    if (hier.stufe && hier.stufe.bediene(richtung)) return
    const neu = index + richtung
    if (neu < 0 || neu >= segmente.length) return
    // Die verlassene Stufe räumt sofort mit Fahrtbeginn: Textspalte fährt
    // hinaus (beide Richtungen), aufwärts zieht zusätzlich das Gerät davon.
    hier.stufe?.verlassen?.(richtung)
    index = neu
    beiWechsel?.(neu)
    fahreZu(zielFuer(neu), () => segmente[neu].stufe?.eintreten(richtung))
  }

  /**
   * Springen statt schrittweise fahren — für Verweise in der Leiste. Die
   * Bedienschritte dazwischenliegender Stufen werden dabei nicht abgespult.
   */
  function springeZu(el) {
    const i = segmente.findIndex((s) => s.el === el || s.el.contains(el))
    if (i < 0 || i === index) return
    const richtung = i > index ? 1 : -1
    segmente[index].stufe?.verlassen?.(richtung)
    index = i
    beiWechsel?.(i)
    sperren()
    fahreZu(zielFuer(i), () => segmente[i].stufe?.eintreten(richtung))
  }

  /* --- Eingaben -------------------------------------------------------------- */

  /**
   * **Eine neue Geste mitten im Auslaufen der alten erkennen.** Ein Trackpad
   * lässt eine Geste sekundenlang ausrollen; wer zügig weiterwischt oder
   * umdreht, fiele sonst in die Sperre und der Wisch verpuffte. Das Auslaufen
   * fällt in der Stärke stetig ab — springt der Betrag wieder deutlich nach
   * oben, nachdem er gefallen war, ist das eine neue Absicht und zählt sofort.
   * Das erkennt auch das Umdrehen: Die erste Gegenbewegung ist so ein Sprung.
   */
  let letzterBetrag = 0
  let fallend = false

  function beiRad(e) {
    e.preventDefault()
    angefasst = true
    letzteEingabe = performance.now()
    const betrag = Math.abs(e.deltaY)
    if (betrag < TOTZONE) return
    const anlauf = fallend && betrag >= 24 && betrag > letzterBetrag * 1.5
    fallend = betrag < letzterBetrag
    letzterBetrag = betrag
    if (animiert) return
    if (gesperrt && !anlauf) return
    sperren()
    bewegung(e.deltaY > 0 ? 1 : -1)
  }

  let fingerY = null
  let fingerVerbraucht = false

  function beiFingerStart(e) {
    angefasst = true
    fingerY = e.touches[0]?.clientY ?? null
    fingerVerbraucht = false
  }

  function beiFinger(e) {
    // Die Seite scrollt nie selbst — auch nicht unter dem Finger.
    e.preventDefault()
    if (fingerVerbraucht || fingerY === null || animiert) return
    const weg = fingerY - (e.touches[0]?.clientY ?? fingerY)
    if (Math.abs(weg) < WISCH) return
    fingerVerbraucht = true
    bewegung(weg > 0 ? 1 : -1)
  }

  function beiTaste(e) {
    // Wer auf einem Verweis oder Knopf steht, meint diesen — nicht die Seite.
    if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select')) return
    const runter = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' '
    const hoch = e.key === 'ArrowUp' || e.key === 'PageUp'
    if (!runter && !hoch) return
    e.preventDefault()
    angefasst = true
    if (animiert || gesperrt) return
    sperren()
    bewegung(runter ? 1 : -1)
  }

  /**
   * Der Rollbalken bleibt benutzbar: Wer ihn zieht, scrollt an allem vorbei.
   * Nach dem Loslassen zieht die Seite auf das nächstliegende Segment — das
   * feuert nur nach echten Scroll-Ereignissen, nie beim Laden.
   */
  let ruheZeit = null
  function beiScroll() {
    if (animiert) return
    // Fremdbewegung beim Laden (Wiederherstellung, Anker): zurück auf Anfang.
    if (!angefasst && performance.now() - beginn < 1000) {
      if (Math.abs(window.scrollY - zielFuer(index)) >= 2) setzeY(zielFuer(index))
      return
    }
    clearTimeout(ruheZeit)
    ruheZeit = setTimeout(() => {
      if (animiert) return
      const y = window.scrollY
      if (Math.abs(y - zielFuer(index)) < 2) return
      let nah = 0
      for (let i = 1; i < segmente.length; i++) {
        if (Math.abs(y - zielFuer(i)) < Math.abs(y - zielFuer(nah))) nah = i
      }
      const richtung = nah >= index ? 1 : -1
      segmente[index].stufe?.verlassen?.(richtung)
      index = nah
      beiWechsel?.(nah)
      fahreZu(zielFuer(nah), () => segmente[nah].stufe?.eintreten(richtung))
    }, 200)
  }

  function beiGroesse() {
    // Nach einer Grössenänderung sitzt das Segment sonst schief im Fenster.
    if (!animiert) setzeY(zielFuer(index))
  }

  window.addEventListener('wheel', beiRad, { passive: false })
  window.addEventListener('touchstart', beiFingerStart, { passive: true })
  window.addEventListener('touchmove', beiFinger, { passive: false })
  window.addEventListener('keydown', beiTaste)
  window.addEventListener('scroll', beiScroll, { passive: true })
  window.addEventListener('resize', beiGroesse)

  beiWechsel?.(index)

  return {
    springeZu,
    abbauen() {
      window.removeEventListener('wheel', beiRad)
      window.removeEventListener('touchstart', beiFingerStart)
      window.removeEventListener('touchmove', beiFinger)
      window.removeEventListener('keydown', beiTaste)
      window.removeEventListener('scroll', beiScroll)
      window.removeEventListener('resize', beiGroesse)
      clearTimeout(ruheZeit)
    },
  }
}
