# GPS / Mini-map V1 Validation

Manual acceptance checks:

1. Start a new game and confirm the minimap appears without blocking mission HUD controls.
2. Confirm the truck marker moves with the truck and rotates with heading.
3. At depot, active target resolves to the depot marker.
4. After loading completes, active target resolves to the current construction destination.
5. After delivery completes, active target returns to the depot.
6. Distance decreases while approaching the target and increases when driving away.
7. Bearing text changes consistently with the active target direction.
8. Save/Continue, Physics V2 and Collision V2 remain unaffected.
9. Windows package includes src/ui/minimap.js.
