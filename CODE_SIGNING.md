# Code signing and privacy

## Code signing

The Windows installer on the [Releases](https://github.com/vdnp/proje-yoneticisi/releases) page (`proje-yoneticisi-setup-<version>.exe`) is **not code-signed**, so Windows SmartScreen shows an "unknown publisher" warning when you run it. Choose **More info → Run anyway** to continue.

Every installer is built by GitHub Actions from the source code in this repository, using the workflow in [`.github/workflows/release.yml`](.github/workflows/release.yml), and each release links to the commit it was built from. Nothing is built or uploaded by hand.

## Privacy policy

This program will not transfer any information to other networked systems unless specifically requested by the user.

All of its data (the project list, notes, tasks and settings) is stored locally in `%APPDATA%\project-manager\data.json`. The app has no accounts, telemetry, analytics or update checks. The only network traffic comes from things the user asks for: links they open in their browser, and `https` images embedded in a project's README when they view it.
