# Architecture

## Current principle

The repository should keep a **playable vertical slice** on `main`. New mechanics must be added without breaking the complete mission loop.

The primary product target is now a **persistent Windows desktop game**. Browser compatibility remains useful for fast testing but is no longer the only deployment target.

## Platform architecture

```text
Windows
  Electron Main Process
          ↓ secure IPC
  Isolated Preload Bridge
          ↓ constrained API
  Game Renderer
          ↓
  Babylon.js Game Core
```

Security baseline:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- renderer receives no raw `fs` access
- save slot names and payload sizes are validated in the privileged process

## Persistence boundary

Game systems must not perform disk I/O directly.

```text
TolouPersistence
├── ElectronPersistenceAdapter
│     ↓
│   preload / IPC
│     ↓
│   electron/persistence.js
│     ↓
│   app.getPath('userData')/saves
└── BrowserPersistenceAdapter
      ↓
    localStorage
```

Persist plain domain data only. Babylon meshes, callbacks, animation handles, timers and engine internals are reconstructable runtime state and must never be serialized directly.

The desktop persistence service currently provides safe slot operations and backup recovery infrastructure. Game-session serialization, migrations and exact mission restoration belong to the next save/load milestone.

## Runtime layers

### 1. World
Responsible for roads, depot, destination zones, props, lighting, sky, collision boundaries and navigation markers.

### 2. Vehicle
Responsible for mixer-truck motion, steering, braking, speed, damage and camera tracking.

### 3. Mission state machine
Canonical flow:

```text
AT_DEPOT
  -> LOADING
  -> TO_SITE
  -> DELIVERING
  -> RETURNING
  -> AT_DEPOT
```

Invalid state transitions should be rejected rather than silently accepted.

Every future state must define whether it is persistable directly or restored through a deterministic checkpoint.

### 4. Concrete state
The concrete load is not decorative. It tracks at minimum:

- loaded volume
- elapsed delivery time
- freshness / quality
- mission-specific concrete type

Future versions can add slump loss, ambient temperature, drum RPM and rejected-load conditions.

### 5. Scoring
Score should be deterministic and explainable. Inputs:

- remaining time
- concrete quality
- vehicle health
- parking accuracy
- collision penalties
- successful deliveries

### 6. UI/HUD
HUD must remain readable without hiding the driving scene. Primary data only:

- mission
- timer
- speed
- quality
- health
- delivery progress
- operation prompt

## Save integrity direction

Desktop saves should follow this lifecycle:

```text
serialize domain state
→ validate
→ write temporary file
→ preserve previous valid save as backup
→ promote temporary file
```

A corrupt primary save should be recoverable from backup where possible.

Offline policy: game simulation time is paused while the application is closed. Mission time and concrete degradation must not advance merely because the Windows application was not running.

## Non-goals for early versions

Do not add a large open world, multiplayer, complex traffic AI or photorealistic assets before the core loop is demonstrably fun and stable.

## Deployment

Primary deployment:

- Windows x64
- Electron
- electron-builder
- NSIS installer

Babylon.js is vendored into the application at build time so the packaged game does not depend on the public CDN at runtime.

Browser mode remains available as a development/compatibility surface.
