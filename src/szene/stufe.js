/**
 * Eine Stufe: Das Gerät fällt herein, und dann bedient **jede Scroll-Bewegung
 * einen Schritt** in der App.
 *
 * Die Stufe lauscht selbst auf nichts mehr. Eingaben nimmt der Ablauf
 * (`ablauf.js`) entgegen und ruft hier an: `eintreten`, wenn die Fahrt auf das
 * Segment losgeht, `bediene` für jede Bewegung darauf. Vorher hatte die Stufe
 * eigene Rad-, Wisch- und Tastenhorcher plus einen IntersectionObserver mit
 * Einrasten — zwei Systeme am selben Rad, und das Einrasten feuerte schon beim
 * Aufbau (der Reload-Fehler vom 02.09.).
 *
 * **Bilder statt Video.** Ein Video muss bei jedem Sprung neu dekodieren —
 * daher das Hängen. Die Zustände liegen als Einzelbilder übereinander und
 * werden nur ein- und ausgeblendet: sofort da, ohne Decoder. Die Bilder sind
 * Screenshots des Nutzers, in Bedienreihenfolge.
 */

export function stufeAufbauen(abschnitt) {
  const geraet = abschnitt.querySelector('[data-fallgeraet]')
  const gefallen = abschnitt.querySelector('[data-gefallen]')
  const bilder = [...abschnitt.querySelectorAll('[data-bilder] img')]
  const texte = [...abschnitt.querySelectorAll('[data-texte] > *')]
  const glanz = abschnitt.querySelector('[data-glanz2]')
  const kante = abschnitt.querySelector('.ebene-kante')
  if (!geraet || !gefallen) return null


  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const LETZTER = Math.max(0, bilder.length - 1)

  let schritt = 0

  /* --- Bilder --------------------------------------------------------------- */

  function zeigeSchritt() {
    bilder.forEach((bild, i) => bild.classList.toggle('da', i === schritt))
    // Der Erklärtext wechselt synchron zum Bild.
    texte.forEach((text, i) => text.classList.toggle('da', i === schritt))
    if (glanz) {
      // Der Glanz wandert mit — als läge das Gerät bei jedem Tipp minimal anders
      // im Licht.
      glanz.style.backgroundPosition = `${(50 - schritt * 6).toFixed(0)}% ${(30 + schritt * 8).toFixed(0)}%`
    }
    if (kante) {
      // Die Volt-Linie deckt sich von oben nach unten auf: ein Anteil je Bild.
      // 100 % heisst verborgen, 0 % vollständig — siehe Maske im Stylesheet.
      const anteil = (schritt + 1) / (LETZTER + 1)
      const lage = `0 ${((1 - anteil) * 100).toFixed(1)}%`
      kante.style.webkitMaskPosition = lage
      kante.style.maskPosition = lage
    }
    // Beim letzten Bild ist die Reihe durch — ab da rinnt der Puls die Kante
    // hinunter (Stylesheet, `.stufe.fertig::after`): „hier geht es weiter".
    abschnitt.classList.toggle('fertig', schritt === LETZTER)
  }
  zeigeSchritt()

  /* --- Der Fall ------------------------------------------------------------- */

  /**
   * **Weiche Landung ohne Federn** (Wunsch vom 04.09.; davor ein Nachfederer,
   * davor Dreifach-Hüpfen — beides verworfen): schnell herein, sanft
   * auslaufend zum Stillstand.
   */
  function abfedern(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  let fallNr = 0

  function fallen() {
    const nr = ++fallNr
    const start = performance.now()
    const bild = (jetzt) => {
      if (nr !== fallNr) return
      // 550 ms statt 900: schnellerer Fall (Wunsch vom 04.09.).
      const t = Math.min(1, (jetzt - start) / 550)
      const weich = ruhig ? t : abfedern(t)
      gefallen.style.transform = `translateY(${((1 - weich) * -window.innerHeight * 0.7).toFixed(1)}px)`
      geraet.style.opacity = String(Math.min(1, t * 3))
      if (t < 1) requestAnimationFrame(bild)
    }
    requestAnimationFrame(bild)
  }

  /* --- Schnittstelle zum Ablauf ---------------------------------------------- */

  const api = {
    el: abschnitt,

    /**
     * Die Fahrt auf dieses Segment geht los. Von oben kommend beginnt die
     * Reihe vorn und das Gerät fällt herein; von unten kommend steht sie am
     * Ende — so laufen die Schritte rückwärts wieder heraus, und das Gerät
     * steht schon da, wo man es verlassen hat. Eine seitlich geparkte Ebene
     * (siehe `verlassen`) fährt wieder herein. An der oberen Grenze bewegt
     * sich die Ebene nicht — Auf-/Zudeck-Animationen dort waren gebaut und
     * wurden am 04.09. verworfen.
     */
    eintreten(richtung) {
      abschnitt.classList.remove('abseits-links')
      schritt = richtung >= 0 ? 0 : LETZTER
      zeigeSchritt()
      if (richtung >= 0) {
        fallen()
      } else {
        fallNr++ // ein etwa laufender Fall bricht ab
        gefallen.style.transform = 'none'
        geraet.style.opacity = '1'
      }
    },

    /**
     * Die Stufe wird verlassen. **Abwärts** fährt die linke Ebene seitlich
     * nach links hinaus (Stylesheet, `abseits-links`) und kommt beim nächsten
     * Eintritt von dort wieder. **Aufwärts** bleibt die Ebene stehen (die
     * Auf-/Zudeck-Animation an der oberen Grenze wurde am 04.09. verworfen)
     * — dort zieht nur das Gerät davon: der Fall rückwärts, beschleunigend;
     * am Ende unsichtbar, der nächste Eintritt von oben fällt frisch.
     */
    verlassen(richtung) {
      if (richtung >= 0) {
        abschnitt.classList.add('abseits-links')
        return
      }
      const nr = ++fallNr
      const start = performance.now()
      const bild = (jetzt) => {
        if (nr !== fallNr) return
        const t = Math.min(1, (jetzt - start) / 450)
        const zug = ruhig ? t : t * t
        gefallen.style.transform = `translateY(${(-zug * window.innerHeight * 0.7).toFixed(1)}px)`
        // Spiegelbild des Eintritts: Der blendet im ersten Drittel ein, der
        // Abgang erst im letzten Drittel aus — das Gerät bleibt sichtbar,
        // solange es fliegt, statt vorzeitig zu verschwinden.
        geraet.style.opacity = String(Math.min(1, (1 - t) * 3))
        if (t < 1) requestAnimationFrame(bild)
      }
      requestAnimationFrame(bild)
    },

    /**
     * Eine Bewegung auf dem Segment. Gibt zurück, ob sie einen Bildschritt
     * verbraucht hat — am Ende der Reihe nicht mehr, dann zieht der Ablauf
     * weiter.
     */
    bediene(richtung) {
      const neu = schritt + richtung
      if (neu < 0 || neu > LETZTER) return false
      schritt = neu
      zeigeSchritt()
      return true
    },
  }
  return api
}
