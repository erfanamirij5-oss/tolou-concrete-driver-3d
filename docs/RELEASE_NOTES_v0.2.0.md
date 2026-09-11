# Tolou Concrete Driver 3D v0.2.0

## Release status

Windows desktop release candidate completed through RC Step 4 and is entering the final release gate.

## Highlights

- Electron-based Windows desktop application while preserving the Babylon.js/HTML/JavaScript gameplay foundation
- secure renderer/preload/main-process separation
- deterministic Save / Load / Continue flow
- hardened autosave lifecycle with serialized per-slot persistence operations
- recoverable checkpoint preservation across terminal Game Over state
- protected New Game / Restart flow when a recoverable autosave exists
- deterministic concrete quality model V1
- mission progression and persistent career profile
- deterministic orders engine integrated into gameplay
- GPS / mini-map and loading/delivery operation polish
- collision handling and gameplay penalties
- NSIS x64 installer with desktop and Start Menu shortcuts
- AppData preservation across uninstall

## Release validation completed

- static checks
- gameplay regression tests
- quality-model tests
- progression tests
- orders-engine tests
- order-runtime tests
- gameplay wiring tests
- persistence-hardening tests
- Windows NSIS installer build
- install / packaged renderer boot / uninstall smoke validation on Windows CI
- installed Windows UAT acceptance gate

## Packaging

Expected installer name:

`TolouConcreteDriver-Setup-0.2.0.exe`

Architecture: Windows x64

## Persistence policy

Gameplay autosave and persistent career data use separate save slots. The release preserves the last recoverable gameplay checkpoint instead of replacing it with an unusable terminal Game Over state. User data is intentionally retained when the application is uninstalled.

## Known release constraints

- v0.2.0 is a Windows x64 desktop release.
- The concrete quality model is a deterministic gameplay model; it does not claim ASTM, ACI, EN, ISO, or ISIRI engineering compliance.
- The current installer does not include a custom production application icon unless one is added in a later release-hardening change.
- Browser mode remains available primarily for development and rapid testing; Windows desktop is the primary distribution target.

## Final release gate

The release must not be tagged or published until the final branch passes both:

- `static-checks`
- `windows-package-smoke`

After merge, the release tag should point at the accepted `main` commit for v0.2.0.
