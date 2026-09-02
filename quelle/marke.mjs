/**
 * Erzeugt `oeffentlich/logo.svg` aus der **echten** Bildmarke.
 *
 * Die Konturen stehen in `AIA-native/src/data/logoPaths.ts` und wurden dort aus
 * der Originaldatei gewonnen. Sie hier abzuzeichnen wäre eine erfundene Marke —
 * deshalb wird importiert, nicht nachgebaut.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = dirname(fileURLToPath(import.meta.url))
const APP = join(process.env.AIA_NATIVE ?? join(HIER, '..', '..', 'AIA-native'), 'src', 'data')

const { logoKonturen, LOGO_VIEWBOX } = await import(join(APP, 'logoPaths.ts'))

/** Volle Marke, Kontur in Volt, die Buchstaben A-i-A gefüllt — wie in der App. */
const pfade = logoKonturen
  .map((k) => `<path d="${k.d}" fill="${k.istAIA ? '#c8ff4d' : 'none'}" stroke="#c8ff4d" stroke-width="26" stroke-linejoin="round"/>`)
  .join('')

writeFileSync(
  join(HIER, '..', 'oeffentlich', 'logo.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}">${pfade}</svg>`,
)

/** Die Bildmarke für den Kopfbereich der Website — in Volt, wie der
 *  Startauftritt der App (Entscheidung vom 03.09.; Weiss war kurz gebaut).
 *  **Nur die 5 Marken-Konturen**, der Schriftzug fliegt raus: Er wäre
 *  unsichtbar (ausserhalb des Ausschnitts), zählte aber im Zeichen-Takt mit
 *  und verzögerte die Füllung um über eine Sekunde. Gefiltert wird über die
 *  Geometrie — die Marke endet bei y = 559, die Schrift beginnt erst bei 715
 *  (im Browser gemessen); `data-fuellt` markiert, was sich nach dem Zug
 *  füllt. */
const marke = logoKonturen.filter((k) => {
  const zahlen = (k.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const hoechstesY = Math.max(...zahlen.filter((_, i) => i % 2 === 1))
  return hoechstesY < 600
})
if (marke.length !== 5) {
  throw new Error(`Bildmarke: 5 Konturen erwartet, ${marke.length} gefunden — Filter prüfen`)
}
const zug = marke
  .map((k) => `<path d="${k.d}" fill="none" stroke="#c8ff4d" stroke-width="18" stroke-linejoin="round" data-fuellt="${k.istAIA ? 1 : 0}"/>`)
  .join('')

writeFileSync(
  join(HIER, '..', 'oeffentlich', 'bildmarke.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 1014 588">${zug}</svg>`,
)

/** Die kleine Marke für Leiste und Favicon: **die vollständige Bildmarke**,
 *  mit allen Innendetails — identisch zur grossen, nur mit Strichstärke 36
 *  statt 18, damit die Linien bei 40 px tragen. Zwei frühere Anläufe
 *  (Buchstaben; reduzierte Zwei-Konturen-Fassung mit Trennfuge) hat der
 *  Nutzer am 03.09. verworfen: Die Marke soll klein exakt aussehen wie
 *  gross. */
const klein = marke
  .map((k) => `<path d="${k.d}" fill="${k.istAIA ? '#c8ff4d' : 'none'}" stroke="#c8ff4d" stroke-width="36" stroke-linejoin="round"/>`)
  .join('')

writeFileSync(
  join(HIER, '..', 'oeffentlich', 'marke.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-36 -36 1058 632">${klein}</svg>`,
)

console.log(`Marke erzeugt: ${logoKonturen.length} Konturen`)
