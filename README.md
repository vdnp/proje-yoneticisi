<div align="center">

<img src="build/icon.png" width="96" alt="Project Manager logo" />

# Project Manager

**A keyboard-first desktop hub for your local projects.**
Find any project in a keystroke, open it in your editor, and see its git status and tasks at a glance.

<a href="https://apps.microsoft.com/detail/9P4T86KQRBVK"><img src="https://get.microsoft.com/images/en-us%20dark.svg" width="200" alt="Get it from Microsoft" /></a>

[Microsoft Store](https://apps.microsoft.com/detail/9P4T86KQRBVK) · [Download the installer](../../releases/latest) · [Türkçe](README.tr.md) · [Code signing and privacy](CODE_SIGNING.md)

<img src="docs/screenshots/home.png" alt="Project Manager home screen" />

</div>

## Features

- **Command palette** (<kbd>Ctrl</kbd>+<kbd>K</kbd>): fuzzy-search your projects and press <kbd>Enter</kbd> to open one in your editor. A global shortcut (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>) opens it even while the app sits in the tray.
- **Add projects your way**: pick a folder, drop one onto the window, or scan a root folder and import everything it finds.
- **Automatic detection** of ~40 languages, frameworks (React, Next.js, Django, Laravel, Rails, Spring, Flutter, Unity, Godot…) and package managers (npm, pnpm, yarn, bun, cargo, pip, poetry, go, composer, nuget…).
- **Git status on every card**: current branch, uncommitted changes, commits ahead/behind.
- **Quick actions**: open in your editor (per-project choice: VS Code, VS Code Insiders, Cursor, or any command), in a terminal, in Explorer, or on GitHub.
- **Project pages** with notes, a to-do list, the rendered README and one-click `package.json` scripts.
- **All tasks**: every project's to-dos in one list.
- **Linked projects**: link a frontend to its backend, wherever they live on disk. **Launch** opens them together, each in its own editor, and starts each one's dev script in its own terminal.
- **Organize**: favorites, pinning, color-coded groups (drag cards onto a group), tags, sorting and a custom order you set by dragging cards.
- **Bulk actions**: <kbd>Ctrl</kbd>/<kbd>Shift</kbd>+click to select several projects, then favorite, pin, tag, group, link or remove them at once.
- **Tray menu** with favorites and recent projects; open one without opening the window.
- **Maintenance**: spots projects whose folder was moved or deleted, re-detects tags, exports and imports backups.
- **Turkish and English** UI, dark and light themes, eight accent colors.

<table>
  <tr>
    <td><img src="docs/screenshots/detail.png" alt="Project page" /></td>
    <td><img src="docs/screenshots/palette.png" alt="Command palette" /></td>
  </tr>
</table>

## Install

**Microsoft Store (recommended):** get it from the [Microsoft Store](https://apps.microsoft.com/detail/9P4T86KQRBVK). The Store version is signed by Microsoft, installs without SmartScreen warnings and updates automatically. Windows 10 (1809) or later.

**Installer:** download the latest `proje-yoneticisi-setup-<version>.exe` from [Releases](../../releases/latest) and run it. Windows 10 and 11 are supported.

The installer is not code-signed, so Windows SmartScreen will warn about an unknown publisher. Choose **More info → Run anyway**. Every installer is built by GitHub Actions from this repository's source; see [code signing and privacy](CODE_SIGNING.md).

To update the installer version, install the new version over the old one. **Settings → Updates** tells you when a new version is out: click **Check now**, or turn on **Check automatically** (off by default; see the [privacy policy](CODE_SIGNING.md#privacy-policy)). Your projects are kept: the app stores its data outside the install folder (see [Your data](#your-data)). The Store version keeps its data separately; to move your projects between the two, use **Settings → Backup** to export and import.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>Ctrl</kbd>+<kbd>K</kbd> | Command palette |
| <kbd>Enter</kbd> (in the palette) | Launch the project (with its linked projects and dev script), or open it in the editor |
| <kbd>Shift</kbd>+<kbd>Enter</kbd> / <kbd>Ctrl</kbd>+<kbd>Enter</kbd> (in the palette) | Open in the editor only / open the project page |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> | Bring the app up with the palette open (works from the tray; configurable) |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Add a project |
| <kbd>Ctrl</kbd>+<kbd>F</kbd> | Search |
| Arrow keys, <kbd>Enter</kbd> | Move between cards, open one |
| <kbd>Ctrl</kbd>/<kbd>Shift</kbd>+click, <kbd>Ctrl</kbd>+<kbd>A</kbd> | Select projects / select all (<kbd>Esc</kbd> clears) |
| <kbd>Esc</kbd> | Back / close |

## Your data

Everything stays on your computer, in a single JSON file:

```
%APPDATA%\project-manager\data.json
```

A `.bak` copy of the previous version is written before every save, and the app recovers from it if the file is ever damaged. **Settings → Backup** exports and imports the whole thing.

The app makes no network requests of its own. The only things that reach the internet are links you open in your browser and `https` images embedded in a project's README.

## Development

Requirements: Node.js 22+ and npm, on Windows.

```bash
npm install
npm run dev         # the Electron app with hot reload
npm run dev:web     # the UI alone in a browser, on fictional sample data
npm test            # unit tests (Vitest), in tests/
npm run build       # installer in release/
npm run build:store # Microsoft Store (MSIX) package in release/
```

| Path | What lives there |
| --- | --- |
| `src/main/` | Electron main process: window, tray, IPC, data file, git, project detection (`detect.js`) |
| `src/preload/` | The bridge the UI is allowed to use (`window.api`) |
| `src/renderer/src/` | React UI; `locales/` holds the translations |
| `scripts/` | Icon generation and the README screenshots |

**Adding a language**: copy `src/renderer/src/locales/en.js`, translate the values, and register the file in `src/renderer/src/lib/i18n.js`.

**Screenshots**: run `npm run dev:web` and then `npm run screenshots`. They are rendered from the fictional sample data in `src/renderer/src/lib/mockApi.js`.

If `npm run build` fails while extracting `winCodeSign` with a "cannot create symbolic link" error, turn on Windows Developer Mode (or run the terminal as administrator) and try again. Release builds on GitHub Actions don't hit this.

### Releasing

Pushing a version tag builds the installer on GitHub Actions and attaches it to a GitHub release:

```bash
npm version minor      # or patch / major: bumps package.json and creates the tag
git push --follow-tags
```

## License

[MIT](LICENSE)
