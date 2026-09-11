# RC Step 3 — Windows Install / Launch Validation

## Purpose

RC Step 3 closes the gap between an unpacked Electron build and a distributable Windows application.

A release candidate is not considered Windows-ready merely because `electron-builder --dir` succeeds. The real NSIS installer must be built, installed, launched from the installed location, and uninstalled successfully.

## Automated gate

The `windows-package-smoke` GitHub Actions job now performs the following sequence on `windows-latest`:

1. install Node dependencies;
2. run `npm run dist:win` to create the x64 NSIS installer;
3. locate the generated `TolouConcreteDriver-Setup-*.exe`;
4. reject a missing or implausibly small installer;
5. silently install into an isolated runner directory;
6. verify the installed application executable exists;
7. verify packaged `resources/app.asar` exists;
8. launch the installed executable with `--tolou-smoke-test`;
9. require the Electron renderer to finish loading within 15 seconds and exit with code 0;
10. verify an NSIS uninstaller exists;
11. silently uninstall the smoke-test installation;
12. upload the generated installer as the workflow artifact `tolou-concrete-driver-windows-rc`.

## Smoke mode

`electron/main.js` recognizes `--tolou-smoke-test` only as a release-validation path. Normal user launches are unchanged.

In smoke mode the app remains hidden, loads the same packaged `index.html` through the normal BrowserWindow/preload configuration, and exits:

- `0` after `did-finish-load`;
- `1` on load failure;
- `1` if the renderer process terminates unexpectedly;
- `1` after a 15-second timeout.

## Non-goals

This step does not add gameplay features, alter mission behavior, change save semantics, or replace manual play testing. It validates the packaging/install boundary and packaged renderer boot path only.

## Merge gate

Do not merge the RC Step 3 PR until both jobs are green:

- `static-checks`
- `windows-package-smoke`
