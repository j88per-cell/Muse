# Muse

Local creative writing workspace built with Laravel + Vue + Quill.

I created muse after struggling to find an application to write.  I was using various tools including word, libre office, and more.  Eventually settling on Wonderpen until it refused to start and scared me I'd lost dozens of stories.
I just want something simple to be able to write.  Without fear that paste will change formats, fonts, sizes.  To not have to struggle with inconsistent formatting rules. And that is the thinking behind Muse.  
I'm happy to have recovered my works and can return to them and enjoy writing more with Muse.

For now, this is *alpha* level software.  The target will be either an electron or Tauri 'app' for people to run on their machine.  With export and backup capabilities that are open, non-proprietary.  

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

## Features

- Book and chapter organization with live editing.
- Quill editor with autosave and manual save.
- Characters catalog (multi-book ready).
- WonderPen import command for legacy content review.
- PDF export for full books.
- Manual backup export (Markdown + JSON).

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

### Release

- Package as a desktop app (Electron/Tauri).

## Data import

```sh
php artisan import:wonderpen --fresh
```

## Exports

Manual backup export:

```sh
http://localhost:8000/exports/backup
```

The export writes to a local folder under `storage/app/exports/` and returns the path in JSON.
