# Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

> **Status:** code signing is being set up. Until it is in place, the installers on the Releases page are unsigned and Windows SmartScreen will show an "unknown publisher" warning.

## What gets signed

Only the Windows installer (`proje-yoneticisi-setup-<version>.exe`) published on the [Releases](https://github.com/vdnp/proje-yoneticisi/releases) page.

Every installer is built by GitHub Actions from the source code in this repository, using the workflow in [`.github/workflows/release.yml`](.github/workflows/release.yml). Nothing built outside that pipeline, and no third-party binary, is signed.

## Team roles

| Role | Members |
| --- | --- |
| Committers and reviewers | [vdnp](https://github.com/vdnp) |
| Approvers | [vdnp](https://github.com/vdnp) |

Every signing request is approved manually by an approver.

## Privacy policy

This program will not transfer any information to other networked systems unless specifically requested by the user.

All of its data (the project list, notes, tasks and settings) is stored locally in `%APPDATA%\project-manager\data.json`. The app has no accounts, telemetry, analytics or update checks. The only network traffic comes from things the user asks for: links they open in their browser, and `https` images embedded in a project's README when they view it.
