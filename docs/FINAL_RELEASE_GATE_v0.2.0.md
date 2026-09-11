# Final Release Gate — v0.2.0

## Source of truth

Release branch: `release/v0.2.0-final`

Base: accepted `main` after RC Step 4.

Package version: `0.2.0`.

## Required automated gates

The release PR must pass:

- `static-checks`
- `windows-package-smoke`

The Windows job must complete all of the following:

1. build the real NSIS x64 installer;
2. install the package on the Windows runner;
3. verify the installed executable and packaged `app.asar`;
4. boot the installed Electron renderer successfully;
5. uninstall the application successfully;
6. upload the installer artifact.

## Required accepted RC evidence

- RC Step 2 — Persistence Hardening: accepted and merged.
- RC Step 3 — Windows package/install validation: accepted and merged.
- RC Step 4 — Installed Windows UAT: accepted and merged.

## Release-blocking conditions

Do not tag or publish v0.2.0 if any of the following is true:

- a required CI gate is red;
- installer creation fails;
- installed application cannot boot;
- Save / Continue regression is detected;
- persistence can silently overwrite a recoverable checkpoint;
- a release-only documentation statement contradicts current runtime behavior;
- the final installer artifact does not correspond to the accepted release commit.

## Release action after acceptance

After this PR is green and merged:

1. use the resulting accepted `main` commit as the release commit;
2. create tag `v0.2.0` at that exact commit;
3. publish GitHub Release `Tolou Concrete Driver 3D v0.2.0`;
4. attach the Windows x64 installer built from that release commit;
5. use `docs/RELEASE_NOTES_v0.2.0.md` as the release-note source.
