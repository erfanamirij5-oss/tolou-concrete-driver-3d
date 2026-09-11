# Collision System V2

Collision System V2 adds deterministic lightweight world collisions without introducing a heavy physics engine.

## Model

- Static world obstacles are represented as simple box or circle proxies.
- The truck uses two circular probes (front and rear) to approximate its footprint.
- On collision, the attempted transform is rolled back to the previous valid transform.
- Collision damage and score penalties scale with impact speed.
- A short cooldown prevents one contact from applying damage every frame.

## Covered obstacles

- Procedural city buildings
- Depot building
- Concrete silos
- Destination-site buildings
- Existing world boundaries

The batching/loading lane intentionally remains free of blocking proxies so the current mission flow is not broken.

## Non-goals

This milestone does not add rigid-body simulation, suspension collision, traffic collision, deformable damage, or Havok. Those remain future work after gameplay validation.
