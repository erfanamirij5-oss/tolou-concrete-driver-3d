# Release Version Policy

The accepted Windows desktop release is published as **v0.2.0**.

Rationale:

- `package.json` already identifies the product as version `0.2.0`;
- no prior GitHub Release exists for this repository;
- the final RC process hardens and validates the existing 0.2.0 product state rather than introducing a breaking API or product generation change;
- a major-version jump to 1.0.0 would imply a maturity/compatibility commitment not established by this RC cycle.

Future releases should change the package version deliberately before their release branch is opened.
