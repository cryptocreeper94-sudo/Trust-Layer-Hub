# LUME — The AI-Native Programming Language
### Language Design Specification & Build Roadmap
**Version 0.2 — Enhanced Draft | March 2026**

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

### 3.8 String Interpolation
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

### 3.9 Comments
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
`let`, `define`, `to`, `return`, `if`, `else`, `when`, `is`, `and`, `or`, `not`, `for`, `each`, `in`, `while`, `break`, `continue`, `show`, `log`

**AI:**
`ask`, `think`, `generate`, `as`

**Modules:**
`use`, `export`, `from`

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
| `ForEachStatement` | Iteration | `for each item in list:` |
| `WhileStatement` | While loop | `while active:` |
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
| `AssignmentExpression` | Reassignment | `set score to 100`, `x += 1` |
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
- Arithmetic, string operations, comparisons (both natural and traditional)
- if/when/else conditions with natural syntax AND traditional syntax
- Functions (`to` keyword), return values, short form
- Custom types (`type` keyword, struct-like)
- Lists and iteration (`for each`)
- Maps and property access
- Error handling (Result type, `when is` pattern, `or fail with` short form)
- String interpolation in transpiled output
- Multi-line strings (triple quotes)
- Comments (single-line, multi-line, doc comments)
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
- `use` keyword imports npm/JS modules
- Lume modules export to JS correctly
- HTTP fetch syntax compiles to valid async JS
- Concurrency detection and parallel execution (Promise.all for independent calls)
- `then` keyword for forced sequential execution
- TypeScript type definition export on build
- `maybe` type maps to nullable in TS output
DONE WHEN: Lume can call lodash, axios, and a custom JS module. JS can import a Lume module.

### Milestone 5 — Tooling & IDE (Week 13-16)
Goal: Developer experience that makes Lume a joy to use.
- Monaco syntax highlighting for Lume (all keywords, operators, string interpolation)
- Inline error display in editor
- Autocomplete for keywords and stdlib functions
- `lume test` command runs intent blocks automatically
- `lume init` command scaffolds a new project
- Browser playground integrated into Monaco IDE
- 5 real example apps documented and runnable
- Standard library fully implemented (strings, math, time, json, files, http, crypto, env)
DONE WHEN: A developer who has never seen Lume can open the playground, write a program, and run it within 5 minutes with no instructions.

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

## 10. CHANGELOG

| Date | Version | Change |
|------|---------|--------|
| March 2026 | 0.1 | Initial design document. Core philosophy, pain points, syntax design, and 5-milestone build roadmap established. Language named Lume. |
| March 2026 | 0.2 | Enhanced spec. Added: complete keyword list, complete operator list, indentation rules, full type system (primitives, collections, custom types, maybe/result), AI keyword definitions (ask vs think vs generate with temperature mapping), provider configuration (lume.config), standard library module list, concurrency detection rules, AST node type table, string interpolation syntax, comment syntax (single/multi/doc), natural-to-traditional operator mapping. Updated roadmap timeline and milestones. |

---

*Lume — The AI-Native Programming Language*
*Built to make AI-powered software as natural as writing a sentence.*
