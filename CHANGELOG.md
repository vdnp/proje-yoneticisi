# Changelog

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
