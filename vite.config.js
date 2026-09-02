import { defineConfig } from 'vite'
import { resolve } from 'node:path'

/**
 * Die Website von AIA.
 *
 * **Alles wird mitgeliefert, nichts nachgeladen.** Schriften und Bibliotheken
 * liegen im Bündel; es gibt keinen Aufruf an ein CDN. Das ist keine Vorliebe:
 * Ein Aufruf an fonts.googleapis.com überträgt die IP-Adresse jedes Besuchers an
 * Google in die USA — das LG München I hat darin einen DSGVO-Verstoss gesehen
 * (Az. 3 O 17493/20). Auf einer Seite, deren Kernaussage lautet, dass Daten das
 * Gerät nicht verlassen, wäre das der falsche Anfang.
 *
 * **Ausgabe nach `docs/`**, weil GitHub Pages diesen Ordner ausliefert.
 */
export default defineConfig({
  publicDir: 'oeffentlich',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      // Jede Seite ein eigener Einstiegspunkt. Die Rechtsseiten erzeugt
      // `quelle/rechtstexte.mjs` vor dem Bauen aus der App-Quelle.
      input: {
        start: resolve(process.cwd(), 'index.html'),
        datenschutz: resolve(process.cwd(), 'datenschutz.html'),
        nutzungsbedingungen: resolve(process.cwd(), 'nutzungsbedingungen.html'),
        impressum: resolve(process.cwd(), 'impressum.html'),
        support: resolve(process.cwd(), 'support.html'),
      },
    },
  },
  server: { port: 5192, strictPort: true },
})
