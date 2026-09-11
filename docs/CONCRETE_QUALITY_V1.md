# Concrete Quality Model V1

This model is a deterministic gameplay system, not an ASTM/ACI/ISIRI compliance calculator.

## Inputs
- elapsed delivery time while concrete is loaded
- current truck speed
- mix type profile
- accumulated overspeed duration

## Outputs
- `quality` (0-100)
- `freshness` (0-100)
- `slumpEstimate` (mm, gameplay estimate)
- `elapsedDeliveryTime` (seconds)
- `overspeedSeconds`

## Rules
- No quality degradation occurs while the truck is unloaded or the application is closed/paused.
- Each concrete type has its own starting slump and decay/overspeed coefficients.
- Overspeed above the profile threshold increases loss.
- The authoritative gameplay quality value is derived from freshness and relative slump retention.
- Quality remains part of delivery scoring and mission rejection.

## Persistence
The new telemetry fields are stored inside the existing save-version-1 `concrete` section. They are optional on restore, so saves created before this model remain loadable with safe defaults.

## Future engineering path
Any future standards-based concrete rule must live outside this gameplay profile, include an explicit standard/version/reference, deterministic tests, and documented interpretation. No standards claim should be inferred from the V1 coefficients.
