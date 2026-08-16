# eslint-config

Shared ESLint flat config (TypeScript `typescript-eslint` recommended ruleset)
used by the backend and other non-Next.js workspaces.

The frontend does not use this package - it extends `eslint-config-next` instead.

## Usage

```js
// backend/eslint.config.mjs
import base from "@hackathon/eslint-config";

export default [...base];
```

## Extending

Add workspace-specific rules in your own `eslint.config.mjs`:

```js
import base from "@hackathon/eslint-config";

export default [
  ...base,
  {
    rules: {
      // workspace-specific rules
    },
  },
];
```
