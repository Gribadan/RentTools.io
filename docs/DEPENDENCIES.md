# Dependency maintenance

The application uses locally maintained UI components. Its shared Tailwind
utilities are an unchanged copy of `shadcn@4.19.0/dist/tailwind.css` in
`src/styles/shadcn.css`, with the original MIT license alongside it. Updating the
component generator is separate from updating these styles; the generator's CLI
and its dependencies are not needed to build or run the application.

The `@next/eslint-plugin-next` override replaces only its `fast-glob` dependency
with `tinyglobby@0.2.17`. The plugin uses the synchronous named `globSync` export
with `onlyDirectories` for Next root-directory settings; both libraries support
that contract. Other consumers must be reviewed before broadening this override.
This removes the unpatched `braces` dependency chain (GHSA-vfj7-8cjw-p6xm)
without suppressing advisories or changing the high/critical audit gate.

On framework lint upgrades, recheck the plugin's glob imports and root-directory
tests, run a clean install and lint, and remove the override once upstream no
longer needs it. Keep the lockfile paired with manifest changes.
