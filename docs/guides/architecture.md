# Architecture Overview

## Current State
- Services in features/linter handle most business logic.
- Rules grouped in single files.
- Context classification and utility analysis separate.

## Target State (FSD)
```plaintext
/entities
  /style
  /element
/features
  /linter
  /rules
  /presets
/processes
/shared
```
- Preset architecture: GrammarAdapter, RoleResolver, Rule pack, ProjectConfig.

