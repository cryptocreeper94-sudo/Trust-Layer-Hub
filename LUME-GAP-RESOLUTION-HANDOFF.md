# LUME GAP RESOLUTION HANDOFF

**Document purpose:** Addresses 7 architectural gaps identified in the Lume language system. Each gap includes the problem, the solution, implementation details, and acceptance criteria. This document is additive — it does NOT replace or modify any existing handoff documents. It extends them.

**Prerequisites:** The building agent should have already received and reviewed LUME-MILESTONES-7-13-HANDOFF.md and LUME-VOICE-TO-CODE-HANDOFF.md before implementing anything in this document.

---

## GAP 1: AMBIGUITY CEILING — INTERACTIVE CLARIFICATION MODE

### The Problem

The Tolerance Chain has 7 layers of fallback, but the spec does not define what happens when ALL 7 layers fail to reach the confidence threshold (0.85). Currently, if Layer B (AI Resolver) returns a confidence of 0.72, the instruction has no resolution path. The compiler either has to guess (dangerous) or crash (bad experience).

### The Solution

When confidence stays below the threshold across all layers, the compiler enters **Interactive Clarification Mode** — it asks the developer what they meant, presents options, and caches the answer for future compilations.

### Implementation

**Text mode (terminal):**

```
Compiling app.lume...
  Line 7: "process the data appropriately"

  [lume] I'm not confident I understand this instruction (best confidence: 0.72).
  What do you mean by "process"?
    1. Filter/clean the data
    2. Transform/convert the data
    3. Send the data somewhere
    4. Analyze/summarize the data
    5. Let me rephrase this

  > 2

  [lume] Resolving as: transform the data
  Line 7: transform the data .......................... OK (clarified by developer)
```

**Voice mode:**

```
[lume voice] "I'm not sure what you mean by 'process the data appropriately.'
  Did you mean filter it, transform it, send it, or analyze it?
  Or you can rephrase."

Developer: "transform it"

[lume voice] Got it. Transforming the data. ✓
```

**Web playground:**

A modal dialog appears with the same options as buttons. The developer clicks their choice or types a rephrased instruction in a text input.

**How options are generated:**

The AI Resolver (Layer B) generates the clarification options. When its confidence is below threshold, it returns its top 4 interpretations ranked by confidence instead of picking one. These become the numbered options presented to the developer. Option 5 ("let me rephrase") is always present.

**Caching the clarification:**

Once the developer clarifies, the resolution is stored in the compile-lock file (`.lume/compile-lock.json`):

```json
{
  "clarifications": {
    "process the data appropriately": {
      "resolved_as": "transform the data",
      "resolved_to_ast": "TransformOperation",
      "clarified_by": "developer",
      "timestamp": "2026-09-15T14:30:00Z",
      "original_confidence": 0.72,
      "clarification_choice": 2
    }
  }
}
```

On subsequent compilations, the same phrase resolves instantly from the cache without asking again. If the developer wants to re-clarify, they can run `lume compile --reclarify` to clear cached clarifications.

**Non-interactive mode (CI/CD):**

In CI/CD pipelines or batch compilation (`lume build --non-interactive`), unclarified ambiguities cause compilation failure with a clear error:

```
ERROR [LUME-E040] Line 7: "process the data appropriately"
  Could not resolve with sufficient confidence (best: 0.72).
  This instruction requires developer clarification.
  Run `lume compile app.lume` interactively to resolve, or rephrase the instruction.
```

### Acceptance Criteria

- [ ] When all 7 Tolerance Chain layers return confidence below threshold, compiler enters Interactive Clarification Mode
- [ ] Clarification presents top 4 AI-generated interpretations plus a "rephrase" option
- [ ] Developer's choice resolves the instruction and compilation continues
- [ ] Clarification is cached in compile-lock file — same phrase never asks twice
- [ ] `lume compile --reclarify` clears cached clarifications and re-prompts
- [ ] Voice mode presents clarification as a spoken prompt with spoken response
- [ ] Web playground presents clarification as a modal dialog with clickable options
- [ ] Non-interactive mode (`--non-interactive`) fails with LUME-E040 error instead of prompting
- [ ] Compile-lock records original confidence, chosen option, timestamp, and resolved AST node type

---

## GAP 2: COMPLEX LOGIC — NATURAL LANGUAGE LOGIC BLOCKS

### The Problem

The pattern library handles simple conditionals ("if the count is zero") but real programs have compound boolean expressions with AND/OR/NOT, nested conditions, and multiple else-if branches. English naturally expresses complex logic as bullet-point checklists, but the current spec doesn't define how the compiler handles this structure.

### The Solution

Support multi-line conditional blocks where indented bullet points represent AND conditions, "or" within a bullet represents OR, and "not" negates a condition.

### Implementation

**Syntax:**

```
mode: english

show the dashboard if all of these are true:
  - the user is logged in
  - their subscription is active or they have a trial
  - it hasn't expired

otherwise if they were previously subscribed
  show the renewal page

otherwise
  show the signup page
```

**Parsing rules:**

1. "if all of these are true:" starts a compound AND block
2. "if any of these are true:" starts a compound OR block
3. Lines starting with `-` (dash) inside the block are individual conditions
4. "or" within a single bulleted condition creates an OR sub-expression
5. "and" within a single bulleted condition creates an AND sub-expression
6. "not" / "isn't" / "hasn't" / "doesn't" / "won't" negates the condition
7. "otherwise if" maps to else-if
8. "otherwise" / "if none of these" maps to else

**Compiled output:**

```javascript
if (user.isLoggedIn && (user.subscription.isActive || user.hasTrial) && !user.subscription.isExpired) {
  showDashboard();
} else if (user.wasPreviouslySubscribed) {
  showRenewalPage();
} else {
  showSignupPage();
}
```

**AST representation:**

```
CompoundIfStatement {
  mode: "all" (AND) | "any" (OR)
  conditions: [
    Condition { expression: "user is logged in", negated: false },
    CompoundCondition {
      mode: "any",
      conditions: [
        Condition { expression: "subscription is active", negated: false },
        Condition { expression: "they have a trial", negated: false }
      ]
    },
    Condition { expression: "it has expired", negated: true }
  ],
  body: [ShowStatement { value: "dashboard" }],
  elseIf: [
    {
      condition: Condition { expression: "they were previously subscribed" },
      body: [ShowStatement { value: "renewal page" }]
    }
  ],
  else: {
    body: [ShowStatement { value: "signup page" }]
  }
}
```

**Additional compound patterns:**

```
mode: english

do this only when:
  - the cart has items
  - the user has a payment method
  - we haven't already charged them

skip this step if any of these are true:
  - the user is an admin
  - the order is a gift
  - the total is zero
```

"do this only when:" = AND block (all must be true)
"skip this step if any of these are true:" = negated OR block (skip if any match)

### Acceptance Criteria

- [ ] "if all of these are true:" starts a compound AND conditional block
- [ ] "if any of these are true:" starts a compound OR conditional block
- [ ] Dash-prefixed lines inside the block are parsed as individual conditions
- [ ] "or" within a single bullet creates OR sub-expression
- [ ] "and" within a single bullet creates AND sub-expression
- [ ] Negation words (not, isn't, hasn't, doesn't, won't, never) negate the condition
- [ ] "otherwise if" maps to else-if with its own condition
- [ ] "otherwise" / "if none of these" maps to else
- [ ] Compound blocks can be nested (a bullet can itself be a sub-block with "all/any of these")
- [ ] "do this only when:" / "do this if:" work as aliases for "if all of these are true:"
- [ ] "skip this if any of these are true:" creates a negated OR guard
- [ ] Compiled JavaScript produces correct nested boolean expressions with proper operator precedence

---

## GAP 3: STATE MANAGEMENT ACROSS FILES — IMPLICIT MODULE RESOLUTION

### The Problem

When file B references "the user list" and file A creates it, the compiler needs to know they're the same thing. Traditional languages use explicit imports. English doesn't have imports. The spec mentions cross-file references as a gap but doesn't provide the resolution mechanism.

### The Solution

A three-tier resolution system: local scope first, then explicit `using:` directives, then automatic cross-file search with developer confirmation.

### Implementation

**Tier 1: Local scope (no action needed)**
The compiler checks the current file first. If "user list" is defined in this file, it resolves immediately.

**Tier 2: Explicit `using:` directive**

```
mode: english
using: the user module
using: helpers.lume

get the user list
filter by active status
```

The `using:` directive is English-friendly:
- `using: the user module` -> looks for `user.lume` or `user-module.lume`
- `using: helpers.lume` -> explicit file path
- `using: everything from the models folder` -> imports all `.lume` files from `./models/`

**Tier 3: Automatic cross-file search (interactive)**

When no `using:` directive exists and the variable isn't local, the compiler searches all project `.lume` files:

```
Compiling dashboard.lume...
  Line 3: "get the user list"

  [lume] "user list" isn't defined in this file.
  Found matches in other files:
    1. user_list (created in app.lume, line 12)
    2. user_list (created in models/user.lume, line 5)
    3. It's a new variable (create it here)

  Which one? > 1

  [lume] Using user_list from app.lume.
  Adding `using: app.lume` to this file automatically.
  Line 3: get the user list ........................... OK (from app.lume)
```

The compiler automatically adds the `using:` directive to the file so it doesn't ask again.

**Module index file (`.lume/module-index.json`):**

The compiler maintains a project-wide index of all defined variables, functions, and structures across all `.lume` files:

```json
{
  "definitions": {
    "user_list": {
      "file": "app.lume",
      "line": 12,
      "type": "variable",
      "created_by": "create a list called user list"
    },
    "greet_user": {
      "file": "helpers.lume",
      "line": 3,
      "type": "function",
      "created_by": "to greet a user, show hello followed by their name"
    }
  }
}
```

This index is rebuilt on each compilation and used for cross-file lookups.

**Non-interactive mode:**

In CI/CD (`--non-interactive`), unresolved cross-file references fail:

```
ERROR [LUME-E050] Line 3 in dashboard.lume: "user list" not found.
  Not defined in this file and no `using:` directive provided.
  Candidates found:
    - app.lume:12 (user_list)
    - models/user.lume:5 (user_list)
  Add `using: app.lume` or `using: models/user.lume` to resolve.
```

### Acceptance Criteria

- [ ] Variables/functions defined in the current file resolve first (local scope priority)
- [ ] `using:` directive imports definitions from another file
- [ ] `using:` supports English-friendly syntax ("the user module", "everything from models folder")
- [ ] When a reference is unresolved and no `using:` exists, compiler searches all project `.lume` files
- [ ] Interactive mode presents matching definitions from other files and asks the developer to choose
- [ ] Chosen cross-file reference automatically adds `using:` directive to the file
- [ ] Module index (`.lume/module-index.json`) tracks all definitions across all project files
- [ ] Module index rebuilds on each compilation
- [ ] Non-interactive mode fails with LUME-E050 error listing candidate files
- [ ] Circular dependencies detected and reported with clear error message

---

## GAP 4: REFACTORING AND MAINTENANCE — CANONICAL FORM AND LUME FORMATTER

### The Problem

Two developers can write the same logic completely differently in English: "grab the users," "fetch all people from the users table," "get the user list." All compile to the same thing, but code review becomes difficult when there's no consistency. Traditional languages have formatters (Prettier, Black, gofmt). English Mode needs one too.

### The Solution

A canonicalization system that normalizes English instructions to a consistent, standardized form. This is the English equivalent of a code formatter.

### Implementation

**`lume canonicalize` command:**

```bash
$ lume canonicalize app.lume

Before:
  Line 1: grab all the users from the db
  Line 2: filter out the ones that aren't active anymore
  Line 3: display their names and emails on the screen

After (canonical form):
  Line 1: get users from the database
  Line 2: filter users where status is not active
  Line 3: show user names and emails

Apply changes? (y/n) > y
✓ app.lume canonicalized (3 lines normalized)
```

**Canonicalization rules:**

| Informal/Variant | Canonical Form |
|-----------------|---------------|
| grab, fetch, pull, retrieve, obtain | get |
| db, database, data store | database |
| display, show, print, output, render | show |
| remove, delete, drop, get rid of, wipe | delete |
| make, build, create, set up, initialize | create |
| keep, save, store, persist, put away | save |
| modify, change, edit, alter, adjust | update |
| the ones that, those which, items where | [entity] where |
| isn't, aren't, not, no longer, anymore | not |
| on the screen, on screen, on display | (removed — show implies display) |

**Canonical form principles:**
1. Use the shortest common verb (get, show, save, delete, create, update)
2. Remove unnecessary articles (the, a, an) except when they add clarity
3. Remove filler phrases ("all the", "each of the", "every single")
4. Normalize negation to "not"
5. Remove redundant location phrases ("on the screen" after "show")
6. Normalize data source references ("db" -> "database")
7. Preserve the developer's variable names and identifiers

**Configuration (`.lume/style-config.json`):**

```json
{
  "canonicalize": {
    "auto_on_save": false,
    "auto_on_commit": true,
    "preserve_comments": true,
    "verb_style": "short",
    "strictness": "standard"
  }
}
```

**Git hook integration:**

Teams can enable auto-canonicalization on commit:

```bash
$ lume init --hooks
✓ Added pre-commit hook: lume canonicalize --check
  (Blocks commit if non-canonical English is detected)
```

### Acceptance Criteria

- [ ] `lume canonicalize <file>` normalizes English instructions to canonical form
- [ ] Shows before/after diff and asks for confirmation before applying
- [ ] `lume canonicalize --check` returns non-zero exit code if file is not canonical (for CI/CD)
- [ ] `lume canonicalize --apply` applies changes without prompting (for automation)
- [ ] Synonym table maps informal verbs to canonical verbs (grab/fetch/pull -> get)
- [ ] Articles stripped except when they add clarity to the instruction
- [ ] Redundant phrases removed (filler, implied locations)
- [ ] Variable names and identifiers preserved — only structural language is normalized
- [ ] `.lume/style-config.json` configures canonicalization behavior
- [ ] Git pre-commit hook available via `lume init --hooks`
- [ ] Canonicalized code compiles to identical JavaScript as the original

---

## GAP 5: PERFORMANCE-CRITICAL CODE — HINT ANNOTATIONS

### The Problem

English is expressive but imprecise about implementation details. "Sort the list" doesn't specify the algorithm. "Cache the result" doesn't specify the duration. For most applications this doesn't matter — the compiler picks sensible defaults. But for performance-critical code, developers need control without leaving English Mode.

### The Solution

Hint annotations — English phrases that modify how an instruction is compiled without changing WHAT it does.

### Implementation

**Syntax: "using [hint]", "with [hint]", "for [duration]", "limited to [constraint]"**

```
mode: english

sort the list using quicksort
cache the result for 5 minutes
run this in parallel with 4 workers
limit the query to 100 results
load the data lazily
batch the API calls in groups of 10
retry this up to 3 times with exponential backoff
timeout after 30 seconds
```

**Hint categories:**

| Hint Type | Example Phrases | Compiled Effect |
|-----------|----------------|----------------|
| Algorithm | "using quicksort", "using binary search" | Specifies sort/search algorithm |
| Caching | "cache for 5 minutes", "cache indefinitely", "don't cache" | TTL-based caching wrapper |
| Parallelism | "in parallel", "with 4 workers", "concurrently" | Promise.all, worker threads, or async batching |
| Limits | "limit to 100", "first 50 only", "at most 1000" | LIMIT clause, array slice, or loop bound |
| Loading | "lazily", "eagerly", "on demand" | Lazy initialization, eager loading |
| Batching | "in groups of 10", "batch by 50" | Chunked processing |
| Retry | "retry 3 times", "with exponential backoff" | Retry wrapper with configurable strategy |
| Timeout | "timeout after 30 seconds", "give up after 1 minute" | AbortController or setTimeout wrapper |
| Memory | "stream this", "don't load it all at once" | Streaming/chunked processing instead of loading full dataset |
| Priority | "this is critical", "low priority", "do this first" | Execution order hints, priority queues |

**How hints are parsed:**

Hints are detected as modifying phrases attached to an instruction. The pattern matcher identifies the core instruction first ("sort the list"), then extracts hint phrases ("using quicksort") as metadata on the AST node:

```
SortOperation {
  target: "list",
  hints: {
    algorithm: "quicksort"
  }
}
```

The transpiler uses hints to select the appropriate implementation. If no hint is provided, sensible defaults are used (e.g., JavaScript's native `.sort()` for sorting, no cache, sequential execution).

**Unknown hints:**

If the developer writes a hint the compiler doesn't recognize, it asks:

```
  Line 5: "sort the list using radix sort"

  [lume] I don't have a built-in implementation for "radix sort."
    1. Use the default sort instead
    2. Let me write the implementation in a raw: block
    3. Skip this hint and compile without it

  > 1
```

### Acceptance Criteria

- [ ] Hint phrases ("using X", "with X", "for X duration", "limited to X") are parsed as metadata on AST nodes
- [ ] Algorithm hints select specific implementations (quicksort, binary search, etc.)
- [ ] Caching hints generate TTL-based caching wrappers with configurable duration
- [ ] Parallelism hints generate Promise.all or equivalent concurrent execution
- [ ] Limit hints add bounds to queries, loops, and array operations
- [ ] Retry hints generate retry wrappers with configurable count and backoff strategy
- [ ] Timeout hints generate AbortController or setTimeout wrappers
- [ ] Streaming hints use chunked/stream processing instead of full dataset loading
- [ ] Unknown hints trigger Interactive Clarification Mode with fallback options
- [ ] Hints do not change WHAT the instruction does, only HOW it's implemented
- [ ] Instructions without hints compile with sensible defaults

---

## GAP 6: DEBUGGING — ENHANCED SOURCE MAPS AND ENGLISH ERROR MESSAGES

### The Problem

When a compiled JavaScript program throws a runtime error, the developer sees a JavaScript stack trace with line numbers from the `.js` file. They have to mentally map that back to their English instructions. Source maps exist in the spec but the developer experience of debugging — seeing errors in terms of their original English — is not defined.

### The Solution

Enhanced source maps that map every JavaScript line back to the original English instruction, plus a Lume error reporter that translates JavaScript errors into English-context error messages.

### Implementation

**Source map structure (`.lume/source-maps/<file>.map.json`):**

```json
{
  "source": "app.lume",
  "compiled": "app.js",
  "mappings": [
    {
      "js_line": 12,
      "lume_line": 4,
      "lume_instruction": "get the user's name from the database",
      "resolved_by": "Layer 1 (Exact Pattern Match)",
      "confidence": 0.97,
      "ast_node": "VariableAccess"
    }
  ]
}
```

**`lume run` error output:**

Instead of a raw JavaScript stack trace, `lume run` intercepts errors and translates them:

```
$ lume run app.lume

Runtime Error in app.lume:

  Line 4: "get the user's name from the database"
  Error: The user object was null — the database query returned no results.

  What happened:
    Your instruction asked to get the user's name, but the database
    didn't find a matching user. The query returned nothing.

  Suggestions:
    - Add a check before this line: "if the user exists"
    - Make sure the user ID is valid before querying

  Technical details (for advanced users):
    TypeError: Cannot read property 'name' of undefined
    at app.js:12:5
    Resolved by: Layer 1 (Exact Pattern Match, confidence: 0.97)
```

**Error translation rules:**

| JavaScript Error | English Translation |
|-----------------|---------------------|
| Cannot read property 'X' of undefined | "The [object] was empty — [context] returned no results" |
| Cannot read property 'X' of null | "The [object] doesn't exist — check that it was created first" |
| TypeError: X is not a function | "[X] isn't something you can call — it might be a value, not an action" |
| ReferenceError: X is not defined | "[X] hasn't been created yet — you need to create it before using it" |
| RangeError: Maximum call stack | "This instruction calls itself in a loop that never ends — add a stopping condition" |
| Network error / fetch failed | "Couldn't reach [URL] — check the network connection or the address" |
| ENOENT: no such file | "The file [path] doesn't exist — check the filename and path" |
| SyntaxError (in raw: block) | "There's a syntax error in your raw JavaScript block on line [N]" |

**`lume debug` command:**

```bash
$ lume debug app.lume
```

Runs the program with enhanced error catching, pauses on first error, and shows the English context. For more complex debugging, developers can use `lume debug --step` to step through instructions one at a time:

```
$ lume debug --step app.lume

  Step 1/5: "create a list called users" .............. OK (users = [])
  Step 2/5: "get all users from the database" ......... OK (users = [{...}, {...}])
  Step 3/5: "filter by active status" ................. OK (users = [{...}])
  Step 4/5: "get the first user's name" ............... ERROR

  The filtered list has 1 user, but that user has no 'name' field.
  Continue? (y/skip/stop) >
```

### Acceptance Criteria

- [ ] Source maps generated for every compilation, mapping JS lines to English instructions
- [ ] Source maps include resolution metadata (which layer, confidence, AST node type)
- [ ] `lume run` intercepts JavaScript errors and translates to English-context messages
- [ ] Error messages show the original English instruction, not the JavaScript line
- [ ] Error messages include plain-English explanation of what went wrong
- [ ] Error messages include actionable suggestions for fixing the issue
- [ ] Technical details (JS stack trace) available but secondary to the English explanation
- [ ] Common JavaScript errors have predefined English translations
- [ ] `lume debug` runs with enhanced error catching and English-context output
- [ ] `lume debug --step` steps through instructions one at a time showing state after each

---

## GAP 7: TEAM COLLABORATION — LUME LINTER AND STYLE ENFORCEMENT

### The Problem

English is freeform. Without constraints, every developer writes differently. Code review becomes difficult when one person writes "grab the data from the db" and another writes "retrieve all records from the database." Traditional languages solve this with linters (ESLint, pylint) and formatters (Prettier, Black). Lume needs equivalents.

### The Solution

A Lume linter that checks for vague instructions, inconsistent phrasing, ambiguity, and style violations. Works alongside the canonicalization system (Gap 4) but focuses on catching problems rather than fixing them.

### Implementation

**`lume lint` command:**

```bash
$ lume lint app.lume

  app.lume:
    Line 3: "grab the users" -> suggestion: use canonical verb "get" instead of "grab"
    Line 7: "do the thing with the data" -> warning: vague instruction — what thing? what data?
    Line 12: "make it work" -> error: too ambiguous to compile deterministically
    Line 15: "process everything" -> warning: "everything" is unbounded — specify what to process
    Line 20: "fix the bug" -> error: not a compilable instruction — describe the fix

  3 warnings, 2 errors
```

**Lint rules:**

| Rule ID | Severity | What It Catches |
|---------|----------|----------------|
| LUME-L001 | suggestion | Non-canonical verb usage (grab -> get, fetch -> get) |
| LUME-L002 | warning | Vague pronouns without clear antecedent ("do something with it" — what is "it"?) |
| LUME-L003 | warning | Unbounded operations ("process everything", "delete all", "send to everyone") |
| LUME-L004 | error | Non-compilable instructions ("make it work", "fix the bug", "handle the edge cases") |
| LUME-L005 | warning | Inconsistent naming (same concept called different names in different lines) |
| LUME-L006 | suggestion | Overly verbose instruction that could be simplified |
| LUME-L007 | warning | Missing error handling (network call without "if it fails" check) |
| LUME-L008 | suggestion | Instruction could benefit from a hint annotation (e.g., unbounded query without limit) |
| LUME-L009 | warning | Ambiguous "or" — could be interpreted as inclusive or exclusive |
| LUME-L010 | error | Contradictory instructions (line 5 creates X, line 8 says X doesn't exist) |

**Configuration (`.lume/lint-config.json`):**

```json
{
  "lint": {
    "enabled": true,
    "strictness": "standard",
    "rules": {
      "LUME-L001": "suggestion",
      "LUME-L002": "warning",
      "LUME-L003": "warning",
      "LUME-L004": "error",
      "LUME-L005": "warning",
      "LUME-L006": "off",
      "LUME-L007": "warning",
      "LUME-L008": "suggestion",
      "LUME-L009": "warning",
      "LUME-L010": "error"
    },
    "ignore_patterns": ["*.test.lume"],
    "custom_canonical_verbs": {}
  }
}
```

**Strictness levels:**

- `"relaxed"` — only errors, no warnings or suggestions
- `"standard"` — errors and warnings (default)
- `"strict"` — all rules enforced, suggestions become warnings

**IDE integration:**

The linter outputs in standard formats for editor integration:

```bash
$ lume lint --format json app.lume    # JSON output for tooling
$ lume lint --format sarif app.lume   # SARIF format for GitHub
$ lume lint --format text app.lume    # Human-readable (default)
```

**Pre-commit integration:**

```bash
$ lume init --hooks
✓ Added pre-commit hook: lume lint --check && lume canonicalize --check
  (Blocks commit if lint errors exist or code isn't canonical)
```

### Acceptance Criteria

- [ ] `lume lint <file>` analyzes English instructions for style, clarity, and ambiguity issues
- [ ] 10 built-in lint rules covering vague instructions, non-canonical verbs, unbounded operations, contradictions
- [ ] Each rule has configurable severity: off, suggestion, warning, error
- [ ] `lume lint` exits with non-zero code when errors are found (for CI/CD)
- [ ] `.lume/lint-config.json` configures rule severity and strictness level
- [ ] Three strictness levels: relaxed, standard, strict
- [ ] Output formats: text (default), JSON, SARIF
- [ ] Pre-commit hook available via `lume init --hooks`
- [ ] Lint rules are extensible — teams can add custom rules via config
- [ ] Linter runs independently of compilation — can lint without compiling

---

## SUMMARY: ALL GAPS AND THEIR CORE PRINCIPLE

Every gap resolves to the same fundamental principle: **try to understand automatically, and when you can't, ask the developer clearly.**

| Gap | Problem | Solution | Fallback |
|-----|---------|----------|----------|
| 1. Ambiguity ceiling | All 7 layers fail | Interactive Clarification Mode | Ask developer, cache answer |
| 2. Complex logic | Compound boolean expressions | Natural language logic blocks | Bullet-point checklist syntax |
| 3. Cross-file state | Which file owns this variable? | Implicit module resolution | Search project, ask developer, auto-add `using:` |
| 4. Maintenance | Inconsistent English across devs | Canonical form + formatter | Normalize to standard verbs/phrasing |
| 5. Performance control | English can't express algorithm choice | Hint annotations | "using X", "with X", "for X duration" |
| 6. Debugging | JS errors don't map to English | Enhanced source maps + English errors | Show original instruction, explain what went wrong |
| 7. Team collaboration | No linter for English | Lume linter + style enforcement | Catch vague, ambiguous, contradictory instructions |

**Total new acceptance criteria in this document: 73**

---

## RELATIONSHIP TO OTHER HANDOFF DOCUMENTS

This document extends but does not replace:

- **LUME-MILESTONES-7-13-HANDOFF.md** — The core spec. Gaps 1-7 fill holes identified in that spec.
- **LUME-VOICE-TO-CODE-HANDOFF.md** — Voice input. Gap 1 (Interactive Clarification) applies to voice mode as well.
- **LUME-ACADEMIC-PAPER-BRIEF.md** — The academic paper. Gaps 1, 4, and 7 are potential theoretical contributions (error tolerance, canonicalization, English linting).

All three documents plus this one should be provided to the building agent. When we're done, all will be compiled into a single master document.
