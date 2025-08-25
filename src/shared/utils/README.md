# Shared Utils

## Debug

Global lightweight debugger

### Usage

```ts
import { createDebugger } from "@/shared/utils/debug";

const debug = createDebugger("childgroup-rule");

// only logs in dev by default
debug.log("Executing for element", elementId);

// dynamically toggle
debug.disable();
debug.log("won't show");

debug.enable();
debug.warn("this will show again");
```
