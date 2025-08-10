## Grammar Adapters

Defines preset-specific class name parsers used for role identification.

- `lumos.grammar.ts`
  - Kind detection: `u-` → utility, `is-` → combo, `c-` → component, otherwise custom
  - Tokenization: underscore `_` tokens; assigns `type`, optional `variation`, and `elementToken` (last token)
- `client-first.grammar.ts`
  - Same kind detection; normalizes dashes to underscores before tokenization

Usage

- Selected in `element-lint-service.ts` based on the current preset
- Feeds `ParsedClass` into the preset `RoleResolver`
