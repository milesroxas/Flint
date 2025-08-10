## Role Resolvers

Maps a `ParsedClass` to an `ElementRole` and exposes optional helpers like `isContainerLike`.

- `lumos.roles.ts`
  - Maps tokens to roles: `wrap`, `contain|container`, `layout`, `content`, `title|heading|header`, `text|paragraph|rich-text`, `actions|buttons`, `button|btn`, `link`, `icon`, `list`, `item|li`
  - `isContainerLike` returns true for `container` and `layout`
- `client-first.roles.ts`
  - Extends mapping for Client‑first structures (e.g., `collection-list`, `collection-item`)
  - `isContainerLike` accounts for wrapper/section/padding patterns

Selection

- Chosen in `element-lint-service.ts` based on the active preset
