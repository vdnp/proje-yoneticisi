# Changelog

## 1.4.2

### Added
- **New title bar.** Back / forward (also Alt+←/→ and the mouse's back and forward buttons), the current location as clickable chips tinted with the group or project color, and quick buttons for the theme, "always on top" and the mini window. The window buttons have their own design: a line, two corner brackets and a cross, with an accent underline on hover.
- **Mini window.** A small always-on-top launcher with search, favorites and recently opened projects; each project's linked projects are listed indented under it. Enter launches (or opens in the editor), Shift+Enter opens the editor only.

### Fixed
- The bar at the top of a project page (with "Back") ignored the Glass style and stayed opaque.

## 1.4.1

### Added
- **Styles.** Settings → Appearance → Style offers four looks: Classic (the original), Minimal (Linear/Raycast-like: hairlines, tight corners, no shadows), Glass (Fluent/macOS-like: translucent surfaces over a soft accent-tinted backdrop) and Soft (Notion/Arc-like: roomy cards tinted with the project's color, pill chips). Each works with the dark and light themes and every accent color.
- **Card color and layout.** Settings → Appearance also picks how cards show their project's color (Strip, the original; Border, with a tinted edge and the group's name as a badge; Task bar, a bottom bar showing task progress) and how they're laid out (Standard, the original; Status, with git state, task progress and the next task; Side column, with the facts in a column on the right).
- **Update check** in Settings → Updates: shows whether a newer version is on GitHub, with a link to download it, and a small dot on Settings in the sidebar when there is one. Checks only when you click **Check now**, or once a day if you turn on **Check automatically** (off by default). The Microsoft Store version is updated by the Store and doesn't check.
- **Daily backups.** Besides the `.bak` copy, a copy of your data is kept for each of the last 7 days in a `backups` folder next to `data.json`. Settings → Backup lists them (date and project count) and restores any of them with the same merge / replace choice as an import.
- **Undo.** Removing a project (from its page, Settings or the selection bar) or deleting a to-do shows a short "Undo" message at the bottom of the window. Undo brings back exactly what was removed, including its links to other projects.

### Changed
- Removing projects no longer asks for confirmation first; use Undo instead.
- Dropdowns (sort order, editor, group, linked projects, launch script, "Move to group") and message boxes now follow the app's theme and style instead of Windows' plain menus and dialogs. Dropdowns work with the keyboard (arrows, Enter, Esc, type a letter to jump).

### Fixed
- The window buttons in the top-left corner didn't respond to clicks.
- Tag and package-manager chips were hard to read in the light theme.
- Search (the command palette, the project list and the task list) now finds names with a capital I when you type a lowercase i, and the other way round: "ai" finds "AI Chat", "API" finds "api".
- An older data file with an empty entry in its editors list no longer fails to load.

### Development
- Unit tests (Vitest) for the data file schema and its migrations, linked projects, sorting, project detection, git status parsing, search and translations; `npm test` runs them, and CI runs them on every push.

## 1.4.0

### Added
- **Linked projects.** Link projects to each other (a frontend and its backend, say), even when their folders are in different places. Linked projects show on each other's cards and are managed from the new "Linked projects" section of the project page.
- **Launch.** Opens a project together with its linked projects, each in its own editor, and starts each one's chosen "run on launch" script (a package.json script such as `dev`) in its own terminal. Available from the cards, the project page, the tray menu and the command palette (<kbd>Enter</kbd>; <kbd>Shift</kbd>+<kbd>Enter</kbd> opens the editor only).
- **Custom order.** A new "Custom order" sort lets you arrange projects by dragging cards. The chosen sort is now remembered.
- **Bulk actions.** Select several projects with <kbd>Ctrl</kbd>/<kbd>Shift</kbd>+click or <kbd>Ctrl</kbd>+<kbd>A</kbd>, then favorite, pin, tag, move to a group, link or remove them at once. Dragging a selection onto a sidebar group moves all of it.

## 1.3.0

Now available on the [Microsoft Store](https://apps.microsoft.com/detail/9P4T86KQRBVK).

### Added
- Microsoft Store (MSIX) package. The release workflow builds it as a downloadable artifact for Store submission.

### Changed
- The publisher is now shown as **vdnp** (Windows' installed apps list, Microsoft Store). Copyright stays with Yiğit Enes Kaya.
- In the Microsoft Store version, starting with Windows is managed from Windows Settings; the app links to it.

## 1.2.0

### Changed
- Upgraded to Electron 44 (from 33, which no longer receives security fixes), electron-vite 5, electron-builder 26 and Vite 7.
- The folder picker opens in your home folder when no default projects folder is set (Electron now defaults to Downloads).

## 1.1.0

First public release.

### Added
- English UI next to Turkish, chosen in Settings (follows the system language by default).
- Git status on cards and project pages: branch, uncommitted changes, commits ahead/behind.
- **All tasks** view with every project's to-dos.
- **Open in terminal** quick action (Windows Terminal when installed).
- Rendered README on the project page.
- Maintenance tools: detection of moved or deleted project folders with a "locate folder" fix, re-detecting tags (your own tags are kept), and JSON export / import (merge or replace).
- Project detection for ~40 languages and many more frameworks and package managers.

### Changed
- Proper Turkish characters throughout the UI and installer.
- A missing editor command now shows a clear message instead of failing silently.

### Security
- Package scripts only run if `package.json` declares them and their name contains no shell characters.
- Folder paths are quoted when launching editors (folders with spaces now open correctly).
- Only `http(s)` links are handed to the browser, and the window can no longer navigate away from the app.
- README HTML is sanitized, and the UI runs in a sandboxed renderer.
