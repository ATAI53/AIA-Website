# AIA — Website

Die öffentliche Seite zur iPhone-App **AIA**: Startseite, Support und die
Rechtstexte. Sie erfüllt zwei Pflichtfelder in App Store Connect — die
**Datenschutz-URL** und die **Support-URL**.

## Aufbau

| | |
|---|---|
| `docs/` | die fertigen Seiten. **Diesen Ordner liefert GitHub Pages aus.** |
| `bauen.mjs` | erzeugt `docs/*.html` |
| `docs/stil.css` | das Aussehen; wird nicht erzeugt, sondern von Hand gepflegt |
| `vorschau.mjs` | kleiner Server für die lokale Ansicht (`node vorschau.mjs`) |

## Neu bauen

```
node bauen.mjs
```

**Die Rechtstexte werden nicht hier gepflegt.** `bauen.mjs` importiert sie aus
`~/Desktop/AIA-native/src/data/rechtstexte.ts` — derselben Datei, aus der die
App sie anzeigt. Ändert sich ein Text dort, genügt hier ein Neubau, und beide
Fassungen stimmen wieder überein. Zwei getrennt gepflegte Datenschutzerklärungen
laufen auseinander, und im Zweifel ist die in der App die verbindliche.

Dasselbe gilt für das Logo: die Konturen kommen aus `logoPaths.ts`.

## Was hier bewusst fehlt

Preise, ein App-Store-Link und Screenshots — alles drei existiert noch nicht.
Sobald die Aufnahmen für den Store entstehen, wandern dieselben Bilder auf die
Startseite.
