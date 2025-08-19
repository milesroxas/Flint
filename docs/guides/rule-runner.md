### What it is

`createRuleRunner` is a _builder_ that gives you a “rule runner,” which is the thing that checks your Webflow elements against your lint rules and reports problems.

### What you give it

1. **ruleRegistry** → your rulebook. It’s the list of rules you want to enforce.
2. **utilityAnalyzer** → your helper that knows which class names are “utilities” so the runner can treat them differently.
3. **classKindResolver** _(optional)_ → a little translator that, given a class name, tells the runner “what kind of class this is” in your system, for example a base class vs a combo vs a utility. If you don’t provide this, the runner uses its default logic.

### What you get back

An object with functions you call to run the rules on elements or a whole page and get a list of findings. Think “give me the issues for this selection or page.”

### Why it says “(alias)”

Your editor is showing that this is a named function type. It’s just the function’s signature the tooling is surfacing.

### `import createRuleRunner`

That line just means, “pull in the builder so you can construct a rule runner and use it in your code.”
