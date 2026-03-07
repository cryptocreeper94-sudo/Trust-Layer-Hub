# LUME — The AI-Native Programming Language
### Language Design Specification & Build Roadmap
**Version 0.5 — Complete Draft with Future Vision | March 2026**

---

## 1. VISION & PHILOSOPHY

Lume is a programming language built for the AI era. While existing languages treat AI as an external library you bolt on, Lume treats AI as a first-class primitive — as natural as a variable, a loop, or a function call.

The world has changed. Developers now orchestrate AI agents, chain model calls, handle structured outputs, and build systems where the boundary between code and intelligence is blurring. No language was designed for this reality. Lume is.

**Core Philosophy:**
- Readable — Human-first syntax. Code should read like intent, not machine instructions.
- AI-Native — AI is a native type. Calling a model is syntax, not an import.
- Safe — Errors are impossible to ignore. The language enforces handling them.
- Interoperable — Compiles to JavaScript. Full access to the entire existing ecosystem.
- Approachable — Gradual complexity. Beginners write real programs; experts go deeper.
- Self-Documenting — Intent is documentation. Tests, docs, and types live in the code itself.

**The North Star:** Every decision made in Lume's design must answer YES to this question: "Does this make it easier to build AI-powered software while keeping code readable by a human being?"

---

## 2. PAIN POINTS BEING SOLVED

Lume is a direct response to 7 documented pain points in modern programming. Every language feature maps back to at least one of these.

**Pain Point 1 — The Learning Cliff**
Current reality: Hello world -> pointers/async with no middle ground. Beginners get dropped off a cliff.
Lume solution: Graduated complexity layers. You can build real software at Layer 1 without ever touching Layer 3.

**Pain Point 2 — Async/Concurrency Mess**
Current reality: async/await, callbacks, Promises — still confusing. Threads are dangerous.
Lume solution: Concurrency is invisible by default. The runtime handles it. You opt into control only when needed.

**Pain Point 3 — Ugly Error Handling**
Current reality: Try/catch is verbose. Ignoring errors is easy and common. Rust is correct but intimidating.
Lume solution: Errors are values, not exceptions. Every operation that can fail returns a Result. You cannot ignore it.

**Pain Point 4 — Code Doesn't Read Like English**
Current reality: if (user.age >= 18 && user.verified) — technical noise everywhere.
Lume solution: Natural syntax: "if user is adult and verified" — reads as close to plain English as possible.

**Pain Point 5 — No AI-Native Language**
Current reality: Python dominates AI but was never designed for it. Calling models requires imports, JSON wrangling, error handling boilerplate.
Lume solution: ask, think, generate are keywords. Model calls are first-class expressions with typed outputs.

**Pain Point 6 — Config vs Code Split**
Current reality: JSON configs, YAML, .env files, and code all doing overlapping things. Fragmented.
Lume solution: Config is code. Environment, settings, and logic live in one unified syntax.

**Pain Point 7 — Intent is Invisible**
Current reality: Comments go stale. Tests live in separate files. Docs are optional afterthoughts.
Lume solution: Intent blocks are first-class syntax. Tests and documentation are written inline and enforced.

---

## 3. SYNTAX DESIGN

### 3.1 Variables & Types
```
// Inferred types
let name = "Ada"
let age = 28
let active = true

// Explicit types
let score: number = 0
let tags: list of text = ["ai", "code", "lume"]

// Constants
define MAX_RETRIES = 3
```

### 3.2 Conditions — Human-Readable
```
// Natural style (preferred)
if user is verified and user.age is at least 18:
    allow access

if score is greater than 100:
    set score to 100

// Traditional style (also valid)
if (user.verified && user.age >= 18):
    allow access
```

### 3.3 Functions
```
// Define a function
to greet(name: text) -> text:
    return "Hello, " + name

// Call it
let message = greet("Ada")

// Short form
to double(n: number) -> n * 2
```

### 3.4 AI Calls — First Class
```
// Ask a model a question (uses default provider)
let summary = ask "Summarize this in 3 bullets: " + article

// Ask with a specific model
let review = ask claude.sonnet "Review this code for bugs:" + code

// Ask with structured output
let sentiment: { score: number, label: text } =
    ask gpt.4o "Analyze sentiment:" + review as json

// Chain model calls
let draft = ask "Write a blog post about:" + topic
let improved = ask "Improve the tone to be friendlier:" + draft
let final = ask "Add a compelling title to:" + improved

// Think — internal reasoning, not shown to user (system prompt style)
let plan = think "Break this problem into 5 steps:" + problem

// Generate — creative/generative output (higher temperature)
let story = generate "A short sci-fi story about:" + premise
```

### 3.5 Error Handling
```
// Result type — must handle both cases
let result = fetch data from "https://api.example.com/users"

when result is:
    ok(data)  -> show data.users
    error(e)  -> log "Failed: " + e.message

// Short form
let data = fetch "https://api.example.com" or fail with "Could not connect"
```

### 3.6 Concurrency — Invisible by Default
```
// These run in parallel automatically — no async/await needed
let weather = fetch weather for "New York"
let news    = fetch headlines from "reuters"
let stocks  = fetch price of "AAPL"

show weather, news, stocks

// Explicit sequential (when order matters)
let token   = login with credentials
let profile = fetch profile using token
```

### 3.7 Intent Blocks — Built-In Docs & Tests
```
to calculate_discount(price: number, tier: text) -> number:
    intent:
        "Returns a discounted price based on customer tier"
        given price = 100, tier = "gold"   expects 80
        given price = 100, tier = "silver" expects 90
        given price = 100, tier = "none"   expects 100

    when tier is:
        "gold"   -> return price * 0.80
        "silver" -> return price * 0.90
        default  -> return price
```

### 3.8 Loops & Iteration
```
// For each — iterate over a list
let colors = ["red", "green", "blue"]
for each color in colors:
    show color

// For each with index
for each item, index in colors:
    show "{index}: {item}"

// Range-based loop (inclusive start, exclusive end)
for i in 0 to 10:
    show i

// Range with step
for i in 0 to 100 by 5:
    show i

// While loop
let count = 0
while count is less than 10:
    show count
    set count to count + 1

// Loop control
for each item in items:
    if item is null:
        continue
    if item.name is "stop":
        break
    show item.name

// Infinite loop (must break manually)
while true:
    let input = read line
    if input is "quit":
        break
    show "You said: {input}"
```

### 3.10 String Interpolation
```
// Template strings using curly braces inside double quotes
let name = "Ada"
let greeting = "Hello, {name}! Welcome to Lume."

// Expressions inside interpolation
let price = 49.99
let message = "Total: ${price * 1.08} after tax"

// Multi-line strings using triple quotes
let html = """
    <div>
        <h1>{title}</h1>
        <p>{description}</p>
    </div>
"""
```

### 3.11 Comments
```
// Single-line comment

/* Multi-line comment
   spanning multiple lines */

/// Documentation comment — attached to the next declaration
/// These are extracted by the doc generator
to add(a: number, b: number) -> a + b
```

---

## 4. LANGUAGE RULES — DEFINITIVE DECISIONS

This section resolves every ambiguity an implementing agent would encounter. These decisions are final.

### 4.1 Complete Keyword List

The following words are **reserved keywords** and cannot be used as identifiers:

**Core:**
`let`, `define`, `set`, `to`, `return`, `if`, `else`, `when`, `is`, `and`, `or`, `not`, `for`, `each`, `in`, `while`, `break`, `continue`, `show`, `log`, `then`, `by`

**AI:**
`ask`, `think`, `generate`, `as`

**Modules:**
`use`, `export`, `from`, `all`

**Types:**
`text`, `number`, `boolean`, `list`, `map`, `of`, `any`, `nothing`, `maybe`

**Error Handling:**
`ok`, `error`, `fail`, `with`, `or`, `try`

**Testing:**
`test`, `expect`, `to`, `equal`, `intent`, `given`, `expects`

**Literals:**
`true`, `false`, `null`

**Pattern Matching:**
`default`

### 4.2 Complete Operator List

**Arithmetic:** `+`, `-`, `*`, `/`, `%` (modulo)
**Comparison:** `==`, `!=`, `>`, `<`, `>=`, `<=`
**Assignment:** `=`, `+=`, `-=`, `*=`, `/=`
**Logical:** `&&`, `||`, `!` (traditional) — or use keywords `and`, `or`, `not` (natural)
**Access:** `.` (dot), `[]` (index)
**Type:** `->` (return type), `:` (type annotation)
**Spread:** `...` (spread/rest)

**Natural language operators** (these map to the traditional operators above):
- `is` maps to `==`
- `is not` maps to `!=`
- `is greater than` maps to `>`
- `is less than` maps to `<`
- `is at least` maps to `>=`
- `is at most` maps to `<=`
- `and` maps to `&&`
- `or` maps to `||`
- `not` maps to `!`

### 4.3 Indentation Rules

- **Spaces only. No tabs.** 4 spaces per indentation level.
- Indentation defines blocks (like Python). A colon (`:`) at the end of a line opens a new block.
- Curly braces `{ }` are **also valid** as an alternative block syntax for developers who prefer them.
- The parser must support both styles, but they cannot be mixed within the same block.

```
// Indentation style (preferred)
to greet(name: text) -> text:
    return "Hello, {name}"

// Brace style (also valid)
to greet(name: text) -> text {
    return "Hello, {name}"
}
```

### 4.4 Type System

**Primitive types:**
| Type | Description | Example |
|------|-------------|---------|
| `text` | String/text value | `"hello"` |
| `number` | Integer or floating point | `42`, `3.14` |
| `boolean` | True or false | `true`, `false` |
| `null` | Absence of value | `null` |

**Collection types:**
| Type | Description | Example |
|------|-------------|---------|
| `list of T` | Ordered collection | `list of number` |
| `map of T` | Key-value pairs (keys are always text) | `map of number` |

**Special types:**
| Type | Description | Usage |
|------|-------------|-------|
| `any` | Any type (opt out of type checking) | Interop with untyped JS |
| `nothing` | No return value (void) | Functions with no return |
| `maybe T` | Nullable type, value may be null | `maybe text` |
| `result of T` | Success or error wrapper | `result of text` |

**Custom types (structs):**
```
type User:
    name: text
    age: number
    email: maybe text
    verified: boolean = false

let ada = User { name: "Ada", age: 28, email: null }
```

**Type aliases:**
```
type Score = number
type UserList = list of User
```

### 4.5 AI Keywords — ask vs think vs generate

These three keywords are distinct and map to different model behaviors:

| Keyword | Purpose | Temperature | Maps To |
|---------|---------|-------------|---------|
| `ask` | Direct question/instruction to a model. Standard completion. | 0.7 (balanced) | `messages: [{ role: "user", content: prompt }]` |
| `think` | Internal reasoning. System-prompt style. The model reasons through a problem but the output is treated as structured analysis, not user-facing prose. | 0.3 (precise) | `messages: [{ role: "system", content: "Reason step by step." }, { role: "user", content: prompt }]` |
| `generate` | Creative/generative output. Higher randomness for variety. | 1.0 (creative) | `messages: [{ role: "user", content: prompt }]` with `temperature: 1.0` |

All three return `result of text` by default. If `as json` is appended with a type annotation, they return `result of { ... }` (the structured type).

On failure (network error, rate limit, invalid response), they return an `error` result that **must** be handled.

### 4.6 AI Provider Configuration

Providers are configured in a `lume.config` file at the project root. This file uses Lume syntax (config is code):

```
// lume.config
providers:
    default: claude.sonnet

    claude:
        key: env.ANTHROPIC_API_KEY
        models:
            sonnet: "claude-sonnet-4-20250514"
            haiku: "claude-haiku-4-20250514"
            opus: "claude-opus-4-20250514"

    gpt:
        key: env.OPENAI_API_KEY
        models:
            4o: "gpt-4o"
            mini: "gpt-4o-mini"

    local:
        url: "http://localhost:11434"
        models:
            llama: "llama3"
```

**Usage:**
```
// Uses default provider (claude.sonnet)
let answer = ask "What is 2+2?"

// Explicit model selection
let answer = ask gpt.4o "What is 2+2?"
let answer = ask claude.haiku "What is 2+2?"
let answer = ask local.llama "What is 2+2?"
```

**Environment variables** are accessed via `env.VARIABLE_NAME` — these read from the process environment at runtime. No `.env` file parser needed; the runtime reads `process.env` directly.

### 4.7 Standard Library (stdlib)

The following modules ship with Lume and are available without `use` imports:

**Built-in (always available, no import needed):**
- `show` — Print to console
- `log` — Print to console (alias of show, used for debug output)
- `fetch` — HTTP requests (GET/POST/PUT/DELETE)
- `ask` / `think` / `generate` — AI model calls
- `type` / `of` — Type checking

**Standard library (import with `use`):**

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `use "strings"` | String utilities | `split`, `join`, `trim`, `upper`, `lower`, `contains`, `replace`, `starts_with`, `ends_with`, `pad_left`, `pad_right` |
| `use "math"` | Math operations | `round`, `floor`, `ceil`, `abs`, `min`, `max`, `random`, `sqrt`, `pow`, `pi`, `e` |
| `use "time"` | Date and time | `now`, `today`, `parse_date`, `format_date`, `diff`, `add_days`, `add_hours`, `timestamp` |
| `use "json"` | JSON parsing | `parse`, `stringify`, `pretty` |
| `use "files"` | File I/O | `read`, `write`, `append`, `exists`, `delete`, `list_dir` |
| `use "http"` | Advanced HTTP | `get`, `post`, `put`, `delete`, `headers`, `timeout` |
| `use "crypto"` | Cryptography | `hash`, `hmac`, `uuid`, `random_bytes`, `encrypt`, `decrypt` |
| `use "env"` | Environment | `get`, `set`, `all`, `require` |

### 4.8 Concurrency Detection Rules

The transpiler determines parallelism statically using these rules:

1. **Independent statements** — Two or more consecutive `let` assignments whose right-hand sides do not reference each other's identifiers are eligible for parallel execution.
2. **Dependent statements** — If a `let` assignment references an identifier defined in a previous `let` in the same block, it is sequential (must wait for the dependency).
3. **Explicit sequential** — The `then` keyword forces sequential execution even if the transpiler detects independence.
4. **AI calls** — All `ask`, `think`, `generate` calls are async. Multiple independent AI calls in the same block run in parallel via `Promise.all`.

```
// Parallel — weather, news, and stocks are independent
let weather = fetch weather for "New York"
let news    = fetch headlines from "reuters"
let stocks  = fetch price of "AAPL"
// Transpiles to: const [weather, news, stocks] = await Promise.all([...])

// Sequential — profile depends on token
let token   = login with credentials
let profile = fetch profile using token
// Transpiles to: const token = await ...; const profile = await ...;

// Forced sequential
let a = ask "First question"
then let b = ask "Second question using: " + a
```

### 4.9 Scoping Rules

Lume uses **block scoping**. A variable is visible only within the block where it is declared and any nested blocks inside it.

**Rules:**
1. Variables declared with `let` are scoped to the nearest enclosing block (function body, if/else branch, loop body, or top-level).
2. Constants declared with `define` follow the same block scoping rules.
3. Inner blocks **can read** variables from outer blocks.
4. Inner blocks **cannot reassign** variables from outer blocks unless using `set`. The `set` keyword explicitly signals mutation of an outer-scope variable.
5. **Shadowing is allowed** but requires an explicit `let` redeclaration. The inner variable hides the outer one for the duration of the inner block.
6. Function parameters are scoped to the function body.
7. Top-level declarations are module-scoped (visible throughout the file, not globally across files).

```
let name = "Ada"

to greet():
    // Can read outer 'name'
    show "Hello, {name}"

    // Shadowing — new 'name' in this scope only
    let name = "Grace"
    show "Now greeting {name}"

// Original 'name' is still "Ada" here
show name

// Mutation of outer scope with 'set'
let counter = 0
to increment():
    set counter to counter + 1

increment()
show counter  // 1
```

**Transpilation:** `let` maps to JavaScript `let` (block-scoped). `define` maps to JavaScript `const`. Scoping rules align naturally with JS block scoping.

### 4.10 Module System

Lume uses a file-based module system. Every `.lume` file is a module.

**Importing npm packages:**
```
// Import entire package with alias
use "lodash" as _
use "axios" as http

// Import specific functions from a package
use { sortBy, groupBy } from "lodash"
use { get, post } from "axios"
```

**Importing local Lume modules:**
```
// Import from a local file (extension optional)
use "./helpers" as helpers
use "./models/user" as User

// Import specific functions from a local file
use { validate, format } from "./helpers"
```

**Exporting from a Lume module:**
```
// Export a function
export to add(a: number, b: number) -> a + b

// Export a variable
export let version = "1.0"

// Export a type
export type User:
    name: text
    age: number

// Export a constant
export define MAX_SIZE = 100
```

**Module resolution order:**
1. Built-in stdlib modules (`"strings"`, `"math"`, `"time"`, etc.) — resolved first
2. Local files — if the path starts with `./` or `../`, resolve relative to the current file
3. npm packages — if not a stdlib module and not a relative path, look in `node_modules/`

**File extension:** Lume source files use the `.lume` extension. When importing local modules, the extension is optional — `use "./helpers"` and `use "./helpers.lume"` are equivalent.

**Circular imports:** Not allowed. The compiler detects circular dependencies at parse time and produces a clear error message listing the cycle. Restructure code using a shared module to break cycles.

**Re-exports:**
```
// Re-export everything from another module
export all from "./utils"

// Re-export specific items
export { validate, format } from "./helpers"
```

### 4.11 Error Messages & Diagnostics

Lume's compiler errors must be clear, helpful, and actionable. A developer should never have to Google what an error means.

**Error format:**
```
Error [E001] in hello.lume at line 5, column 12:

  5 |   let result = aask "What is 2+2?"
                     ^^^^

  Unknown keyword 'aask'. Did you mean 'ask'?
```

**Required components of every error:**
1. **Error code** — Unique identifier (E001, E002, etc.) for documentation lookup
2. **File name** — Which file the error occurred in
3. **Line and column** — Exact position in the source
4. **Source context** — The offending line with a caret (`^^^^`) pointing to the problem
5. **Plain-English explanation** — What went wrong, in a sentence a beginner can understand
6. **Suggestion** (when possible) — "Did you mean...?" or "Try this instead..."

**Error categories:**

| Code Range | Category | Example |
|------------|----------|---------|
| E001-E099 | Syntax errors | Missing colon, unmatched brackets, invalid indentation |
| E100-E199 | Type errors | Wrong type passed to function, incompatible assignment |
| E200-E299 | Name errors | Undefined variable, unknown function, typo in keyword |
| E300-E399 | Import errors | Module not found, circular dependency, missing export |
| E400-E499 | AI errors | Missing provider config, invalid model name, no API key |
| E500-E599 | Runtime errors | Division by zero, index out of bounds, null access |

**"Did you mean?" suggestions:**
The compiler uses Levenshtein distance (edit distance) to suggest corrections when an identifier or keyword is close to a known name. Threshold: suggest if edit distance is 2 or less.

```
Error [E200] in app.lume at line 3, column 1:

  3 |   shw "Hello"
      ^^^

  Unknown identifier 'shw'. Did you mean 'show'?
```

**Unhandled Result warning:**
```
Warning [W001] in app.lume at line 7, column 5:

  7 |   let data = fetch "https://api.example.com"
          ^^^^

  This fetch returns a Result type but you are not handling the error case.
  Use 'when result is: ok(data) -> ... error(e) -> ...' or append 'or fail with "message"'.
```

**Tab character error:**
```
Error [E003] in app.lume at line 4, column 1:

  4 |  [TAB]let x = 5
      ^^^

  Tabs are not allowed in Lume. Use 4 spaces per indentation level.
```

### 4.12 REPL Mode (Interactive Playground)

Running `lume` with no arguments drops into an interactive REPL (Read-Eval-Print Loop). This is a live coding environment where developers can experiment with Lume one expression at a time.

**Starting the REPL:**
```
$ lume
Lume v1.0 — Interactive Mode
Type 'help' for commands, 'exit' to quit.

>
```

**Basic usage:**
```
> let name = "Ada"
> show "Hello, {name}"
Hello, Ada

> to double(n: number) -> n * 2
> show double(21)
42

> let answer = ask "What is the capital of France?"
Paris

> let cities = ask "Name 3 cities in Japan" as json
> for each city in cities:
...     show city
Tokyo
Osaka
Kyoto
```

**REPL commands (prefixed with colon):**
| Command | Action |
|---------|--------|
| `:help` | Show available commands |
| `:exit` or `:quit` | Exit the REPL |
| `:clear` | Clear all declared variables and functions |
| `:vars` | List all currently defined variables and their types |
| `:type expr` | Show the inferred type of an expression without evaluating it |
| `:time expr` | Evaluate an expression and show execution time |
| `:save filename` | Save the current session as a `.lume` file |
| `:load filename` | Load and execute a `.lume` file into the session |
| `:model provider.model` | Switch the default AI model for the session |
| `:history` | Show command history |

**Multi-line input:**
When a line ends with `:` (opening a block), the REPL switches to multi-line mode, indicated by `...` instead of `>`. An empty line or dedent completes the block.

```
> to greet(name: text) -> text:
...     return "Hello, {name}!"
...
> show greet("world")
Hello, world!
```

**REPL-specific behavior:**
- Expression results are automatically printed (no `show` needed for top-level expressions)
- Variables persist across lines within a session
- Errors do not crash the REPL — they display the error and return to the prompt
- AI calls work live (requires configured `lume.config` or environment variables)
- Tab completion for keywords, stdlib functions, and declared variables
- Up/down arrow keys navigate command history

**Transpilation:** The REPL works by transpiling each input to JavaScript and evaluating it in a persistent Node.js context via `vm.createContext`. Variables persist because they're stored in the shared context object.

---

## 5. INTEROPERABILITY

Lume compiles to clean, readable JavaScript. This means every npm package works natively, Lume runs in any browser or Node environment, and existing JS codebases can call Lume modules and vice versa.

### Transpilation Example
```
// Lume source
let message = ask "Translate to French:" + greeting

// Compiled JavaScript output
const message = await lume.ask({
  prompt: "Translate to French: " + greeting,
  model: lume.config.providers.default
});
```

### Calling JS from Lume
```
use "lodash" as _
use "axios" as http

let sorted = _.sortBy(users, "name")
let response = http.get("https://api.example.com")
```

### Calling Lume from JavaScript
```
// Lume module (math.lume)
export to add(a: number, b: number) -> a + b

// In JavaScript
import { add } from './math.lume'
console.log(add(2, 3))  // 5
```

**Supported interop targets:** JavaScript/Node (native transpile), TypeScript (type export), Python (REST bridge), REST APIs (native fetch syntax), AI Model APIs (native ask/think/generate), Browser APIs (via JS layer).

---

## 6. PROVING THE LANGUAGE WORKS

### Test Suite Strategy
```
test "addition works":
    expect 2 + 2 to equal 4

test "string concatenation":
    let name = "Lume"
    expect "Hello, " + name to equal "Hello, Lume"

test "conditional logic":
    let x = 10
    if x is greater than 5:
        expect true

test "string interpolation":
    let who = "world"
    expect "Hello, {who}!" to equal "Hello, world!"
```

### Validation Layers
- Layer 1: Unit tests — individual language features in isolation
- Layer 2: Integration tests — programs combining multiple features
- Layer 3: Transpile verification — compiled JS output is valid and equivalent
- Layer 4: Interop tests — Lume calls JS and JS calls Lume
- Layer 5: Intent block tests — intent blocks run as executable specs automatically

**Definition of Proven:** Lume is proven at v1.0 when all 100+ test suite programs execute correctly, 3 real-world example apps are built in Lume, JS interop is verified bidirectionally, and intent blocks run as executable tests automatically.

---

## 7. TECHNICAL ARCHITECTURE

### The Four Components
```
Source Code (.lume)
       |
  [1. LEXER]       -- Breaks source into tokens
       |
  [2. PARSER]      -- Builds Abstract Syntax Tree (AST)
       |
  [3. TRANSPILER]  -- Walks AST and emits JavaScript
       |
  JavaScript Output -- Runs in Node.js or any browser
```

### File Structure
```
lume/
  src/
    lexer.js        # Tokenizer
    parser.js       # AST builder
    transpiler.js   # JS code emitter
    runtime.js      # Runtime helpers (Result, AI wrappers)
    stdlib/         # Standard library
      strings.js
      math.js
      time.js
      json.js
      files.js
      http.js
      crypto.js
      env.js
  bin/
    lume.js         # CLI entry point
  editor/
    lume-lang.js    # Monaco IDE integration
  tests/
    unit/
    integration/
    interop/
  examples/
    hello.lume
    ai_summarizer.lume
    web_agent.lume
    chat_bot.lume
    todo_api.lume
  docs/
    spec.md
```

### Component Responsibilities
- **Lexer (src/lexer.js):** Tokenizes source. Handles all Lume keywords (see Section 4.1), operators (see Section 4.2), string literals (including interpolation), numbers, identifiers, comments, and indentation tracking.
- **Parser (src/parser.js):** Consumes tokens, builds AST nodes. Handles operator precedence, block scoping via indentation or braces, natural language operator mapping, and type annotations.
- **Transpiler (src/transpiler.js):** Walks AST, emits JS. Handles AI call expansion (ask/think/generate routing through runtime), error result wrapping, concurrency detection (see Section 4.8), and string interpolation compilation.
- **Runtime (src/runtime.js):** Small JS library included in output. Provides Result type, AI model call helpers (provider routing, temperature mapping), standard library modules, and concurrency utilities (Promise.all wrapper).
- **CLI (bin/lume.js):** Commands: `lume run file.lume`, `lume build`, `lume test`, `lume playground`, `lume init`
- **Monaco Plugin (editor/lume-lang.js):** Syntax highlighting, autocomplete, inline error display, intent block test runner.

### AST Node Types

Every language construct maps to a documented AST node. The implementing agent must use these exact node type names:

| Node Type | Description | Example Source |
|-----------|-------------|----------------|
| `Program` | Root node, contains list of statements | (entire file) |
| `LetDeclaration` | Variable binding | `let x = 5` |
| `DefineDeclaration` | Constant binding | `define PI = 3.14` |
| `FunctionDeclaration` | Function definition | `to greet(name: text) -> text:` |
| `ReturnStatement` | Return from function | `return x` |
| `ShowStatement` | Print to console | `show "hello"` |
| `LogStatement` | Debug print | `log "debug info"` |
| `IfStatement` | Conditional | `if x is 5:` |
| `WhenStatement` | Pattern matching | `when result is:` |
| `ForEachStatement` | List iteration | `for each item in list:` |
| `ForEachIndexStatement` | Iteration with index | `for each item, index in list:` |
| `ForRangeStatement` | Range-based loop | `for i in 0 to 10:`, `for i in 0 to 100 by 5:` |
| `WhileStatement` | While loop | `while active:` |
| `BreakStatement` | Exit loop | `break` |
| `ContinueStatement` | Skip to next iteration | `continue` |
| `AskExpression` | AI ask call | `ask "question"` |
| `ThinkExpression` | AI think call | `think "reason about"` |
| `GenerateExpression` | AI generate call | `generate "create"` |
| `FetchExpression` | HTTP request | `fetch data from url` |
| `BinaryExpression` | Binary operation | `a + b`, `x == y` |
| `UnaryExpression` | Unary operation | `not x`, `-n` |
| `CallExpression` | Function call | `greet("Ada")` |
| `MemberExpression` | Property access | `user.name` |
| `IndexExpression` | Index access | `list[0]` |
| `StringLiteral` | String value | `"hello"` |
| `InterpolatedString` | Template string | `"Hello, {name}"` |
| `NumberLiteral` | Numeric value | `42`, `3.14` |
| `BooleanLiteral` | Boolean value | `true`, `false` |
| `NullLiteral` | Null value | `null` |
| `ListLiteral` | List/array | `[1, 2, 3]` |
| `MapLiteral` | Object/map | `{ key: value }` |
| `Identifier` | Variable reference | `username` |
| `TypeAnnotation` | Type declaration | `: number`, `: list of text` |
| `TypeDeclaration` | Custom type/struct | `type User:` |
| `IntentBlock` | Inline docs/tests | `intent:` |
| `TestBlock` | Test declaration | `test "name":` |
| `ExpectStatement` | Test assertion | `expect x to equal 5` |
| `UseStatement` | Module import | `use "lodash" as _` |
| `ExportStatement` | Module export | `export to add(...)` |
| `SetStatement` | Outer scope mutation | `set counter to counter + 1` |
| `AssignmentExpression` | Compound reassignment | `x += 1`, `score -= 10` |
| `ResultPattern` | ok/error matching | `ok(data) ->` |
| `BlockStatement` | Indented block | (group of indented statements) |
| `CommentNode` | Comment (preserved) | `// comment` |

---

## 8. BUILD ROADMAP

### Milestone 1 — Hello World (Week 1-2)
Goal: Get the first Lume program running end-to-end.
- Build lexer: tokenize `let`, `=`, strings (with interpolation), numbers, `show` keyword, comments
- Build parser: parse variable declarations, print statements, string concatenation
- Build transpiler: emit valid JavaScript
- Test: `let name = "Lume" \n show name` outputs "Lume"
- Test: string interpolation `let x = "world" \n show "Hello, {x}"` outputs "Hello, world"
DONE WHEN: `lume run hello.lume` prints output to console correctly.

### Milestone 2 — Core Language (Week 3-5)
Goal: All fundamental language features working.
- Variables, constants, all primitive types (text, number, boolean, null)
- Scoping rules (block scoping, shadowing with explicit `let`, outer mutation with `set`)
- Arithmetic, string operations, comparisons (both natural and traditional)
- if/when/else conditions with natural syntax AND traditional syntax
- Functions (`to` keyword), return values, short form
- Custom types (`type` keyword, struct-like)
- Loops: `for each`, `for each` with index, range-based `for i in 0 to 10`, range with step (`by`), `while`, `break`, `continue`
- Lists and iteration
- Maps and property access
- Error handling (Result type, `when is` pattern, `or fail with` short form)
- String interpolation in transpiled output
- Multi-line strings (triple quotes)
- Comments (single-line, multi-line, doc comments)
- Compiler error messages with file, line, column, source context, and plain-English explanations (see Section 4.11)
DONE WHEN: 50% of the unit test suite passes.

### Milestone 3 — AI Integration (Week 6-9)
Goal: Native AI calls working as first-class syntax.
- `ask` keyword transpiles to model calls through runtime.js
- `think` keyword with system prompt wrapping and lower temperature
- `generate` keyword with higher temperature for creative output
- Model selector syntax (`ask claude.sonnet`, `ask gpt.4o`, `ask local.llama`)
- `lume.config` file parsing for provider configuration
- Structured output parsing (`as json` type casting)
- Chain calls work correctly (sequential by dependency detection)
- Error handling for model failures (network, rate limit, invalid response)
- Environment variable access for API keys (`env.VARIABLE_NAME`)
DONE WHEN: `ai_summarizer.lume` runs and produces correct AI-generated output with at least 2 different providers.

### Milestone 4 — Interoperability (Week 10-12)
Goal: Lume and JavaScript work together seamlessly.
- `use` keyword imports npm/JS modules (full package and named imports)
- `use { specific } from "package"` destructured imports
- Local Lume module imports (`use "./helpers"`)
- Lume modules export to JS correctly (`export to`, `export let`, `export type`, `export define`)
- Re-exports (`export all from`, `export { x } from`)
- Circular import detection with clear error messages
- Module resolution order (stdlib -> local -> npm)
- HTTP fetch syntax compiles to valid async JS
- Concurrency detection and parallel execution (Promise.all for independent calls)
- `then` keyword for forced sequential execution
- TypeScript type definition export on build
- `maybe` type maps to nullable in TS output
DONE WHEN: Lume can call lodash, axios, and a custom JS module. JS can import a Lume module. Circular imports are detected and reported.

### Milestone 5 — Tooling & IDE (Week 13-16)
Goal: Developer experience that makes Lume a joy to use.
- Monaco syntax highlighting for Lume (all keywords, operators, string interpolation)
- Inline error display in editor with source context and suggestions
- Autocomplete for keywords, stdlib functions, and declared variables
- `lume test` command runs intent blocks automatically
- `lume init` command scaffolds a new project with `lume.config` template
- `lume` (no args) launches the interactive REPL (see Section 4.12)
- REPL colon-commands: `:help`, `:vars`, `:type`, `:time`, `:save`, `:load`, `:model`, `:history`, `:clear`, `:exit`
- REPL multi-line input, session persistence, tab completion
- "Did you mean?" suggestions in error output (Levenshtein distance, threshold 2)
- Error codes (E001-E599) documented and searchable
- Browser playground integrated into Monaco IDE
- 5 real example apps documented and runnable
- Standard library fully implemented (strings, math, time, json, files, http, crypto, env)
DONE WHEN: A developer who has never seen Lume can open the playground, write a program, and run it within 5 minutes with no instructions. The REPL allows live AI calls and multi-line programs interactively.

---

## 9. AGENT HANDOFF INSTRUCTIONS

You are being asked to build the Lume programming language — an AI-native language that transpiles to JavaScript. Read this entire document before writing any code.

### Your First Task
Build Milestone 1. Make this exact program run:

```
// hello.lume
let language = "Lume"
let version = 1
show "Hello from {language} v{version}"
```

Expected output: `Hello from Lume v1`

Build `src/lexer.js`, `src/parser.js`, and `src/transpiler.js` to make this work. When it passes, report back and await instructions for Milestone 2.

### Implementation Rules
1. Build in JavaScript (Node.js). No external dependencies for the core compiler.
2. Write tests FIRST for each feature, then implement until they pass.
3. Transpiler output must be readable JavaScript — not minified.
4. Every Lume keyword must map to a documented AST node type (see Section 7 AST Node Types table).
5. AI calls must go through `runtime.js` helper — never call provider APIs directly in transpiled output.
6. Preserve line numbers in transpiled output for debuggability.
7. Work through Milestones 1-5 in order. Do not skip ahead.
8. Use the keyword list in Section 4.1 as the definitive set — do not invent new keywords without documenting them.
9. Use the operator list in Section 4.2 as the definitive set — natural language operators must map to their traditional equivalents.
10. Indentation is 4 spaces per level. Tabs are invalid and should produce a parse error.
11. String interpolation uses `{expression}` inside double-quoted strings. The lexer must handle this.
12. The `lume.config` file is read by `runtime.js` at startup. If no config exists, use sensible defaults (default model: gpt.4o, temperature: 0.7).

### Key Design Decisions to Preserve
- Natural language keywords (`is`, `and`, `or`, `at least`, `greater than`) supported alongside traditional operators
- Indentation defines blocks — no curly braces required (though they are valid as an alternative)
- The `ask` keyword is reserved exclusively for AI model calls (standard temperature)
- The `think` keyword is for reasoning/analysis (low temperature, system prompt wrapping)
- The `generate` keyword is for creative output (high temperature)
- Result type wraps all fallible operations — never throw exceptions at the language level
- Intent blocks (`intent:`) must be parsed and stored even if not executed until Milestone 5
- String interpolation with `{expr}` is a core feature, not syntactic sugar — implement in the lexer

### Deliverables Per Milestone
For each milestone provide: (1) working code, (2) passing tests, (3) a brief summary of what was built and any design decisions made. Keep CHANGELOG.md updated throughout.

---

## 10. FUTURE VISION — PICTOGRAPHIC MODE & DEV KEYBOARD

*This section describes a future endeavor beyond v1.0. It is not part of the current build roadmap but should be preserved for future development.*

### 10.1 The Concept

Lume v1.0 is a text-based language designed to read close to English. But the long-term vision goes further: a pictographic input mode where single symbols represent entire programming concepts, paired with a custom developer keyboard (physical or virtual) designed for symbol-based coding.

The inspiration comes from two real-world systems:
- **Pictographic writing** (like Paleo-Hebrew, hieroglyphics, or Chinese characters) where one symbol carries a complete idea — no spelling, no parsing individual letters. The reader sees the symbol and immediately understands the concept.
- **Stenography keyboards** used by courtroom stenographers, where a single chord (multiple keys pressed simultaneously) produces an entire word or phrase. A trained stenographer types at 225+ words per minute because they're not typing letters — they're typing concepts. One keystroke = one idea.

Lume's current keywords already work this way at a small scale: `ask` is one word that represents an entire AI model call with configuration, error handling, and response parsing. Pictographic mode takes this further — one symbol represents what currently takes an entire line of code.

### 10.2 How It Would Work

**Symbol vocabulary:** Each core Lume operation maps to a unique pictographic symbol:

| Symbol | Concept | Lume Equivalent |
|--------|---------|-----------------|
| (AI brain icon) | Ask AI | `ask "prompt"` |
| (thought bubble icon) | Think/Reason | `think "prompt"` |
| (spark icon) | Generate creative | `generate "prompt"` |
| (arrow down icon) | Fetch data | `fetch data from url` |
| (eye icon) | Show/Display | `show value` |
| (loop icon) | For each | `for each item in list:` |
| (branch icon) | If/condition | `if condition:` |
| (box icon) | Let/variable | `let name = value` |
| (lock icon) | Define/constant | `define NAME = value` |
| (shield icon) | Error handling | `or fail with "message"` |
| (link icon) | Import module | `use "module" as alias` |
| (send icon) | Export | `export to function(...)` |

**The Dev Keyboard:** A custom input device (physical USB keyboard or virtual on-screen keyboard) with symbol keys instead of — or in addition to — letter keys. Think of it as a stenography machine for programming:

- **Physical version:** A compact keyboard with 30-40 symbol keys, each representing a Lume concept. Chord combinations (pressing multiple keys at once) create compound operations. For example: (AI brain) + (list) = "ask for a list and parse as JSON." Single symbol entry for rapid coding.
- **Virtual version:** An on-screen keyboard inside the Lume playground or IDE plugin. Developers tap symbols on a tablet or touchscreen to compose programs visually. Each tap adds a structured code block to the editor.
- **Voice + symbol hybrid:** Speak the intent ("fetch weather for Dallas"), and the system displays the corresponding symbols in the editor, which the developer confirms or adjusts. The symbols then compile to Lume text, which compiles to JavaScript.

### 10.3 Expansion Pipeline

```
Symbol Input (keyboard/touch/voice)
       |
  [SYMBOL PARSER]  -- Converts symbols to Lume source text
       |
  Lume Source Code (.lume)
       |
  [LEXER + PARSER + TRANSPILER]  -- Existing Lume pipeline
       |
  JavaScript Output
```

The pictographic layer sits on top of the existing Lume compiler. It doesn't replace anything — it adds a new input method. The symbols produce standard Lume text, which flows through the same lexer, parser, and transpiler already built.

### 10.4 Why This Matters

- **Speed:** A stenographer is 3-4x faster than a typist. A developer using symbol chords could be significantly faster than one typing keywords letter by letter.
- **Accessibility:** People who struggle with English syntax — non-English speakers, people with dyslexia, visual thinkers — could program using universal symbols that don't require language fluency.
- **Mobile development:** Typing code on a phone is painful. Tapping symbols on a touchscreen is natural. This could make mobile-first coding viable.
- **AI collaboration:** The symbols become a shared vocabulary between human and AI. The developer thinks in symbols, the AI thinks in symbols, and there's less room for misinterpretation than with natural language.

### 10.5 Development Timeline (Post v1.0)

| Phase | Goal |
|-------|------|
| Research | Design the symbol set. Test with developers for recognition speed and memorability. Study stenography chord theory. |
| Virtual keyboard MVP | Build an on-screen symbol keyboard into the Lume web playground. Tap symbols to generate Lume code. |
| Physical keyboard prototype | Partner with a hardware manufacturer or use a programmable keyboard (like a Stream Deck or custom mechanical keyboard) to map symbols to keys. |
| Voice-to-symbol | Integrate speech recognition that converts spoken intent into symbol sequences, then into Lume code. |
| Chord system | Develop multi-key chord combinations for compound operations, trained for muscle memory like stenography. |

*This is a Lume v2.0+ feature. Build the language first (Milestones 1-5), prove it works, build the community, then introduce pictographic mode as the next evolution.*

### 10.6 Agent-to-Agent Communication

Current AI systems are isolated. An agent in one app can't send instructions to an agent in another app in a way both understand. Lume solves this by becoming the shared language between AI systems — not just a language humans write, but a protocol agents use to communicate with each other.

**How it works:**

```
// Agent A (in StrikeAgent) writes and sends a Lume script
let task = compose:
    let market = fetch price of "AAPL"
    if market.change is greater than 5:
        ask "Summarize why AAPL moved today"

send task to agent "tradeworks" at "tradeworksai.io"
```

```
// Agent B (in TradeWorks AI) receives and executes it
receive task from agent "strikeagent":
    verify signature
    execute in sandbox
    return result to sender
```

**New keywords for agent communication:**
- `compose` — Build a Lume script as a data structure (not executed immediately)
- `send ... to agent` — Transmit a composed script to another agent
- `receive ... from agent` — Listen for incoming scripts from other agents
- `verify signature` — Check cryptographic signature before execution (see Section 10.7)
- `execute in sandbox` — Run received code in an isolated environment with limited permissions

**Why this matters:** In the Trust Layer ecosystem with 34+ apps, agents could collaborate across applications using Lume as their shared protocol. A user could say "have StrikeAgent analyze the market and tell TradeWorks to adjust my portfolio" — and the agents handle it by exchanging Lume scripts. The language becomes the connective tissue of the entire ecosystem.

### 10.7 Trust & Code Verification

Every `.lume` file can carry a cryptographic signature proving who wrote it and that it hasn't been modified. This is essential for agent-to-agent communication (Section 10.6) and for building trust in shared code.

**Built-in signing:**
```
// Sign a file when building
$ lume build --sign app.lume

// Verify a file before running it
$ lume verify app.lume
Signed by: agent@strikeagent.io
Signed at: 2026-08-23T14:30:00Z
Integrity: VALID — no modifications since signing
```

**In-language verification:**
```
let script = receive from agent "external"

when verify script is:
    trusted(code)   -> execute code
    untrusted(reason) -> log "Rejected: {reason}"
    tampered        -> alert "Code was modified after signing"
```

**Trust levels:**
| Level | Description | Allowed Actions |
|-------|-------------|-----------------|
| `owner` | Code written by the current system | Full access, no restrictions |
| `trusted` | Code from a verified agent in the ecosystem | Execute in standard environment |
| `verified` | Code with valid signature from unknown source | Execute in sandbox only |
| `untrusted` | No signature or invalid signature | Reject by default, log attempt |

**Integration with Trust Layer:** The signing system uses the same blockchain address scheme as the Trust Layer ecosystem (`0x` + SHA256 hash). An agent's code signature is tied to its Trust Layer identity, creating a chain of trust from the code back to the ecosystem.

### 10.8 Memory & Context Persistence

Current AI calls are stateless — every `ask` starts from zero. Lume introduces a `remember` keyword that gives AI calls persistent memory within a session, across sessions, or permanently.

**Session memory (default):**
```
// The AI remembers previous exchanges within this program run
let intro = ask "My name is Ada and I'm building a weather app"
let followup = ask "What framework would you recommend for what I just described?"
// The AI knows about Ada and the weather app from the previous call
```

**Persistent memory:**
```
// Remember across program runs — stored locally
remember "user_preferences":
    let style = ask "I prefer dark themes and minimal UI"
    // Next time this program runs, the AI already knows this

// Recall stored memory
recall "user_preferences"
let suggestion = ask "Design a settings page for me"
// The AI uses the stored preference for dark themes and minimal UI
```

**Scoped memory for agents:**
```
// Agent memory — persists across interactions with a specific user
remember agent "support_bot" for user.id:
    let history = ask "The user asked about billing last time. Follow up."

// Shared memory — multiple agents can read/write
remember shared "project_alpha":
    let status = ask "Update: we finished the API. What's next?"
// Any agent with access to "project_alpha" memory can read this context
```

**New keywords:**
- `remember "label"` — Open a memory block that persists
- `recall "label"` — Load previously stored memory into the current AI context
- `forget "label"` — Delete stored memory
- `remember shared "label"` — Memory accessible by multiple agents/programs
- `remember agent "name" for user` — Agent-specific memory scoped to a user

**Transpilation:** Memory is stored via `runtime.js` using configurable backends — local file storage for development, database for production, or a dedicated memory service. The runtime injects stored context into the system prompt of subsequent AI calls automatically.

### 10.9 Self-Modifying Programs

What if a Lume program could improve itself? An AI agent could analyze its own code, identify inefficiencies, and rewrite parts of itself — all within safety bounds defined by the language.

**Controlled self-modification:**
```
// A program that optimizes its own greeting function
to greet(name: text) -> text:
    return "Hello, {name}!"

// Ask AI to improve the function
let improved = mutate greet with:
    ask "Make this greeting more personalized based on time of day"

// The mutate block:
// 1. Reads the source of greet()
// 2. Sends it to the AI with the instruction
// 3. Replaces the function with the AI's improved version
// 4. Validates the new version has the same signature (takes text, returns text)
// 5. Runs intent block tests if they exist — rolls back if they fail
```

**Safety guardrails:**
- `mutate` can only modify functions, not variables or control flow
- The modified function must maintain the same type signature (same inputs, same output type)
- If the function has an `intent` block, all intent tests must pass after modification or the change is rolled back automatically
- A `mutate log` is maintained showing every modification, what changed, and why
- `mutate` blocks run in a sandbox — the modified code is tested before it replaces the original
- Maximum mutation depth can be set: `define MAX_MUTATIONS = 3` prevents infinite self-modification loops

**New keywords:**
- `mutate functionName with:` — Begin a controlled modification block
- `rollback` — Manually undo the last mutation
- `mutate log` — Access the history of all modifications

**Why this matters:** This is where Lume moves beyond being a language into being a living system. Programs don't just run — they evolve. An AI agent written in Lume could start simple and gradually improve itself through use, learning from its own execution patterns.

### 10.10 Intent Context Markers

Beyond documentation, Lume code can carry purpose markers that the runtime uses to adjust behavior automatically.

**Marking code with purpose:**
```
// Critical code gets automatic retry and alerting
@critical
to process_payment(amount: number, user: User) -> result of Receipt:
    let charge = fetch post to "https://api.stripe.com/charge" with { amount, user }
    return charge
// Runtime automatically: retries 3x on failure, logs every attempt, alerts on final failure

// Experimental code runs in a sandbox with extra logging
@experimental
to new_recommendation_engine(user: User) -> list of text:
    let suggestions = ask "Recommend 5 products for a user who likes: {user.interests}"
    return suggestions
// Runtime automatically: wraps in try/catch, logs performance metrics, flags in monitoring

// Temporary code warns when it's been in production too long
@temporary until "2026-12-01"
to holiday_discount(price: number) -> number:
    return price * 0.80
// Runtime automatically: logs a warning after Dec 1 2026 that this code should be removed

// Deprecated code warns callers
@deprecated "Use new_greet() instead"
to old_greet(name: text) -> text:
    return "Hi " + name
// Compiler shows warning when any code calls old_greet()
```

**Built-in markers:**
| Marker | Runtime Behavior |
|--------|-----------------|
| `@critical` | Auto-retry (3x), detailed logging, failure alerts |
| `@experimental` | Sandbox execution, performance metrics, extra error capture |
| `@temporary until "date"` | Warning after date passes, reminder to remove |
| `@deprecated "message"` | Compiler warning when called, migration hint shown |
| `@slow` | Performance monitoring, timeout warnings |
| `@cached duration` | Result cached for specified duration, skips re-execution |
| `@authenticated` | Requires valid user context to execute |
| `@rate_limited count per duration` | Throttles execution automatically |

### 10.11 Natural Language Fallback

When the Lume compiler encounters code it cannot parse, instead of just showing an error, it asks an AI model: "What did they mean?" — then suggests the correct Lume syntax.

**How it works:**
```
// Developer types something the compiler doesn't understand
grab the weather for dallas texas

// Instead of just "Syntax Error", the compiler responds:
//
// I don't recognize this syntax, but I think you mean:
//
//   let weather = fetch weather from "https://api.weather.com?city=Dallas,TX"
//   show weather
//
// Would you like me to use this instead? [Y/n]
```

**Implementation:**
1. The parser attempts to parse the input normally
2. If parsing fails, the raw text is sent to the configured AI model with the prompt: "The user wrote this in Lume (an AI-native programming language). Convert it to valid Lume syntax."
3. The AI's suggestion is validated by running it through the parser again
4. If the suggestion parses successfully, it's shown to the developer with a prompt to accept or reject
5. Accepted suggestions are logged to a learning file that helps improve future suggestions

**In the REPL:**
```
> get me the top 5 headlines from reuters

  I think you mean:
  let headlines = fetch headlines from "reuters"
  show headlines

  Accept? [Y/n] y

Reuters Top Headlines:
1. ...
2. ...
```

**In file compilation:**
```
$ lume run app.lume

  Error in app.lume at line 3:
  3 |   grab users from the database

  I don't recognize 'grab'. Did you mean:
  let users = fetch data from "database://users"

  To auto-fix, run: lume fix app.lume
```

**The `lume fix` command:** Scans an entire file for syntax errors, generates AI-powered suggestions for each one, and applies fixes with developer confirmation. Like a spell-checker for code.

**Privacy note:** Natural language fallback requires an AI provider configured in `lume.config`. In offline mode or if no provider is configured, standard error messages are shown instead (Section 4.11). No code is sent externally without the developer's configured consent.

*Sections 10.6 through 10.11 are v2.0+ features. They should be preserved in the spec for future development but are not part of the Milestone 1-5 build roadmap.*

---

## 11. CHANGELOG

**Version: 0.5 — Complete Draft with Future Vision | March 2026**

| Date | Version | Change |
|------|---------|--------|
| March 2026 | 0.1 | Initial design document. Core philosophy, pain points, syntax design, and 5-milestone build roadmap established. Language named Lume. |
| March 2026 | 0.2 | Enhanced spec. Added: complete keyword list, complete operator list, indentation rules, full type system (primitives, collections, custom types, maybe/result), AI keyword definitions (ask vs think vs generate with temperature mapping), provider configuration (lume.config), standard library module list, concurrency detection rules, AST node type table, string interpolation syntax, comment syntax (single/multi/doc), natural-to-traditional operator mapping. Updated roadmap timeline and milestones. |
| March 2026 | 0.3 | Complete draft. Added: scoping rules (block scoping, shadowing, set for outer mutation), full loop syntax (for each, for each with index, range-based for, range with step, while, break/continue, infinite loops), module system details (named imports, local modules, re-exports, circular import detection, resolution order), error messages and diagnostics (error format, error codes, source context, "did you mean?" suggestions via Levenshtein distance, unhandled Result warnings), REPL mode (interactive playground with colon-commands, multi-line input, live AI calls, session persistence, tab completion). Added keywords: set, then, by, all. |
| March 2026 | 0.4 | Future vision added. Section 10: Pictographic Mode & Dev Keyboard — pictographic symbol input system inspired by Paleo-Hebrew/hieroglyphic writing and courtroom stenography. Symbol-to-Lume compilation pipeline. Custom developer keyboard concept (physical 30-40 key device, virtual on-screen keyboard, voice-to-symbol hybrid). Symbol vocabulary mapping 12 core operations. Accessibility, speed, and mobile development advantages documented. Phased development timeline for post-v1.0 implementation. |
| March 2026 | 0.5 | Advanced features added to future vision. Agent-to-agent communication (compose, send, receive keywords — agents exchange Lume scripts as a shared protocol across ecosystem apps). Trust and code verification (cryptographic signing, trust levels, blockchain identity integration). Memory and context persistence (remember, recall, forget keywords — session, persistent, and shared agent memory). Self-modifying programs (mutate keyword with safety guardrails, type signature enforcement, intent block validation, rollback). Intent context markers (@critical, @experimental, @temporary, @deprecated, @cached, @rate_limited — runtime adjusts behavior based on code purpose). Natural language fallback (AI-powered error recovery, "did you mean?" code suggestions, lume fix command as spell-checker for code). |

---

*Lume — The AI-Native Programming Language*
*Built to make AI-powered software as natural as writing a sentence.*
