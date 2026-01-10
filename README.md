# Muse

Local creative writing workspace built with Laravel + Vue + Quill.

![Muse main page](docs/Muse%20main%20page.png)

## Install

```sh
composer install
npm install
```

## Setup

```sh
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
```

If you have WonderPen data, place it at `storage/app/private/data.json`.

## Run locally

```sh
composer install
npm install
php artisan migrate
php artisan import:wonderpen --fresh
npm run dev
```

Open `http://localhost:8000`.

## Notes

- SQLite database lives at `database/database.sqlite`.
- Redis is optional; this is designed for local/electron-style use.

## Features

- Book and chapter organization with live editing.
- Quill editor with autosave and manual save.
- Characters catalog (multi-book ready).
- WonderPen import command for legacy content review.
- PDF export for full books.

## Roadmap

### Writing

- Drag and drop chapter ordering.
- Notes management per story.
- Character management across multiple stories.
- Export as EPUB (if feasible).
- Focus mode, hide both sidebars.

### Data + Sync

- Word count jobs and per-book stats.
- Optional local backups and import/export bundles.
- Automated local backups (scheduled or on close).
- Optional cloud backups (Google Drive).

### UX

- Chapter lock/protect toggle.
- Draft comparison / revision history.
- Editor-focused scrolling (sidebars fixed).
- Split Vue app into layout + page components (avoid monolithic SFC).
- Optional dark mode theme.

### Release

- Package as a desktop app (Electron/Tauri).

## Data import

```sh
php artisan import:wonderpen --fresh
```

## Exports

Planned: PDF export (and EPUB if feasible).

- Drag and drop chapter ordering.
- Notes management per story.
- Character management across multiple stories.
- Export as PDF (and EPUB if feasible).
