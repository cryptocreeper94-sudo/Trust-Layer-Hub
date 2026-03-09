# LUME — The AI-Native Programming Language
## Complete Master Specification
**Version 1.0 — Compiled Master Document | March 2026**
**From:** Jason (Trust Layer / DarkWave Ecosystem)
**For:** Lume Agent (lume-lang.com / lume-lang.org)

---

## INTRODUCTION

This is the definitive master specification for Lume, compiled from 8 source documents totaling 7,074 lines and 305 acceptance criteria. It represents the complete language design, compiler architecture, milestone roadmap, gap resolutions, voice-to-code pipeline, and academic positioning for what is intended to be the first programming language where voice-to-code is architecturally natural, not bolted on.

### What Lume Is

Lume is a programming language built for the AI era. It compiles to JavaScript and runs everywhere JavaScript runs. What makes it different from every other language is a single architectural decision: the compiler is designed from the ground up to accept imprecise, informal, and ambiguous input — including plain English and spoken voice — and resolve it into working code.

This means:
- **Voice-to-code** is a compiler feature, not an IDE plugin
- **Security scanning** happens during compilation at the AST level, not after
- **Cognitive distance** — the gap between what a developer thinks and what they must type — approaches zero

### The Pipeline

The complete Lume compilation pipeline, from voice input to certified JavaScript:

```
Voice Input -> Speech-to-Text Engine -> Transcription Cleanup -> Text Input -> Auto-Correct -> Intent Resolver (Tolerance Chain) -> Live Security Check (each AST node) -> AST -> Transpiler -> Certified JavaScript + Security Certificate
```

For typed input, the pipeline starts at "Text Input." For standard Lume syntax (non-English mode), the pipeline is the original: `Lume Source -> Lexer -> Parser -> AST -> Transpiler -> JavaScript`.

### Source Documents Compiled

| # | Document | Lines | Criteria | Scope |
|---|----------|-------|----------|-------|
| 1 | LUME-LANGUAGE-SPEC.md | 1,411 | — | Core language design, syntax, type system, stdlib, future vision (M1-5) |
| 2 | LUME-MILESTONE-6-SELF-SUSTAINING.md | 511 | — | Self-monitoring, self-healing, self-optimizing, self-evolving runtime |
| 3 | LUME-MILESTONES-7-13-HANDOFF.md | 2,026 | 125 | English Mode, multilingual, voice, visual context, reverse mode, collaborative intent, zero-dependency runtime |
| 4 | LUME-ACADEMY-KNOWLEDGE-BASE.md | 376 | — | Educational reference for non-technical stakeholders |
| 5 | LUME-VOICE-TO-CODE-HANDOFF.md | 278 | 20 | Voice input pipeline, transcription cleanup, CLI, playground integration |
| 6 | LUME-GAP-RESOLUTION-HANDOFF.md | 751 | 73 | Gaps 1-7: ambiguity ceiling, complex logic, cross-file modules, canonicalization, hints, English errors, linter |
| 7 | LUME-GAP-RESOLUTION-PART-2-HANDOFF.md | 1,147 | 87 | Gaps 8-15: pattern versioning, npm integration, data structures, try/catch/retry, testing, environment config, async patterns, comments |
| 8 | LUME-ACADEMIC-PAPER-BRIEF.md | 574 | — | Academic paper brief: cognitive distance, security architecture, theoretical contributions |
| **Total** | | **7,074** | **305** | |

### Milestone Summary

| Milestone | Name | Status | Description |
|-----------|------|--------|-------------|
| 1 | Core Language & Compiler | COMPLETE | Lexer, parser, transpiler. Zero dependencies. |
| 2 | Full Core Language | COMPLETE | Variables, loops, functions, error handling, types, scoping. |
| 3 | AI Integration | COMPLETE | `ask`, `think`, `generate` as first-class keywords. |
| 4 | JavaScript Interop & CLI | COMPLETE | `use`/`expose`, `lume build`/`run`/`repl` CLI. |
| 5 | IDE Tooling & DX | COMPLETE | REPL, syntax highlighting, diagnostics, `lume test`, `lume init`. |
| 6 | Self-Sustaining Runtime | COMPLETE | Monitor, heal, optimize, evolve — four autonomous layers. |
| 7 | English Mode | SPEC COMPLETE | Plain English as source code via Intent Resolver. |
| 8 | Multilingual Mode | SPEC COMPLETE | Any human language as input; auto-detection; same AST output. |
| 9 | Voice-to-Code | SPEC COMPLETE | Spoken language as compiler input via transcription pipeline. |
| 10 | Visual Context Awareness | SPEC COMPLETE | UI element registry, spatial/style resolution, full-stack app generation. |
| 11 | Reverse Mode | SPEC COMPLETE | Code-to-language: explain existing code in any human language. |
| 12 | Collaborative Intent | SPEC COMPLETE | Multi-developer, multi-language; AST-level diffing. |
| 13 | Zero-Dependency Runtime | SPEC COMPLETE | Standalone executables via Bun compile; cross-compilation. |

### Gap Resolutions Summary

| Gap | Problem | Solution |
|-----|---------|----------|
| 1 | All tolerance layers fail | Interactive Clarification Mode |
| 2 | Compound boolean logic | Natural language logic blocks |
| 3 | Cross-file references | Implicit module resolution with `using:` |
| 4 | Inconsistent English | Canonical form + `lume canonicalize` formatter |
| 5 | No performance control | Hint annotations ("using X", "cache for N minutes") |
| 6 | JS errors, not English errors | Enhanced source maps + English error messages |
| 7 | No linter for English | `lume lint` with 10 built-in rules |
| 8 | Pattern library evolution | Versioned patterns + `lume upgrade` migration |
| 9 | npm package usage | Package awareness + auto-install |
| 10 | Complex data structures | English structure definitions |
| 11 | No error handling | Try/catch/retry in English |
| 12 | No test framework | Natural language test assertions |
| 13 | Environment differences | Conditional compilation by environment |
| 14 | Complex async patterns | Parallel/sequential/race in English |
| 15 | Comments vs instructions | Comment markers + documentation generation |

### Key Metrics

| Metric | Value |
|--------|-------|
| Compiler milestones | 13 |
| Test suite | 552 tests |
| Acceptance criteria | 305 total |
| Pattern Library patterns | 102 (Layer A) |
| Supported languages | 10 (Milestone 8) |
| Homophone pairs | 10 |
| Filler words stripped | 20 |
| Action verbs (splitter) | 40 |
| Security threat categories | 11 (input) + 8 (AST-level) |
| Security layers | 3 (input, live, sandbox) |

---

# PART I: CORE LANGUAGE (MILESTONES 1-5)

---

## 1. VISION & PHILOSOPHY

Lume is a programming language built for the AI era. While existing languages treat AI as an external library you bolt on, Lume treats AI as a first-class primitive — as natural as a variable, a loop, or a function call.

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
let name = "Ada"
let age = 28
let active = true
let score: number = 0
let tags: list of text = ["ai", "code", "lume"]
define MAX_RETRIES = 3
```

### 3.2 Conditions — Human-Readable
```
if user is verified and user.age is at least 18:
    allow access

if score is greater than 100:
    set score to 100

if (user.verified && user.age >= 18):
    allow access
```

### 3.3 Functions
```
to greet(name: text) -> text:
    return "Hello, " + name

let message = greet("Ada")

to double(n: number) -> n * 2
```

### 3.4 AI Calls — First Class
```
let summary = ask "Summarize this in 3 bullets: " + article
let review = ask claude.sonnet "Review this code for bugs:" + code
let sentiment: { score: number, label: text } =
    ask gpt.4o "Analyze sentiment:" + review as json
let draft = ask "Write a blog post about:" + topic
let improved = ask "Improve the tone to be friendlier:" + draft
let final = ask "Add a compelling title to:" + improved
let plan = think "Break this problem into 5 steps:" + problem
let story = generate "A short sci-fi story about:" + premise
```

### 3.5 Error Handling
```
let result = fetch data from "https://api.example.com/users"

when result is:
    ok(data)  -> show data.users
    error(e)  -> log "Failed: " + e.message

let data = fetch "https://api.example.com" or fail with "Could not connect"
```

### 3.6 Concurrency — Invisible by Default
```
let weather = fetch weather for "New York"
let news    = fetch headlines from "reuters"
let stocks  = fetch price of "AAPL"
show weather, news, stocks

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
for each color in colors:
    show color

for each item, index in colors:
    show "{index}: {item}"

for i in 0 to 10:
    show i

for i in 0 to 100 by 5:
    show i

while count is less than 10:
    show count
    set count to count + 1

while true:
    let input = read line
    if input is "quit":
        break
    show "You said: {input}"
```

### 3.9 String Interpolation
```
let greeting = "Hello, {name}! Welcome to Lume."
let message = "Total: ${price * 1.08} after tax"
let html = """
    <div>
        <h1>{title}</h1>
        <p>{description}</p>
    </div>
"""
```

### 3.10 Comments
```
// Single-line comment
/* Multi-line comment */
/// Documentation comment — attached to the next declaration
```

---

## 4. LANGUAGE RULES — DEFINITIVE DECISIONS

### 4.1 Complete Keyword List

**Core:** `let`, `define`, `set`, `to`, `return`, `if`, `else`, `when`, `is`, `and`, `or`, `not`, `for`, `each`, `in`, `while`, `break`, `continue`, `show`, `log`, `then`, `by`

**AI:** `ask`, `think`, `generate`, `as`

**Modules:** `use`, `export`, `from`, `all`

**Types:** `text`, `number`, `boolean`, `list`, `map`, `of`, `any`, `nothing`, `maybe`

**Error Handling:** `ok`, `error`, `fail`, `with`, `or`, `try`

**Testing:** `test`, `expect`, `to`, `equal`, `intent`, `given`, `expects`

**Literals:** `true`, `false`, `null`

**Pattern Matching:** `default`

### 4.2 Complete Operator List

**Arithmetic:** `+`, `-`, `*`, `/`, `%`
**Comparison:** `==`, `!=`, `>`, `<`, `>=`, `<=`
**Assignment:** `=`, `+=`, `-=`, `*=`, `/=`
**Logical:** `&&`, `||`, `!` (traditional) — or keywords `and`, `or`, `not` (natural)
**Access:** `.` (dot), `[]` (index)
**Type:** `->` (return type), `:` (type annotation)
**Spread:** `...` (spread/rest)

**Natural language operators:**
- `is` -> `==`
- `is not` -> `!=`
- `is greater than` -> `>`
- `is less than` -> `<`
- `is at least` -> `>=`
- `is at most` -> `<=`

### 4.3 Indentation Rules

- Spaces only. No tabs. 4 spaces per indentation level.
- Indentation defines blocks (like Python). A colon (`:`) at the end of a line opens a new block.
- Curly braces `{ }` are also valid as an alternative block syntax.
- Both styles supported, but they cannot be mixed within the same block.

### 4.4 Type System

**Primitive types:** `text`, `number`, `boolean`, `null`

**Collection types:** `list of T`, `map of T`

**Special types:** `any`, `nothing`, `maybe T`, `result of T`

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

| Keyword | Purpose | Temperature | Maps To |
|---------|---------|-------------|---------|
| `ask` | Direct question/instruction | 0.7 (balanced) | `messages: [{ role: "user", content: prompt }]` |
| `think` | Internal reasoning, system-prompt style | 0.3 (precise) | `messages: [{ role: "system", content: "Reason step by step." }, { role: "user", content: prompt }]` |
| `generate` | Creative/generative output | 1.0 (creative) | `messages: [{ role: "user", content: prompt }]` with `temperature: 1.0` |

All three return `result of text` by default. With `as json` and a type annotation, they return `result of { ... }`. On failure, they return an `error` result that must be handled.

### 4.6 AI Provider Configuration

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

### 4.7 Standard Library (stdlib)

**Built-in (always available, no import):** `show`, `log`, `fetch`, `ask`/`think`/`generate`, `type`/`of`

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

1. Independent consecutive `let` assignments with non-referencing right-hand sides -> parallel (`Promise.all`)
2. Dependent statements (references previous `let`) -> sequential
3. `then` keyword forces sequential
4. All `ask`/`think`/`generate` calls are async; independent ones run in parallel

### 4.9 Scoping Rules

- Block scoping. Variables visible within declaring block and nested blocks.
- `let` = block-scoped. `define` = block-scoped constant.
- Inner blocks can read outer variables, cannot reassign without `set`.
- Shadowing allowed with explicit `let` redeclaration.
- Function parameters scoped to function body.
- Top-level declarations are module-scoped.

### 4.10 Module System

```
use "lodash" as _
use { sortBy, groupBy } from "lodash"
use "./helpers" as helpers
use { validate, format } from "./helpers"
export to add(a: number, b: number) -> a + b
export let version = "1.0"
export all from "./utils"
```

**Resolution order:** stdlib -> local files (`.`/`..`) -> npm packages

**Circular imports:** Not allowed. Detected at parse time with clear error.

### 4.11 Error Messages & Diagnostics

```
Error [E001] in hello.lume at line 5, column 12:

  5 |   let result = aask "What is 2+2?"
                     ^^^^

  Unknown keyword 'aask'. Did you mean 'ask'?
```

Every error includes: error code, file name, line/column, source context with caret, plain-English explanation, and suggestion when possible.

| Code Range | Category |
|------------|----------|
| E001-E099 | Syntax errors |
| E100-E199 | Type errors |
| E200-E299 | Name errors |
| E300-E399 | Import errors |
| E400-E499 | AI errors |
| E500-E599 | Runtime errors |

### 4.12 REPL Mode

```
$ lume
Lume v1.0 — Interactive Mode
Type 'help' for commands, 'exit' to quit.

> let name = "Ada"
> show "Hello, {name}"
Hello, Ada
```

Commands: `:help`, `:exit`, `:clear`, `:vars`, `:type expr`, `:time expr`, `:save`, `:load`, `:model`, `:history`

---

## 5. FUTURE VISION (POST v1.0)

### 5.1 Pictographic Mode & Dev Keyboard

A future input mode where single symbols represent entire programming concepts, paired with a custom developer keyboard for symbol-based coding. Inspired by pictographic writing and stenography keyboards. Symbols produce standard Lume text, flowing through the existing compiler pipeline.

### 5.2 Agent-to-Agent Communication

New keywords: `compose`, `send ... to agent`, `receive ... from agent`, `verify signature`, `execute in sandbox`. Agents exchange Lume scripts as a shared protocol across ecosystem apps.

### 5.3 Trust & Code Verification

Cryptographic signing of `.lume` files. Trust levels: `owner`, `trusted`, `verified`, `untrusted`. Integration with Trust Layer blockchain identity.

### 5.4 Memory & Context Persistence

Keywords: `remember`, `recall`, `forget`, `remember shared`, `remember agent`. Session, persistent, and shared agent memory for AI calls.

### 5.5 Self-Modifying Programs

`mutate functionName with:` — controlled self-modification with safety guardrails (type signature preservation, intent block validation, rollback, mutation depth limits).

### 5.6 Intent Context Markers

`@critical`, `@experimental`, `@temporary until "date"`, `@deprecated "message"`, `@slow`, `@cached duration`, `@authenticated`, `@rate_limited count per duration`

### 5.7 Natural Language Fallback

When the compiler can't parse input, it asks an AI model "What did they mean?" and suggests correct Lume syntax. `lume fix` command as spell-checker for code.

### 5.8 3D & Visual Computing

Future `use "3d"` stdlib module wrapping Three.js for scene creation, AI-powered 3D generation, and animation. Integration path with TrustGen ecosystem app.

---

# PART II: SELF-SUSTAINING RUNTIME (MILESTONE 6)

---

## 6. SELF-SUSTAINING RUNTIME — ARCHITECTURE

Milestone 6 makes Lume programs autonomous. Four layers, each building on the one below:

```
Layer 4: SELF-EVOLVING      — Anticipates problems, adapts to changes
Layer 3: SELF-OPTIMIZING     — Uses AI to improve code and performance
Layer 2: SELF-HEALING        — Detects failures and recovers automatically
Layer 1: SELF-MONITORING     — Watches everything, collects data
         ─────────────────
         LUME RUNTIME (runtime.js)
         ─────────────────
         YOUR LUME PROGRAM
```

Each layer is a module in the runtime that can be enabled independently. Layer 1 is always on by default. Layers 2-4 are opt-in.

### 6.1 Layer 1: Self-Monitoring

Every function automatically tracked: `execution_time`, `call_count`, `error_rate`, `memory_usage`, `ai_call_latency`, `ai_call_cost`, `fetch_success_rate`, `cache_hit_rate`.

```
monitor:
    interval: 5 seconds
    retention: 24 hours
    alert_on:
        error_rate > 0.05
        avg_time > 2000
        memory > 500mb
    dashboard: true
    port: 9090
```

### 6.2 Layer 2: Self-Healing

Recovery strategies: retry with exponential backoff, switch to backup endpoints, reconnect databases, AI model fallback chains, circuit breaker pattern.

```
@healable
to fetch_user_data(id: number) -> result of User:
    heal:
        retries: 5
        fallback: cached_user(id)
        on_fail: alert "User data unavailable for {id}"
    let user = fetch data from "https://api.example.com/users/{id}"
    return user
```

Circuit breaker states: CLOSED (normal) -> OPEN (service down, fallback) -> HALF-OPEN (testing recovery).

### 6.3 Layer 3: Self-Optimizing

Triggers: slow function, repeated inputs, high error rate, unused code, expensive AI calls, redundant fetches.

```
optimize:
    enabled: true
    mode: suggest
    ai_model: claude.sonnet
    budget: 1000 tokens per optimization
    constraints:
        max_mutations_per_day: 10
        require_test_pass: true
        require_intent_pass: true
        log_all_changes: true
```

Safety: type signatures preserved, intent tests must pass, all mutations logged with rollback, `max_mutations_per_day` prevents loops.

### 6.4 Layer 4: Self-Evolving

Capabilities: predictive scaling, dependency monitoring, model evolution, schema adaptation, cost optimization, pattern learning.

```
evolve:
    enabled: true
    daemon: true
    check_interval: 1 hour
    capabilities:
        dependency_updates: true
        model_benchmarking: true
        schema_adaptation: true
        cost_optimization: true
        pattern_learning: suggest
```

Human approval required for: dependency major versions, model switches, schema changes. Auto-approve: patches, cache adjustments, cost optimizations under 5%.

### 6.5 CLI Commands (Milestone 6)

| Command | Description |
|---------|-------------|
| `lume monitor` | Real-time monitoring dashboard in terminal |
| `lume monitor --web` | Web-based monitoring dashboard |
| `lume heal status` | Current healing status and circuit breaker states |
| `lume heal log` | Healing event history |
| `lume optimize suggest` | Run optimization analysis |
| `lume optimize apply [id]` | Apply optimization |
| `lume optimize rollback [id]` | Roll back optimization |
| `lume evolve status` | Evolution daemon status |
| `lume evolve approve [id]` | Approve pending decision |
| `lume evolve reject [id]` | Reject pending decision |
| `lume evolve benchmark` | Trigger model benchmark |
| `lume evolve deps` | Check for dependency updates |

### 6.6 New Keywords and AST Nodes

**Keywords:** `monitor`, `heal`, `healable`, `optimize`, `evolve`, `rollback`, `suggest`, `auto`, `daemon`

**AST Nodes:** `MonitorBlock`, `HealBlock`, `OptimizeBlock`, `EvolveBlock`, `HealableDecorator`, `RollbackStatement`

### 6.7 Implementation Rules

1. Build layers in order: 1, 2, 3, 4. Each depends on the one below.
2. Layer 1 must have < 5% performance overhead.
3. Layer 2 must never make a problem worse.
4. Layer 3 must be conservative — suggest over auto-apply.
5. Layer 4 requires human approval for major changes.
6. All features optional — programs without these blocks work as before.
7. Mutation log is append-only, cannot be deleted by the program.

### 6.8 Acceptance Criteria (Milestone 6)

1. Layer 1: Automatic tracking of execution time, call count, error rate, memory for every function. Web dashboard displays real-time metrics.
2. Layer 2: `@healable` functions auto-retry, fallback to backup endpoints/models, implement circuit breaker. Program stays running when services fail.
3. Layer 3: Optimizer reads slow function source, sends to AI, receives improvement, tests in sandbox, verifies signatures and intent tests, suggests or applies. All mutations logged and rollbackable.
4. Layer 4: Evolution daemon checks dependencies, benchmarks models, detects schema changes, sends notifications. Major changes require human approval.
5. All layers integrate: monitor -> healer -> optimizer -> evolver.
6. Tests pass: unit tests for each layer, integration tests for full pipeline.

---

# PART III: ENGLISH MODE & NATURAL LANGUAGE EVOLUTION (MILESTONES 7-13)

---

## 7. MILESTONE 7: ENGLISH MODE

### 7.1 What It Is

A new compiler mode where the input is plain English sentences. The compiler understands intent from context and resolves it into the existing Lume AST, which then transpiles to JavaScript as normal.

### 7.2 Pipeline

```
CURRENT:   Lume Source -> Lexer -> Parser -> AST -> Transpiler -> JavaScript
NEW:       English Source -> Auto-Correct -> Intent Resolver -> Security/Conflict Check -> Lume AST -> Transpiler -> JavaScript + Source Map + Compile Lock
```

The Intent Resolver bypasses the Lexer and Parser entirely and feeds AST nodes straight to the Transpiler.

**Modification rules:**
- Do NOT modify the Lexer or Parser
- Do NOT modify how the Transpiler handles existing AST node types
- You CAN extend the Transpiler for new AST node types
- You CAN add pre-transpiler and post-transpiler stages

### 7.3 The Intent Resolver — Two Layers

**Layer A: Pattern Matching (fast, offline, no AI)**

A dictionary of common English phrases mapped to AST nodes. Deterministic. Start with 50-100 common patterns.

| English Input | Resolves To |
|---------------|-------------|
| `get the user's name` | Variable access: `user.name` |
| `show it on the page` | `ShowStatement` node |
| `when the button is clicked` | Event listener: `on click` |
| `save this to the database` | `store` operation |
| `ask the AI to summarize this` | `AskExpression` node |
| `repeat this 5 times` | `RepeatLoop` node, count: 5 |
| `create a new user with name and email` | Object creation with fields |
| `sort the list by date` | Array sort operation |
| `wait 3 seconds` | `delay(3000)` |

**Layer B: AI-Powered Resolution (for complex/ambiguous input)**

When no pattern matches, send to LLM with: the English sentence, current data model, current scope, target context, and list of valid AST node types. AI returns structured Lume AST nodes, not JavaScript.

### 7.4 File Format

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

`mode: english` tells the compiler to route through the Intent Resolver. Files without a mode declaration use standard Lume compilation (backward compatible).

### 7.5 Context Engine

`src/intent-resolver/context-engine.js`:
1. Scans project data models (schemas, types, tables)
2. Tracks declared variables and types within current file
3. Knows available UI elements (in UI context)
4. Knows available API endpoints (in server context)
5. Maintains short-term memory for pronoun/reference resolution

### 7.6 Auto-Correct Layer

`src/intent-resolver/auto-correct.js` — runs BEFORE the Tolerance Chain:

1. **Spell check with project-aware dictionary** — standard English + project variables/functions + programming terms
2. **Context-aware correction** — "safe the data" -> "save the data" (in database context)
3. **Transparent corrections** — all shown in compiler output, never silent
4. **Flags:** `--no-autocorrect` disables; `--strict` shows as warnings only
5. **Learning:** `.lume/autocorrect-dictionary.json` per project; `lume config alias` for custom abbreviations
6. **Voice cleanup:** phonetic corrections ("sequel" -> "SQL", "four"/"for" by context)

### 7.7 Tolerance Chain — 7-Step Fallback

```
Step 1: EXACT PATTERN MATCH (Layer A)
Step 2: FUZZY PATTERN MATCH (Levenshtein distance >= 85%)
Step 3: GRAMMAR-TOLERANT PATTERN MATCH (word-bag matching)
Step 4: AI RESOLUTION — HIGH CONFIDENCE (>= 80%, apply silently)
Step 5: AI RESOLUTION — LOW CONFIDENCE (50-79%, ask for confirmation)
Step 6: AI RESOLUTION — VERY LOW CONFIDENCE (<50%, show multiple options)
Step 7: UNRESOLVABLE (clear error, suggestions, never crash)
```

**Golden rule: NEVER SILENTLY GUESS.** If the system isn't confident, it asks.

**Fuzzy matching capabilities:**
1. Levenshtein distance — character-level edit distance
2. Word-bag matching — extract meaningful words, ignore order
3. Phonetic matching — Soundex or Metaphone
4. Common misspelling dictionary — 200+ programming terms
5. Contraction tolerance — "dont" = "don't"

**Learning:** User corrections saved to `.lume/learned-patterns.json`, resolve instantly next time.

### 7.8 Voice-Specific Error Handling (Prep for M9)

- Self-corrections: "no," "I mean," "actually" -> replace previous reference
- Filler words stripped: "um," "uh," "like," "you know," etc.
- Number words: "five" -> 5, "a hundred" -> 100, "a couple" -> 2
- Homophones resolved by context: "write"/"right", "for"/"four"

### 7.9 Milestone 7 Acceptance Criteria

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
- [ ] **Guardian Output Scanner:** Live scanning — each AST node security-checked at creation time during Intent Resolution, not after compilation
- [ ] **Guardian Output Scanner:** Dangerous instruction flagged immediately at the line it occurs, with interactive approve/skip/rephrase options
- [ ] **Guardian Output Scanner:** `raw:` blocks get separate JavaScript-level scan (only part of pipeline scanned post-compilation, because raw blocks skip AST)
- [ ] **Guardian Output Scanner:** Security certificate embedded in compiled JavaScript output — includes hash, scan level, timestamp, node count
- [ ] **Guardian Output Scanner:** `lume verify --hash <hash>` validates certificate and confirms code passed security pipeline
- [ ] **Guardian Output Scanner:** Certificate hash detects post-compilation tampering — modified JavaScript invalidates the certificate
- [ ] **Guardian Output Scanner:** Community patterns from Collective Intelligence registry scanned at download time — flagged patterns quarantined
- [ ] **Guardian Output Scanner:** Configurable scan levels in `.lume/security-config.json`: off, basic, standard (default), strict
- [ ] **Guardian Output Scanner:** CI/CD integration — build pipelines can check for certificate header and reject uncertified JavaScript
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

## 8. CRITICAL ARCHITECTURAL REQUIREMENTS (ALL MILESTONES 7-13)

### 8.1 Cross-Line Dependency Resolution

When line 5 depends on line 3 via pronoun, and line 3 changes, line 5 must re-resolve. Implemented as a reference graph in the Context Engine.

### 8.2 Intent Conflict Detection

| Conflict Type | Example | Response |
|--------------|---------|----------|
| Create + Delete same target | "create the user, then delete the user" | Warning |
| Read after Delete | "delete all users, then show the users" | Error |
| Duplicate operations | "save the data, save the data" | Warning |
| Type mismatch | "set the user's age to 'hello'" | Error |
| Unreachable code | "return the result, then show the total" | Warning |

### 8.3 Security Layer

**Dangerous operation categories:**

| Category | Action |
|----------|--------|
| File system destruction | BLOCK — require explicit confirmation |
| Credential exposure | BLOCK — refuse to compile |
| Network exfiltration | WARNING — show what data would be sent |
| Database destruction | CONFIRM — show what will be destroyed |
| Infinite operations | WARNING — add stop condition |
| System commands | BLOCK — blocked by default |
| Semantic camouflage | BLOCK — flag credential/sensitive data movement |
| Natural language injection | ENFORCE — strict separation of code and data |
| Privilege escalation | CONFIRM — flag permission changes |
| Mass operations | WARNING — show projected impact |
| Resource exhaustion | BLOCK — configurable limits |

**Sandboxing:** First-run sandbox mode. Re-activates on >20% change. `.lume/security-config.json` for project-level config.

### 8.4 Guardian Output Scanner — Live AST-Level Scanning

Each AST node security-checked at creation time during Intent Resolution. Not post-compilation.

```
Line 1: resolve to AST node -> SECURITY CHECK -> passed
Line 2: resolve to AST node -> SECURITY CHECK -> passed
Line 3: resolve to AST node -> SECURITY CHECK -> FLAGGED
```

Only `raw:` blocks get post-compilation JavaScript scan (because they skip AST).

**Security Certificate:**
```javascript
/**
 * LUME SECURITY CERTIFIED
 * Source: app.lume (mode: english, 47 lines)
 * AST nodes scanned: 47/47 passed
 * Raw blocks scanned: 2/2 passed
 * Scan level: standard
 * Input method: voice | text
 * Compiled: 2026-09-15T14:30:00Z
 * Certificate hash: a3f8b2c1e9d4...
 * Verify: lume verify --hash a3f8b2c1e9d4...
 */
```

Configurable scan levels in `.lume/security-config.json`: off, basic, standard (default), strict.

### 8.5 Deterministic Compilation — Compile Lock

`.lume/compile-lock.json` caches every resolution. On recompilation, locked resolutions used if input unchanged. `lume build --fresh` forces re-resolution. `lume build --check` verifies without writing output.

### 8.6 Escape Hatch

```
mode: english
get all active users from the database
raw:
  const filtered = users.filter(u => u.score > calculateThreshold(u.tier));
show the filtered results in a table
```

Inline: backtick-wrapped expressions passed through as raw JS.

### 8.7 Source Maps & Debugging

`.lume.map` file maps English lines to generated JavaScript lines. Errors show English source, not JS. `lume build --sourcemap` on by default in development.

### 8.8 Natural Language Testing

```
mode: english
test "calculate_total works correctly":
  given items are [{name: "book", price: 10}, {name: "pen", price: 5}]
  when I calculate the total of items
  then the result should be 15
```

Given-When-Then pattern. `lume test app.lume` runs tests with natural language results.

### 8.9 Performance Boundaries

- Layer A: < 1ms per line
- Layer B (batched): < 3 seconds for up to 50 lines
- 500-line file: < 10 seconds total
- Progress indicator if > 30 seconds
- Cost transparency after compilation

### 8.10 Sentence Boundary Detection

| Connector | Splits Into |
|-----------|-------------|
| "and" (between verbs) | 2 operations |
| "then" | 2 sequential operations |
| "also" | 2 parallel operations |
| Comma + verb | Multiple sequential operations |
| "and" (within noun) | 1 operation with multiple fields |

Part-of-speech analysis distinguishes verb-and from noun-and.

### 8.11 Negation Detection

Patterns: "don't," "never," "not," "skip," "except," "unless," "without," "hide," "prevent," "no." Double negation resolves correctly.

### 8.12 Temporal Expression Resolution

"today," "yesterday," "last week," "30 days ago," "next Friday," "in 2 hours," "every Monday" -> dynamic Date calculations (not static values). Use `date-fns` or Temporal API.

### 8.13 Complex Boolean Logic

"and" binds tighter than "or." "But not" = AND + NOT. "Unless" inverts entire condition. "Either...or" and "both...and" for grouping.

### 8.14 Async Auto-Detection

Network requests, DB queries, file I/O, timers, AI calls -> `await`. Math, variable assignment, UI updates -> synchronous. Parallel/sequential detection from phrases.

### 8.15 Pronoun Scope Rules

1. Function boundary = pronoun reset
2. >20 lines from referent = warning
3. Explicit names override pronouns
4. Multiple possible referents = ask
5. Loop scope: "it" = current iteration item

### 8.16 Cross-File References

English import: "bring in calculate_total from utils" -> `use "calculate_total" from "./utils"`
English export: "make this function available" -> `expose calculate_total`

### 8.17 Error Message Standards

```
[LUME-E001] Unresolvable input
  Line 7: "flurb the data into the schnozzle"
  Attempted: Pattern match (no match), Fuzzy match (no match), AI resolution (12%)
  Suggestion: Try rephrasing. Similar known operations: ...
```

Codes: `LUME-E###` (errors), `LUME-W###` (warnings), `LUME-I###` (informational).

### 8.18 Language Version Declaration

```
mode: english
lume-version: 7
```

Locks behavior to that version's pattern library, auto-correct dictionary, and resolution rules.

### 8.19 Collective Intelligence Layer

Opt-in anonymous pattern contribution to `lume-lang.com/patterns`. 100+ independent confirmations promotes to official library. Privacy-first: default OFF, all data anonymized, enterprise can fully disable.

### 8.20 Contextual AI Memory

`.lume/context-memory.json` persists: developer style profile, project domain knowledge, frequently used operations, past resolution history, error patterns. All local, nothing sent externally.

### 8.21 Semantic Understanding — Synonym Rings

| Operation | Synonyms |
|-----------|----------|
| get | fetch, retrieve, grab, pull, obtain, access, look up, find, query, "I need," "give me" |
| show | display, render, present, print, output, "put on screen" |
| save | store, persist, write, keep, preserve, "hang onto," "put in the database" |
| delete | remove, destroy, erase, clear, wipe, purge, "get rid of" |
| create | make, build, generate, construct, "spin up," set up |
| send | dispatch, fire, emit, transmit, broadcast, "fire off" |
| calculate | compute, process, evaluate, "crunch," tally, "add up," "figure out" |

---

## 9. MILESTONE 8: MULTILINGUAL MODE

### 9.1 What It Is

Extend the Intent Resolver to accept input in any human language. Auto-detect, resolve identically regardless of language, support mixed-language files.

### 9.2 Implementation

**Layer A:** Pattern library translated for top 10 languages (English, Mandarin, Spanish, Hindi, French, Portuguese, Arabic, Japanese, German, Korean). 50+ patterns each.

**Layer B:** Already multilingual (LLMs understand all major languages natively). No changes needed.

### 9.3 File Format

```
mode: natural

obtener todos los usuarios registrados este mes
mostrar sus nombres en una lista

when the delete button is clicked:
  supprimer l'utilisateur selectionne
```

`mode: natural` enables multilingual. `mode: english` restricts to English only. Error messages returned in the detected language.

### 9.4 Acceptance Criteria

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

## 10. MILESTONE 9: VOICE-TO-CODE

### 10.1 What It Is

Spoken language as compiler input. Developer speaks, speech is transcribed, transcription is fed into the Intent Resolver.

### 10.2 Pipeline Extension

```
Voice Input -> Speech-to-Text (Whisper / browser API) -> Transcription Cleanup -> Text Input -> [existing pipeline]
```

Voice adds two steps. Everything after "Text Input" is identical. No changes to Intent Resolver, Tolerance Chain, Security Layer, Transpiler, or Guardian Output Scanner.

### 10.3 Transcription Cleanup Layer

7-step pipeline normalizing speech-to-text artifacts:

1. **Stutter/Repeat Collapse** — "get get the name" -> "get the name"
2. **Spoken Punctuation Conversion** — "period" -> `.`, "new line" -> line break
3. **Filler Word Stripping** — 20 fillers removed
4. **Context-Aware Homophone Resolution** — 10 pairs with context rules
5. **Number Word Conversion** — "twenty three" -> 23, "a couple" -> 2
6. **Variable Name Extraction** — "call it user count" -> `userCount`
7. **Structural Cue Parsing** — "when," "if," "end" -> indent/dedent markers

### 10.4 Run-On Sentence Splitting

**Method A:** Conjunction splitting ("and then," "after that")
**Method B:** Action verb detection (40 verbs recognized)

### 10.5 Verbal Correction Handling

| Correction Phrase | Action |
|------------------|--------|
| "scratch that" | Undo last instruction |
| "no, I mean..." | Replace last instruction |
| "actually, make that..." | Replace last instruction |
| "wait," / "sorry," / "I meant..." | Replace last instruction |

### 10.6 CLI Interface

```
$ lume voice
[lume voice] Listening... (speak your instructions, say "compile" when done)

  > "get all the users from the database"
  [transcribed] get all the users from the database ✓
  > "compile"
  ✓ Compiled to voice-session-001.js (certified clean)
```

**Flags:** `--output`, `--engine system|whisper`, `--live`, `--review`, `--language`

**Session commands:** compile/done, delete last/undo, read it back, start over, pause/resume

### 10.7 Speech-to-Text Engine Support

**Tier 1 (built-in):** System speech recognition (Web Speech API, platform native). Works offline.
**Tier 2 (optional):** OpenAI Whisper, Google Cloud, Azure. Configured in `.lume/voice-config.json`.

### 10.8 Playground Integration

Microphone button in web playground using Web Speech API. Transcribed text appears in editor in real-time. No server-side processing needed.

### 10.9 Acceptance Criteria

**From Voice-to-Code Handoff (primary):**
- [ ] `lume voice` starts an interactive voice coding session using system speech recognition
- [ ] Transcribed speech appears in real-time and is saved as `.lume` file instructions
- [ ] Transcription Cleanup Layer removes filler words (um, uh, like, you know)
- [ ] Transcription Cleanup Layer detects sentence boundaries from continuous speech
- [ ] Transcription Cleanup Layer resolves common homophones using instruction context
- [ ] Transcription Cleanup Layer handles run-on sentences by splitting at action verbs and conjunctions
- [ ] Voice commands work during session: compile, undo, delete last, read it back, start over, pause
- [ ] `lume voice --live` compiles each instruction immediately after it's spoken
- [ ] `lume voice --review` shows full transcription for editing before compilation
- [ ] `lume voice --output <file>` saves transcription to specified file
- [ ] `lume voice --engine whisper` uses OpenAI Whisper when API key is configured
- [ ] `.lume/voice-config.json` configures engine, language, pause threshold, filler words, and commands
- [ ] Compiled output from voice input is identical to compiled output from the same text typed — the pipeline is the same after transcription
- [ ] Security certificate on voice-compiled output includes `input_method: "voice"` metadata
- [ ] Errors during voice session show clear messages and don't crash the session
- [ ] "done" / "compile" / "compile that" all end the session and trigger compilation
- [ ] Repeated/stuttered words are collapsed ("get get the name" -> "get the name")
- [ ] Spoken punctuation is interpreted correctly ("period" -> ".", "new line" -> line break)
- [ ] Pause > configured threshold (default 1.5s) starts a new instruction line
- [ ] Web playground has a microphone button that enables voice input in the browser

**From M7-13 Handoff (additional):**
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

## 11. MILESTONE 10: VISUAL CONTEXT AWARENESS

### 11.1 What It Is

Extend Context Engine to understand visual layout and UI state. Compiler resolves spatial/visual references.

### 11.2 Capabilities

1. **UI Element Registry** — map of all UI elements with positions, styles, relationships
2. **Spatial Resolution** — "on the left," "below the header" -> CSS/layout properties
3. **Style Resolution** — "make it bigger," "change the color" -> relative style changes
4. **Component Awareness** — "add a login form" generates complete contextual component

### 11.3 Full-Stack App Generation

```
mode: english

this is a recipe sharing app
it has a login page with email and password
after login, show a dashboard with my saved recipes
each recipe has a title, ingredients list, steps, and a photo
I can create new recipes, edit them, and delete them
```

Generates: database schema, backend API, frontend screens, wiring. Phases: Entity Extraction -> Operation Extraction -> UI Extraction -> Code Generation -> Validation.

**CLI:**
```bash
lume create app.lume --frontend react --database postgres --preview
```

`--preview` shows the full generation plan before creating files. `--frontend` supports html, react, expo, next.

### 11.4 Acceptance Criteria

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

## 12. MILESTONE 11: REVERSE MODE (CODE-TO-LANGUAGE)

### 12.1 What It Is

Take existing code and explain it in plain human language.

```
lume explain app.js                    # English (default)
lume explain app.js --lang french      # French
lume explain app.js --mode summary     # Summary
lume explain app.js --mode annotate    # Line-by-line (default)
```

### 12.2 Acceptance Criteria

- [ ] `lume explain` command produces accurate line-by-line annotations
- [ ] Summary mode produces a coherent paragraph-level explanation
- [ ] Output language follows `--lang` flag or auto-detects from user locale
- [ ] Works on JavaScript, TypeScript, and Lume files
- [ ] Handles complex patterns (async/await, closures, higher-order functions)
- [ ] Explanations are accurate and use everyday language, not jargon

---

## 13. MILESTONE 12: COLLABORATIVE INTENT

### 13.1 What It Is

Multiple developers write in different human languages on the same project. Merges happen at AST level.

**Phase A (required):** AST-level diffing for Git-based workflows.
**Phase B (stretch):** Real-time collaboration with Lume Sync Protocol.

### 13.2 Acceptance Criteria

**Phase A (required):**
- [ ] AST-level diffing produces cleaner merges than text-level diffing
- [ ] Two developers in different languages can edit the same file without language-based conflicts
- [ ] Each developer can view the shared codebase rendered in their preferred language
- [ ] Merge conflicts only occur when two developers modify the same logical operation

**Phase B (stretch goal):**
- [ ] Real-time collaboration syncs intent operations, not text
- [ ] Multiple simultaneous editors in different languages see consistent state

---

## 14. MILESTONE 13: ZERO-DEPENDENCY RUNTIME

### 14.1 What It Is

Standalone executables from natural language. One file in, one executable out.

```
Natural Language -> Intent Resolver -> AST -> Transpiler -> JS -> Bundler -> Executable
```

**Stage 1:** Single-file JS output (tree-shaken, bundled)
**Stage 2:** Standalone binary via Bun compile (primary) or Deno compile (fallback)
**Stage 3:** Cross-compilation: `--target linux|macos|windows|wasm`

### 14.2 CLI

```bash
lume build app.lume --bundle    # Single-file JS
lume build app.lume --compile   # Standalone binary
lume build app.lume --target linux --compile  # Cross-compile
```

### 14.3 Acceptance Criteria

- [ ] `--bundle` flag produces a single self-contained `.js` file with zero imports
- [ ] `--compile` flag produces a standalone binary using Bun compile
- [ ] Cross-compilation works for linux, macos, windows targets
- [ ] WebAssembly output works in browsers without a server
- [ ] Self-sustaining features (monitor, heal, optimize, evolve) work in compiled binaries

---

# PART IV: GAP RESOLUTIONS (GAPS 1-15)

---

## 15. GAP 1: AMBIGUITY CEILING — INTERACTIVE CLARIFICATION MODE

When all 7 Tolerance Chain layers fail to reach the confidence threshold, the compiler enters Interactive Clarification Mode — presents top 4 AI-generated interpretations plus "rephrase," caches the answer.

**Text mode:** numbered options. **Voice mode:** spoken prompt. **Web:** modal dialog. **CI/CD:** LUME-E040 error.

Cached in `.lume/compile-lock.json`. `lume compile --reclarify` clears cache.

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

## 16. GAP 2: COMPLEX LOGIC — NATURAL LANGUAGE LOGIC BLOCKS

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

"if all of these are true:" = AND block. "if any of these are true:" = OR block. Dash-prefixed lines = conditions. "otherwise if" = else-if. "otherwise" = else.

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

## 17. GAP 3: STATE MANAGEMENT — IMPLICIT MODULE RESOLUTION

Three-tier resolution: local scope -> explicit `using:` directive -> automatic cross-file search with confirmation.

```
mode: english
using: the user module
using: helpers.lume

get the user list
```

Module index: `.lume/module-index.json` tracks all definitions across project files.

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

## 18. GAP 4: CANONICAL FORM — LUME FORMATTER

```bash
$ lume canonicalize app.lume
Before:  grab all the users from the db
After:   get users from the database
Apply changes? (y/n)
```

Rules: shortest common verb, remove unnecessary articles, normalize negation, remove redundant phrases, preserve identifiers.

Config: `.lume/style-config.json`. Git hook: `lume init --hooks`.

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

## 19. GAP 5: HINT ANNOTATIONS

```
mode: english

sort the list using quicksort
cache the result for 5 minutes
run this in parallel with 4 workers
limit the query to 100 results
retry this up to 3 times with exponential backoff
timeout after 30 seconds
```

Hint categories: algorithm, caching, parallelism, limits, loading, batching, retry, timeout, memory, priority. Hints modify HOW, not WHAT.

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

## 20. GAP 6: ENGLISH ERROR MESSAGES

```
Runtime Error in app.lume:
  Line 4: "get the user's name from the database"
  Error: The user object was null — the database query returned no results.

  Suggestions:
    - Add a check: "if the user exists"
    - Make sure the user ID is valid

  Technical details:
    TypeError: Cannot read property 'name' of undefined
    at app.js:12:5
```

Error translation table maps common JS errors to English explanations.

`lume debug app.lume` — enhanced error catching. `lume debug --step` — step through one at a time.

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

## 21. GAP 7: LUME LINTER

```bash
$ lume lint app.lume
  Line 7: "do the thing with the data" -> warning: vague instruction
  Line 12: "make it work" -> error: too ambiguous
```

10 lint rules (LUME-L001 through LUME-L010): non-canonical verbs, vague pronouns, unbounded operations, non-compilable instructions, inconsistent naming, verbose instructions, missing error handling, missing hints, ambiguous "or", contradictions.

Config: `.lume/lint-config.json`. Strictness: relaxed, standard, strict. Output formats: text, JSON, SARIF.

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

## 22. GAP 8: PATTERN LIBRARY VERSIONING

```
mode: english
patterns: 1.0
```

Version pinning per file and per project (`.lume/config.json`). `compatibility_mode: true` guarantees identical compilation.

`lume upgrade --from 1.0 --to 1.1` shows all changes with file impact analysis. `--dry-run` previews without applying.

Semantic versioning: patch = bug fixes, minor = new patterns, major = resolution changes.

### Acceptance Criteria

- [ ] `patterns: X.Y` declaration in `.lume` files pins the pattern library version for that file
- [ ] `.lume/config.json` has project-wide `pattern_library_version` setting
- [ ] `compatibility_mode: true` guarantees existing programs compile identically on the pinned version
- [ ] `lume upgrade --from X --to Y` shows all changes (new, changed, deprecated patterns) with file impact analysis
- [ ] `lume upgrade --dry-run` previews changes without applying them
- [ ] Changed resolutions show before/after behavior and list every affected file and line
- [ ] Developer can choose automatic upgrade, compatibility mode, or cancel
- [ ] Compile-lock is regenerated after upgrade
- [ ] Semantic versioning: patch = bug fixes, minor = new patterns, major = resolution changes
- [ ] Auto-update allowed for patch/minor; major requires explicit `lume upgrade`

---

## 23. GAP 9: NPM PACKAGE INTEGRATION

```
mode: english

use Express to create a web server on port 3000
use Prisma to connect to the database
use Lodash to sort the users by name
```

Built-in registry of 20+ common npm packages with aliases and capabilities. Auto-installation prompts. `lume install <package> --as "name"` for custom aliases.

### Acceptance Criteria

- [ ] `use [library]` pattern recognized and maps to npm package import
- [ ] Built-in registry of 20+ common npm packages with aliases and capabilities
- [ ] Auto-installation prompts when referenced package is missing (interactive mode)
- [ ] Non-interactive mode fails with LUME-E060 and install instructions
- [ ] `lume install <package>` installs and registers a package
- [ ] `lume install <package> --as "name"` adds a custom English-friendly alias
- [ ] Unknown packages trigger search/specification dialog
- [ ] Package context enhances Tolerance Chain resolution (Express-aware, React-aware, etc.)
- [ ] Compiled output includes correct require/import statements
- [ ] Package versions tracked in project's package.json

---

## 24. GAP 10: DATA STRUCTURES IN ENGLISH

```
mode: english

a user has:
  - a name (text, required, at least 2 characters)
  - an email (text, required, must contain @)
  - an age (number, optional, between 0 and 150)
  - a role (one of: user, admin, moderator, default user)
  - a list of orders, where each order has:
    - a product (text)
    - a price (number)
    - a quantity (number, default 1)
```

Type keywords: text, number, yes/no, list of, date, optional, default, one of. Constraints generate validation in constructors.

### Acceptance Criteria

- [ ] "[entity] has:" followed by indented dash-list defines a data structure
- [ ] Type keywords (text, number, yes/no, list of, date, one of) map to JavaScript types
- [ ] Nested structures ("a list of X, where each X has:") create nested class definitions
- [ ] Default values supported via "default [value]" phrase
- [ ] Optional fields supported via "optional" keyword
- [ ] Enum types supported via "one of: [options]" phrase with generated constants
- [ ] Constraints (required, min/max length, range, must contain) generate validation in constructor
- [ ] Compiled classes include proper constructors with destructured parameters
- [ ] Structure definitions are referenceable by name from other instructions ("create a new user")

---

## 25. GAP 11: TRY/CATCH/RETRY IN ENGLISH

```
mode: english

try to get the user data from the API
if it fails, show "Could not load user data"

try to fetch the weather data
if it fails, retry up to 3 times with a 2 second delay
if it still fails after retrying, show "Weather service unavailable"

try to connect to the database
  get all users
if it fails, show "Database error"
either way, close the database connection

if the user is not logged in
  stop with error "Authentication required"
```

| English Phrase | JavaScript Equivalent |
|---------------|----------------------|
| try to [action] | try { [action] } |
| if it fails, [action] | catch (error) { [action] } |
| if it fails because [reason] | catch + conditional |
| either way / regardless | finally { } |
| retry up to N times | retry loop |
| with exponential backoff | doubling delay |
| stop with error / fail with | throw new Error() |
| ignore the error | empty catch |
| log the error and continue | catch + console.error |

### Acceptance Criteria

- [ ] "try to [action]" creates a try block wrapping the action
- [ ] "if it fails, [action]" creates a catch block
- [ ] "if it fails because [reason], [action]" creates conditional error handling in the catch block
- [ ] "either way" / "regardless" / "no matter what" / "always" creates a finally block
- [ ] "retry up to N times" creates a retry loop with configurable attempt count
- [ ] "with a N second delay" adds delay between retries
- [ ] "with exponential backoff" doubles the delay each attempt
- [ ] "if it still fails after retrying" handles the final failure after all retries exhausted
- [ ] "stop with error" / "fail with" / "throw an error" compiles to throw new Error()
- [ ] "show the error message" / "show what went wrong" outputs error details
- [ ] "ignore the error" creates an empty catch block
- [ ] "log the error and continue" creates a catch block that logs and proceeds
- [ ] Try blocks can contain multiple instructions (indented block)
- [ ] Nested try blocks supported

---

## 26. GAP 12: NATURAL LANGUAGE TESTING

```
mode: english

describe "shopping cart":

  before each test:
    create an empty cart

  test "adding items":
    add "Laptop" to the cart with price 999
    the cart should have 1 item
    the total should be 999

  test "empty cart":
    the cart should be empty
    the total should be 0
```

20+ assertion patterns mapping to Jest expect() calls.

### Acceptance Criteria

- [ ] `test "name":` followed by indented instructions defines a test case
- [ ] `describe "group":` groups related tests
- [ ] 20+ assertion patterns map English phrases to Jest expect() calls
- [ ] "should be", "should equal", "should contain", "should be empty" all resolve correctly
- [ ] Negation supported: "should not be", "should not contain", "should not be empty"
- [ ] "before each test:", "after each test:" map to beforeEach/afterEach
- [ ] "before all tests:", "after all tests:" map to beforeAll/afterAll
- [ ] `.test.lume` files are detected automatically by `lume test`
- [ ] `lume test` runs all `.test.lume` files and reports pass/fail
- [ ] `lume test --filter` runs only matching tests
- [ ] `lume test --watch` re-runs on file changes
- [ ] Test failures show the English instruction that failed, not the JavaScript assertion
- [ ] Compiled test files are valid Jest test suites

---

## 27. GAP 13: ENVIRONMENT CONFIGURATION

```
mode: english

in production:
  use the live database
  send real emails
  log only errors

in development:
  use the test database
  log everything

in all environments:
  check that the API key exists
  start the server on port 3000
```

Environment variables: "get the database URL from the environment, default to 3000"
Feature flags: `.lume/features.json` per environment.

### Acceptance Criteria

- [ ] "in production:" / "in development:" / "in staging:" create environment-conditional blocks
- [ ] "in all environments:" creates code that runs regardless of environment
- [ ] "get [X] from the environment" maps to process.env.X
- [ ] "fail if it's missing" adds existence check with throw
- [ ] "default to [value]" adds fallback value
- [ ] "if we're in production" / "the environment is production" maps to NODE_ENV check
- [ ] Feature flag syntax: "if the [feature] feature is enabled:" checks env var or config
- [ ] `.lume/features.json` configures feature flags per environment
- [ ] Environment blocks compile to standard if/else chains on process.env.NODE_ENV

---

## 28. GAP 14: ASYNC PATTERNS

| English Phrase | JavaScript Pattern |
|---------------|-------------------|
| at the same time: [list] | Promise.all |
| use whichever finishes first: [list] | Promise.race |
| try all and report: [list] | Promise.allSettled |
| first/then/finally chain | sequential await |
| give up after N seconds | AbortController timeout |
| do X every N seconds | setInterval |
| do X after N seconds | setTimeout |
| do X in the background | non-blocking (no await) |

### Acceptance Criteria

- [ ] "at the same time:" / "simultaneously:" / "wait for all of:" with indented list compiles to Promise.all
- [ ] "use whichever finishes first:" compiles to Promise.race
- [ ] "try all of these and report:" compiles to Promise.allSettled
- [ ] "first/then/finally" sequential chains compile to sequential awaits
- [ ] "give up after N seconds" adds AbortController timeout
- [ ] "do X every N seconds" compiles to setInterval
- [ ] "do X after N seconds" compiles to setTimeout
- [ ] "do X in the background" fires without await (non-blocking)
- [ ] Results from parallel operations can be referenced by the instructions that follow
- [ ] Error handling works with parallel operations ("if any of them fail")

---

## 29. GAP 15: COMMENTS AND DOCUMENTATION

```
mode: english

note: this section handles user authentication
get the user's email from the login form

todo: add rate limiting

explain: this function calculates shipping cost based on
  weight, destination, and membership status

get all users # only active ones for now
```

| Marker | Purpose | Compiled Output |
|--------|---------|----------------|
| `note:` | General comment | `// [text]` |
| `todo:` | Future task | `// TODO: [text]` |
| `fixme:` | Bug marker | `// FIXME: [text]` |
| `explain:` | Multi-line explanation | `/* [text] */` |
| `why:` | Reasoning for next line | `// Why: [text]` |
| `warning:` | Important note | `// WARNING: [text]` |
| `#` | Inline comment | `// [text]` |

Comment markers checked BEFORE Tolerance Chain. `lume docs <file>` generates markdown from comments.

### Acceptance Criteria

- [ ] `note:` marks a single-line comment — compiler skips it entirely
- [ ] `todo:` marks a TODO comment — compiles to `// TODO:`
- [ ] `fixme:` marks a FIXME comment — compiles to `// FIXME:`
- [ ] `explain:` starts a multi-line comment block (continues while indented)
- [ ] `why:` explains the reasoning for the next instruction
- [ ] `warning:` marks an important note
- [ ] `#` at end of any line creates an inline comment
- [ ] Comment markers are checked BEFORE the Tolerance Chain — no resolution attempted on comments
- [ ] `lume docs <file>` generates markdown documentation from explain: and note: blocks
- [ ] Linter rule LUME-L011 warns when a line starts with a comment marker but might be an instruction
- [ ] Comments are preserved in compiled JavaScript output as JS comments
- [ ] Blank lines between instructions are preserved for readability (not treated as errors)

---

# PART V: THEORETICAL FRAMEWORK & ACADEMIC POSITIONING

---

## 30. COGNITIVE DISTANCE — THE CORE CONCEPT

### 30.1 Definition

**Cognitive distance** is the mental gap between what a developer intends and what they must type to express that intent. The term is deliberately chosen for its proximity to **cognitive dissonance** — the psychological discomfort of holding contradictory beliefs or performing actions that conflict with one's self-concept.

In programming, cognitive dissonance manifests daily:
- Developer THINKS: "get the user's name from the database"
- Developer TYPES: `const name = await db.query("SELECT name FROM users WHERE id = ?", [userId])`
- The thought and the action do not match

### 30.2 Cognitive Distance Through History

| Era | Language/Tool | Distance | What You Think vs. What You Do |
|-----|-------------|----------|-------------------------------|
| 1950s | Assembly | Maximum | "Add two numbers" -> `MOV AX, 5 / ADD AX, 3` |
| 1970s | C | High | "Add two numbers" -> `int result = a + b;` |
| 1990s | Python | Medium | "Add two numbers" -> `result = a + b` |
| 2020s | AI Agents | Medium-High* | "Add two numbers" -> ask AI -> review -> run |
| 2026 | Lume (text) | Near-Zero | "Add two numbers" -> `add two numbers` |
| 2026 | Lume (voice) | Approaching Zero | Think -> say -> compiled |

*AI agents actually INCREASED cognitive distance: they added a translation layer. Human -> compiler was 2 layers. Human -> AI -> compiler is 3 layers. Lume eliminates the middleman.

### 30.3 The Thesis

If a programming language accepts imprecise natural language as valid source code, three capabilities emerge as architectural consequences:
1. Voice-to-code — compiler already handles imprecise input
2. Intent-aware security scanning — compiler understands what developer MEANT
3. Near-zero cognitive distance — developer expresses intent in the language they think in

The dissonance disappears when the distance approaches zero.

### 30.4 Tagline

> "Other tools add an AI between you and your code. Lume removes the code between you and your machine."

---

## 31. SECURITY AS ARCHITECTURE — CERTIFIED AT BIRTH

### 31.1 Three-Layer Security Model

**Layer 1: Input Security (Pre-Compilation)** — 11 threat categories scanned before any code compiles.

**Layer 2: Live Security (During Compilation)** — Guardian Output Scanner checks each AST node at creation time. Novel contribution: scanner has access to developer's INTENT (English instruction) AND the generated AST node.

**Layer 3: Sandbox Mode (Post-Compilation, Pre-Execution)** — First-run sandbox shows everything the program WOULD do before executing.

### 31.2 Why AST-Level Scanning is Superior

- At AST level: scanner knows developer's INTENT
- At JavaScript level: can only see generated code, must guess intent
- "Delete all user records" at AST = unambiguously mass deletion
- Same operation in JS (`await db.query("DELETE FROM users")`) could be legitimate cleanup
- AST carries semantic context; compiled output does not

### 31.3 Certified at Birth

Code compiled through Lume is provably security-verified from the moment it is compiled. The security certificate is embedded in the output, tamper-evident via SHA-256 hash, and verifiable via `lume verify --hash` or `lume-lang.com/verify/<hash>`.

No existing programming language does this.

---

## 32. DETERMINISTIC COMPILATION OF NON-DETERMINISTIC INPUT

Speech input is non-deterministic (same phrase transcribed differently by different engines). Lume addresses this through:
- **Compile-lock files** — Cache resolution per line for identical recompilation
- **Security certificates** — SHA-256 hash proving compilation chain is unmodified
- **Layer A / Layer B separation** — Deterministic pattern matching preferred; AI results cached

---

## 33. ERROR TOLERANCE AS A DESIGN PRINCIPLE

Traditional compilers reject invalid input. Lume's compiler accepts imperfect input and resolves intent through progressive fallback. This inversion makes the compiler fundamentally compatible with noisy input sources (voice, handwriting OCR, chat messages, informal specs).

---

## 34. ACCESSIBILITY AS ARCHITECTURE

Voice-to-code is not just convenience — it is accessibility:
- Developers with RSI can code without typing
- Developers with mobility impairments can code with voice alone
- Developers who think better verbally can speak logic naturally
- No syntax to memorize — natural language IS the syntax

---

# PART VI: REFERENCE INFORMATION

---

## 35. FILE STRUCTURE

```
lume/
  src/
    lexer.js
    parser.js
    transpiler.js
    intent-resolver/
      index.js           # Routes to Layer A or B
      pattern-library.js # Layer A patterns
      pattern-library-i18n.js  # Translated patterns
      ai-resolver.js     # Layer B: LLM resolution
      context-engine.js  # Project state tracking
      auto-correct.js    # Pre-pipeline correction
      fuzzy-matcher.js   # Levenshtein, word-bag, phonetic
      sentence-splitter.js  # Multi-op sentence splitting
      temporal-resolver.js  # Time expression resolution
      voice-input.js     # Voice pipeline processor
      voice-config.js    # Voice configuration loader
      lang-detect.js     # Language auto-detection
    runtime/
      monitor.js         # Layer 1: Self-monitoring
      healer.js          # Layer 2: Self-healing
      optimizer.js       # Layer 3: Self-optimizing
      evolver.js         # Layer 4: Self-evolving
      sandbox.js         # Isolated execution
      mutation-log.js    # Change tracking with rollback
  bin/
    lume.js              # CLI entry point
  tests/
    unit/                # 552 tests
    integration/
```

## 36. COMPLETE AST NODE TYPES

**Existing (M1-6):** VariableDeclaration, ConstantDeclaration, FunctionDeclaration, IfStatement, ForLoop, WhileLoop, RepeatLoop, ForEachLoop, AskExpression, ThinkExpression, GenerateExpression, ShowStatement, ReturnStatement, UseStatement, ExposeStatement, IntentBlock, MonitorBlock, HealBlock, OptimizeBlock, EvolveBlock, MutateStatement, RollbackStatement, HealableDecorator, CriticalDecorator, ExperimentalDecorator

**New (M7+):** RawBlock, CompoundIfStatement, TryCatchStatement, RetryBlock, PromiseAllBlock, PromiseRaceBlock, PromiseAllSettledBlock, EnvironmentBlock, StructureDefinition, TestBlock, DescribeBlock, CommentNode

## 37. COMPLETE CLI COMMANDS

| Command | Description |
|---------|-------------|
| `lume build <file>` | Compile .lume to JavaScript |
| `lume build --bundle` | Single-file JS output |
| `lume build --compile` | Standalone binary |
| `lume build --fresh` | Ignore compile-lock, re-resolve |
| `lume build --check` | Verify without writing output |
| `lume build --sourcemap` | Generate source maps |
| `lume run <file>` | Compile and execute |
| `lume run --sandbox` | Force sandbox mode |
| `lume run --trusted` | Skip sandbox |
| `lume repl` | Interactive REPL |
| `lume repl --mode english` | English Mode REPL |
| `lume test` | Run all tests |
| `lume test --filter` | Filter tests |
| `lume test --watch` | Re-run on changes |
| `lume voice` | Interactive voice coding |
| `lume voice --live` | Real-time compilation |
| `lume voice --review` | Review before compiling |
| `lume explain <file>` | Explain code in plain language |
| `lume create <file>` | Generate full-stack app |
| `lume create --preview` | Preview generation plan |
| `lume fix <file>` | AI-powered error fix |
| `lume lint <file>` | Lint for clarity/ambiguity |
| `lume canonicalize <file>` | Normalize English instructions |
| `lume docs <file>` | Generate documentation |
| `lume verify --hash` | Verify security certificate |
| `lume upgrade` | Upgrade pattern library |
| `lume install <pkg>` | Install and register npm package |
| `lume monitor` | Real-time monitoring |
| `lume heal status` | Healing status |
| `lume optimize suggest` | Optimization analysis |
| `lume evolve status` | Evolution daemon status |
| `lume patterns list/sync/contribute` | Pattern management |
| `lume config` | Configuration management |
| `lume init` | Project scaffolding |
| `lume init --hooks` | Git hooks setup |
| `lume debug <file>` | Enhanced error catching |
| `lume debug --step` | Step-through debugging |
| `lume listen` | CLI voice capture (M9) |

## 38. CONFIGURATION FILES

| File | Purpose |
|------|---------|
| `lume.config` | AI provider configuration |
| `.lume/compile-lock.json` | Deterministic build lock |
| `.lume/security-config.json` | Security settings |
| `.lume/voice-config.json` | Voice input settings |
| `.lume/autocorrect-dictionary.json` | Learned corrections |
| `.lume/learned-patterns.json` | User-confirmed patterns |
| `.lume/context-memory.json` | Cross-session memory |
| `.lume/module-index.json` | Project-wide definitions |
| `.lume/style-config.json` | Canonicalization settings |
| `.lume/lint-config.json` | Linter configuration |
| `.lume/features.json` | Feature flags |
| `.lume/config.json` | Project settings |
| `.lume/source-maps/*.map.json` | Source maps |

## 39. MONETIZATION

- Compiler + Layer A: always free, forever
- Layer B (AI resolution): 100 calls/month free; unlimited Pro $15/mo; Team $12/seat/mo; Enterprise custom

## 40. DEPLOYMENT & CONTACT

- **Primary domain:** lume-lang.com
- **Secondary domain:** lume-lang.org
- **Source:** github.com/cryptocreeper94-sudo/lume
- **Stack:** JavaScript (Node.js), Express + PostgreSQL (backend), React/Vite (frontend)
- **Support:** team@dwsc.io
- **Launch:** August 23, 2026 CST
- **Ecosystem:** App #35 of 35 in the Trust Layer / DarkWave ecosystem

---

## 41. ACCEPTANCE CRITERIA — COMPLETE COUNT

| Document/Section | Criteria |
|-----------------|----------|
| Milestones 7-13 (core handoff) | 125 |
| Voice-to-Code handoff | 20 |
| Gap Resolution 1-7 | 73 |
| Gap Resolution 8-15 | 87 |
| **Total** | **305** |

All 305 acceptance criteria are reproduced verbatim in this master document.

---

## 42. RELATED WORK & DIFFERENTIATION

| System | Approach | Lume Difference |
|--------|----------|----------------|
| Talon | Voice commands -> IDE actions | Lume compiles voice at language level |
| Serenade | Voice-to-code templates | Lume uses intent resolution, handles arbitrary phrasing |
| GitHub Copilot Voice | LLM-generated code from voice | Lume uses deterministic Layer A first, LLM only as fallback |
| Apple Dictation / Dragon | General dictation | No programming-domain awareness |
| Scratch / Blockly | Visual programming | Block-based, limited scope |
| NLP compilers (research) | NL to code via LLM | Non-deterministic, no security guarantees |
| ESLint / SonarQube / Snyk | Post-compilation scanning | External tools, no intent awareness |

**Lume's differentiation:** Voice-to-code is a compiler feature, not an IDE plugin. Security scanning is a compiler feature, not an external tool. The compiler accepts imprecise input. No prior work integrates voice + live security scanning at the compiler pipeline level with deterministic reproducibility and tamper-evident certificates.

---

## 43. PHASE 14B: FINALIZATION

Phase 14B represents the production-readiness milestone for the Lume compiler.

### Security Hardening

Three new defense layers added to `security-layer.js`:

| Layer | Function | Examples |
|-------|----------|----------|
| Prompt Injection Detection (8 patterns) | Blocks NL jailbreak attempts | "ignore previous instructions", "bypass security", "jailbreak", "system prompt" |
| Output Sanitization (11 patterns) | Scans compiled JS for dangerous calls | `eval()`, `child_process`, `__proto__`, `process.exit`, `innerHTML` |
| Rate Limiting | Flags files with >10 AI calls | Prevents API key abuse |

New exports: `scanGeneratedCode()`, `checkAIRateLimit()`, `fullSecurityAudit()`

### REPL v1.0.0

| Feature | Details |
|---------|---------|
| Tab Autocomplete | 50+ Lume keywords, dot-commands, scope variables |
| Persistent History | `~/.lume_history`, 200-line rolling file |
| `.scope` command | Inspect all variables with types and values |
| `.run <file>` | Execute a `.lume` file inside the REPL session |

### VS Code Extension

| File | Contents |
|------|----------|
| `package.json` | Extension manifest for marketplace |
| `language-configuration.json` | Brackets, comments, folding, indent rules |
| `snippets/lume.json` | 19 snippets (functions, AI, loops, English Mode) |
| `syntaxes/lume.tmLanguage.json` | Full TextMate grammar |
| `extension.js` | Entry point with version command |
| `README.md` | Marketplace-ready docs |

### Git Merge Driver

`lume-merge-driver.js` — AST-aware 3-way merge for `.lume` files. Handles clean merges automatically, writes conflict markers when both sides modify the same line.

### Documentation Suite

| Document | Lines | Covers |
|----------|-------|--------|
| `cli.md` | 190 | All 18+ commands, flags, examples |
| `patterns.md` | 165 | All 102 patterns by category |
| `api.md` | 180 | `@lume/compiler` programmatic API |
| `voice.md` | 170 | Voice CLI, Playground mic, cleanup pipeline |

### Updated Metrics

| Metric | Before | After |
|--------|--------|-------|
| Test suite | 366 | 552 |
| CLI commands | 17 | 18+ |
| LOC | ~10,800 | ~11,000+ |
| Pattern Library | 34+ | 102 |

---

## 44. KEY CLAIMS

1. First programming language where voice-to-code is architecturally native
2. Transcription Cleanup + Tolerance Chain absorbs all speech noise, producing clean AST nodes identical to typed input
3. Deterministic reproducibility despite non-deterministic voice input
4. Same error tolerance enables English Mode AND voice input — same principle, different sources
5. Cognitive distance approaches zero with natural language + voice
6. First language with built-in compiler-level security scanning producing tamper-evident certificates — "certified clean at birth"
7. AI agents increased translation layers from 2 to 3. Lume reduces to 1. The compiler IS the understanding layer.

---

*Lume — The AI-Native Programming Language*
*Built to make AI-powered software as natural as writing a sentence.*
*The first programming language you can speak.*
