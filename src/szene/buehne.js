/**
 * Die Gerätebühne: Apples Rahmen, deine Aufnahme, unser Licht.
 *
 * **Warum kein 3D mehr.** Ein iPhone aus Geometrie zu bauen ergibt einen
 * abgerundeten Quader — Kameramodul, Tastenkerben und die doppelte Glaswölbung
 * am Rand fehlen, und genau daran erkennt man ein iPhone. Ein gekauftes Modell
 * wäre möglich, aber Apples Marketing-Richtlinien sehen vor, dass man **ihre**
 * Produktbilder verwendet statt eigene Nachbildungen. Der Rahmen aus den Apple
 * Design Resources ist deshalb nicht nur der schönere, sondern auch der
 * zulässige Weg.
 *
 * **Was an die Stelle der Drehung tritt:** Neigung zum Zeiger, ein Glanz, der
 * über das Glas wandert, Volt-Licht hinter dem Gerät und ein Schatten, der
 * mitzieht. Zusammen ergibt das Tiefe — ohne ein einziges Megabyte Modell.
 */

/**
 * **Gerade ist der Nullpunkt, die Schräge ist die Reaktion.**
 *
 * Im Ruhezustand steht das Gerät frontal: keine Drehung in der Bildebene, keine
 * Grundneigung im Raum, alle vier Ränder gleich breit. Das ist der Zustand, den
 * man beim Laden sieht — und auf Touchgeräten dauerhaft, weil es dort keinen
 * Zeiger gibt.
 *
 * Erst die Zeigerbewegung neigt es räumlich. Die perspektivische Verkürzung, die
 * dabei entsteht, ist gewollt: Sie *ist* die Räumlichkeit. Wird die Maus wieder
 * ruhig, läuft das Gerät in die gerade Lage zurück — dieselbe Dämpfung, die es
 * auch hinbewegt.
 */
// **Sehr enge Grenze.** Schon bei sechs Grad verriet die Neigung, dass das
// Gerät eine flache Aufnahme ist (die Kante wurde sichtbar dünn) — auf
// Wunsch vom 03.09. auf zwei Grad reduziert: Es reagiert noch, kippt aber
// nie so weit, dass man die Seite sieht.
const NEIGUNG = 2 // Grad, maximal, an den Rändern der Bühne

export function geraetebuehne(wurzel) {
  const gerahmt = wurzel.querySelector('[data-gerahmt]')
  const glanz = wurzel.querySelector('[data-glanz]')
  if (!gerahmt) return { zeigeFortschritt() {}, beenden() {} }

  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let zielX = 0
  let zielY = 0
  let x = 0
  let y = 0
  let fortschritt = 0
  let laeuft = true

  function beiZeiger(e) {
    const b = wurzel.getBoundingClientRect()
    zielX = ((e.clientX - b.left) / b.width - 0.5) * 2
    zielY = ((e.clientY - b.top) / b.height - 0.5) * 2
  }
  if (!ruhig) window.addEventListener('pointermove', beiZeiger, { passive: true })

  let letzte = performance.now()
  function bild(jetzt) {
    if (!laeuft) return
    const dt = Math.min((jetzt - letzte) / 1000, 0.05)
    letzte = jetzt

    // Nachlaufen statt springen — die Bewegung soll schwer wirken, nicht nervös.
    const zug = 1 - Math.pow(0.002, dt)
    x += (zielX - x) * zug
    y += (zielY - y) * zug

    gerahmt.style.transform =
      `translateY(${(-fortschritt * 90).toFixed(1)}px) ` +
      `scale(${(1 - fortschritt * 0.12).toFixed(3)}) ` +
      // Waagerechte Zeigerbewegung dreht um die Hochachse, senkrechte um die
      // Querachse. Ohne Zeigerbewegung sind beide null — dann steht es gerade.
      `rotateY(${(x * NEIGUNG).toFixed(2)}deg) ` +
      `rotateX(${(-y * NEIGUNG * 0.62).toFixed(2)}deg)`

    if (glanz) {
      // Der Glanz läuft dem Zeiger entgegen — so verhält sich eine spiegelnde
      // Fläche unter einer festen Lichtquelle.
      // Nur der Verlauf wandert; die Fläche bleibt, wo sie ist. So bleibt die
      // Spiegelung auf dem Glas, statt über die Gehäusekante zu laufen.
      glanz.style.backgroundPosition =
        `${(50 - x * 26).toFixed(1)}% ${(50 - y * 18).toFixed(1)}%`
    }

    requestAnimationFrame(bild)
  }
  requestAnimationFrame(bild)

  return {
    zeigeFortschritt(wert) {
      fortschritt = Math.max(0, Math.min(1, wert))
    },
    beenden() {
      laeuft = false
      window.removeEventListener('pointermove', beiZeiger)
    },
  }
}
