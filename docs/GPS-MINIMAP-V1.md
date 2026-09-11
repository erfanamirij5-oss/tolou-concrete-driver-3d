# GPS / Mini-map V1

## Scope

This milestone adds a compact read-only navigation HUD without changing mission, save/load, physics, or collision domain logic.

## Design

The minimap reads the existing Babylon scene at runtime:

- `truck` transform node -> current truck position and heading
- `navArrow` mesh -> current navigation target

No gameplay state is mutated by the minimap.

## V1 features

- compact HUD minimap
- static road layout
- depot marker
- all five destination markers
- truck heading marker
- active target marker
- dashed truck-to-target line
- straight-line target distance
- target name
- cardinal/intercardinal bearing text
- responsive desktop/mobile sizing

## Non-goals for V1

- turn-by-turn route graph
- shortest-path routing
- traffic-aware navigation
- road snapping
- voice navigation

These can be layered later after the HUD proves stable.
