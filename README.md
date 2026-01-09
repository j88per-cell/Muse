# Muse

Local creative writing workspace built with Laravel + Vue + Quill.

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

## Roadmap

### Writing

- Drag and drop chapter ordering.
- Notes management per story.
- Character management across multiple stories.
- Export as PDF (and EPUB if feasible).

### Data + Sync

- Word count jobs and per-book stats.
- Optional local backups and import/export bundles.

### UX

- Chapter lock/protect toggle.
- Draft comparison / revision history.
- Editor-focused scrolling (sidebars fixed).

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
