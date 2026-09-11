# RC Step 4 — Installed Windows UAT

## Purpose

RC Step 4 validates the real installed Windows application through the critical end-user flow. This is intentionally different from the automated packaging smoke test in RC Step 3.

The tester must use the NSIS installer artifact produced by the green RC Step 3 workflow and run the installed application normally, without `--tolou-smoke-test`.

## Test environment

Record:

- Windows version/build
- install path
- whether a previous Tolou Concrete Driver installation existed
- whether previous save data existed
- display resolution and scaling

## Required UAT sequence

### UAT-01 — Clean install and first launch

1. Extract the GitHub Actions artifact.
2. Run `TolouConcreteDriver-Setup-0.2.0.exe`.
3. Complete a normal interactive installation.
4. Launch from the created desktop or Start Menu shortcut.
5. Confirm the game opens without a blank window, crash, security dialog loop, or missing runtime asset.

PASS when the main game UI renders and is interactive.

### UAT-02 — New Game baseline

1. Start a new game.
2. Confirm the truck, batching plant, HUD, minimap, operation panel, progression HUD, and quality telemetry appear.
3. Confirm keyboard driving controls respond.
4. Confirm there are no obvious missing textures/scripts or broken layout elements.

PASS when the player can enter the normal gameplay loop.

### UAT-03 — Full delivery cycle

1. Accept/start the active mission.
2. Drive to the batching/loading position.
3. Complete loading.
4. Drive to the assigned destination.
5. Complete delivery.
6. Verify score/reward/progression feedback.
7. Return toward the depot and allow the next mission state to become active.

PASS when the mission state progresses without deadlock and reward/progression feedback appears.

### UAT-04 — Persistence across normal close/reopen

1. While a recoverable run is active, move the truck to a clearly recognizable position/state.
2. Close the application using the window close button.
3. Allow the close-save lifecycle to complete.
4. Relaunch the installed application from the shortcut.
5. Use Continue.
6. Verify the restored mission/order, truck state, score/health/quality, and progression are consistent with the saved run.

PASS when Continue restores the last recoverable gameplay checkpoint rather than starting a new run or restoring a terminal/dead state.

### UAT-05 — Restart/New Game protection

1. With a recoverable autosave present, choose New Game / Restart.
2. Confirm the application warns before replacing the recoverable run.
3. Cancel once and verify the existing run remains available.
4. Repeat and confirm intentionally.

PASS when accidental save destruction is prevented and explicit confirmation works.

### UAT-06 — Persistence after Windows process restart

1. Create or update a recoverable autosave.
2. Close the game normally.
3. Restart Windows, or at minimum sign out/in if a full restart is not practical.
4. Launch the installed app again.
5. Continue the saved run.

PASS when persistent state survives a fresh OS session.

### UAT-07 — Uninstall / retained user data policy

1. Uninstall Tolou Concrete Driver 3D using Windows Apps / Installed apps or the NSIS uninstaller.
2. Reinstall the same RC installer.
3. Launch the application.
4. Verify expected retained user data behavior.

Current policy: `deleteAppDataOnUninstall=false`, therefore save/career data is expected to survive uninstall/reinstall unless manually removed.

PASS when behavior matches that policy and there is no application launch failure after reinstall.

## Blocking defects

Any of the following blocks RC Step 4:

- installed app does not launch;
- blank renderer or crash on launch;
- keyboard driving input is non-functional;
- loading/delivery flow cannot complete;
- Continue loses or corrupts recoverable state;
- New Game/Restart silently destroys recoverable state;
- save restore creates a mission/order mismatch;
- application cannot reopen after normal close;
- uninstall/reinstall produces a broken install;
- obvious release-blocking asset/runtime failure.

## Evidence to report

For each UAT item report one of:

- PASS
- FAIL — include exact step, observed result, and screenshot/error text if available

Minimum acceptance for merge: UAT-01 through UAT-07 all PASS, or any non-blocking cosmetic deviation explicitly accepted by the project owner.

## RC progression

RC Step 4 passing allows progression to RC Step 5 — Final Release Gate.
