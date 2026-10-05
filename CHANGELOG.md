# Changelog

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
