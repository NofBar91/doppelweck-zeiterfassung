# Doppelweck · Fahrer-Zeiterfassung

Arbeitszeiten und Touren für das Doppelweck-Fahrerteam. Next.js 15, React 19, NextAuth und Prisma.

## Bedienung

- Fahrer erfassen Datum, Beginn, Ende, Ort und Kilometer. Entwürfe und zurückgegebene Einträge bleiben bearbeitbar.
- Die Übersicht zeigt die Stunden und Touren des laufenden Monats sowie offene Einträge. Eine Suche und ein Monatsfilter grenzen die Liste ein.
- Mit „Tag einreichen“ oder „Monat einreichen“ werden offene Zeiten zur Prüfung gesperrt.
- Die Verwaltung kann Zeiten filtern, bearbeiten, freigeben, zurückgeben und als CSV exportieren sowie Mitarbeiter und Einladungen verwalten.
- Anmeldung, Einladung und Passwort-Wiederherstellung sind unter `/login`, `/invite/[token]`, `/forgot` und `/reset/[token]` erreichbar.

## Entwicklung

```sh
npm ci
npm run prisma:gen:dev
npm run prisma:push:dev
npm run dev
```

Für lokale Anmeldung `NEXTAUTH_URL=http://localhost:3000` und einen eigenen `NEXTAUTH_SECRET` in `.env` setzen. Der lokale Client verwendet `prisma/schema.sqlite.prisma`. Der Produktionsclient wird wie bisher mit `prisma/schema.postgres.prisma` generiert. Bestehende Produktionsvariablen für Datenbank, Authentifizierung und E-Mail-Versand bleiben erforderlich. Das Redesign benötigt keine Datenmigration und keine zusätzlichen Dienste.

## Prüfungen

```sh
npm run lint
npx tsc --noEmit
npx vitest run
```

Vollständige Browserprüfung mit einer separaten, wegwerfbaren SQLite-Datenbank:

```sh
npm run test:e2e:prepare
npm run build
npx playwright install chromium
# NEXTAUTH_URL und NEXTAUTH_SECRET müssen auch für den Testserver gesetzt sein.
CI=1 npm run e2e
```

`test:e2e:prepare` setzt ausschließlich `.e2e/e2e.db` zurück und generiert den Prisma-Client für diese Testdatenbank. Nach lokalen Tests mit `npm run prisma:gen:dev` bzw. `npm run prisma:gen:pg` wieder den gewünschten Client erzeugen. Nie einen für E2E generierten Build produktiv ausliefern.

GitHub Actions prüft Pull Requests und Änderungen auf `main`/`master`, ohne Produktionsdatenbank oder Secrets zu verwenden. Browserberichte und Desktop-/Mobilaufnahmen werden als `doppelweck-ui-report` hochgeladen.

## Gestaltung

Warmer Papierhintergrund, weiße Arbeitsflächen, dunkle Schrift und ein zurückhaltender Backstuben-Akzent. Gemeinsame Komponenten für Navigation, Formulare und Dialoge. Deutsches Datumsformat, beschriftete Eingaben, sichtbare Tastaturfokusse und mobile Kartenansichten. Bisher konfigurierte saisonale Theme-Namen bleiben kompatibel und verwenden das einheitliche Arbeitslayout.
