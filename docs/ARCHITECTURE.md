# Architecture

## Current principle

The repository should keep a **playable vertical slice** on `main`. New mechanics should be added without breaking the complete mission loop.

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

## Non-goals for early versions

Do not add a large open world, multiplayer, complex traffic AI or photorealistic assets before the core loop is demonstrably fun and stable.

## Deployment

The web build is intentionally static and compatible with GitHub Pages. This keeps distribution friction near zero. A desktop wrapper can be introduced later without changing the game design.
