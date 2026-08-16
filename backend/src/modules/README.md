# modules

Feature modules live here. Each feature is self-contained:

```
modules/<feature>/
├── <feature>.routes.ts       Express router definition
├── <feature>.controller.ts   HTTP layer (request in, response out)
├── <feature>.service.ts      business logic
├── <feature>.repository.ts   data access (Prisma)
├── <feature>.schema.ts       validation schemas
├── <feature>.types.ts        feature types
├── <feature>.constants.ts    feature constants
└── index.ts                  public exports
```

Intentionally empty. No business features exist yet - directories are created when a feature is actually introduced.
