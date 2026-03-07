# LUME — Milestone 6: Self-Sustaining Runtime
### The Autonomous Programming Language
**Handoff Document | March 2026**

---

## CONTEXT

Milestones 1-5 build Lume as a language — lexer, parser, transpiler, AI integration, interop, tooling, and IDE. Milestone 6 makes Lume programs autonomous. A Lume program built with Milestone 6 features can monitor itself, heal itself, optimize itself, and evolve — only calling a human when it faces a decision it genuinely cannot make on its own.

This milestone builds on top of everything from Milestones 1-5. The AI keywords (`ask`, `think`, `generate`), the error handling (Result type), the intent blocks, and the `@critical`/`@experimental` markers all feed into the self-sustaining system.

**Prerequisites:** Milestones 1-5 must be complete before starting Milestone 6.

---

## ARCHITECTURE OVERVIEW

The self-sustaining runtime has four layers, each building on the one below it:

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

Each layer is a module in the runtime that can be enabled independently. Layer 1 is always on by default. Layers 2-4 are opt-in via configuration.

---

## LAYER 1: SELF-MONITORING

### What It Does
Every Lume program automatically tracks its own health metrics while running. No extra code needed — the runtime instruments everything.

### Metrics Collected

| Metric | What It Tracks | Why It Matters |
|--------|---------------|----------------|
| `execution_time` | How long each function takes (ms) | Identifies slow functions |
| `call_count` | How many times each function is called | Finds hot paths and unused code |
| `error_rate` | Errors per function over time | Spots unstable functions |
| `memory_usage` | Heap size at intervals | Detects memory leaks |
| `ai_call_latency` | Response time for ask/think/generate | Monitors AI provider performance |
| `ai_call_cost` | Token usage per AI call | Tracks spending |
| `fetch_success_rate` | HTTP success/failure ratio per endpoint | Detects API degradation |
| `cache_hit_rate` | How often cached values are reused | Measures cache effectiveness |

### Implementation

**New runtime module: `src/runtime/monitor.js`**

The monitor wraps every function at transpile time with timing and counting instrumentation:

```javascript
// Transpiled output with monitoring (automatically added)
const _monitor = require('lume/runtime/monitor');

function greet(name) {
    const _t = _monitor.start('greet');
    try {
        const result = "Hello, " + name;
        _monitor.success('greet', _t);
        return result;
    } catch (e) {
        _monitor.error('greet', _t, e);
        throw e;
    }
}
```

**Lume syntax — accessing metrics:**
```
// Built-in monitor access
let stats = monitor.stats()
show stats.functions.greet.avg_time
show stats.functions.greet.error_rate
show stats.ai.total_cost
show stats.memory.current

// Monitor dashboard (built-in web UI)
monitor.dashboard on port 9090
```

**The `monitor` keyword:**
```
// Enable monitoring with custom settings
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

### Transpiler Changes
The transpiler must add monitoring instrumentation to every function automatically. This is a compile-time transformation — the developer never sees or writes the monitoring code. A `--no-monitor` flag disables it for production builds where performance overhead is a concern.

### Deliverables
- `src/runtime/monitor.js` — Monitoring runtime module
- Transpiler modification to inject monitoring wrappers
- `monitor` keyword parsed and handled
- Built-in dashboard (simple HTML page served by the runtime)
- Metrics accessible via `monitor.stats()` in Lume code
- `--no-monitor` CLI flag

---

## LAYER 2: SELF-HEALING

### What It Does
When something breaks, the program has a playbook of recovery strategies. Instead of crashing, it recovers automatically and logs what happened.

### Recovery Strategies

| Failure Type | Auto-Recovery | Behavior |
|-------------|--------------|----------|
| API call failed | Retry with exponential backoff | Wait 1s, 2s, 4s, then fail gracefully |
| API endpoint down | Switch to backup endpoint | Use fallback URL from config |
| Database connection dropped | Reconnect automatically | Retry connection up to 5 times |
| AI model rate limited | Queue and retry | Hold requests, retry after rate limit window |
| AI model unavailable | Fall back to alternate model | Switch from claude.sonnet to gpt.4o |
| Function threw exception | Catch, log, serve fallback | Return cached/default value instead of crashing |
| Memory usage critical | Trigger garbage collection | Clear caches, release unused resources |
| Dependency timeout | Circuit breaker pattern | Stop calling failing service, use fallback, periodically check if service recovered |

### Implementation

**New runtime module: `src/runtime/healer.js`**

**Lume syntax — healing configuration:**
```
// Global healing config
heal:
    retries: 3
    backoff: exponential
    fallback_models:
        claude.sonnet -> gpt.4o -> local.llama
    circuit_breaker:
        threshold: 5 failures
        cooldown: 30 seconds
    on_heal: log "Auto-healed: {event.type} in {event.function}"
```

**Per-function healing:**
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

**How it works with existing features:**
- Functions marked `@critical` (from Section 10.10 of the main spec) automatically get Layer 2 healing with default settings
- Functions marked `@experimental` get healing but with sandbox isolation — failures don't affect the rest of the program
- The `or fail with` error handling syntax is the manual version of what healing does automatically

### Circuit Breaker Pattern
When an external service fails repeatedly, the healer stops calling it entirely (opens the circuit), serves fallback data, and periodically checks if the service has recovered (half-open state). If the check succeeds, normal operation resumes (circuit closes).

```
Circuit States:
CLOSED  — Normal operation, all calls go through
OPEN    — Service is down, all calls go to fallback immediately
HALF-OPEN — Testing if service recovered, one call goes through
```

### Deliverables
- `src/runtime/healer.js` — Self-healing runtime module
- `heal` keyword parsed and handled in config blocks
- `@healable` decorator support
- Circuit breaker implementation
- Exponential backoff retry logic
- AI model fallback chain
- Integration with Layer 1 monitoring (healing events are tracked as metrics)
- Healing event log accessible via `heal.log()`

---

## LAYER 3: SELF-OPTIMIZING

### What It Does
The program uses AI to analyze its own performance data (from Layer 1) and improve its own code. This is Lume's `mutate` keyword in action — but triggered automatically by the monitoring system, not by a human.

### Optimization Triggers

| Trigger | Condition | Action |
|---------|-----------|--------|
| Slow function | avg_time > threshold for 100+ calls | AI rewrites function for performance |
| Repeated inputs | Same inputs detected 50+ times | Auto-add caching |
| High error rate | error_rate > 10% over 1 hour | AI analyzes error patterns and suggests fix |
| Unused code | call_count = 0 for 7+ days | Flag for removal, notify developer |
| Expensive AI calls | Token cost exceeds budget threshold | AI suggests prompt optimization |
| Redundant fetches | Same URL fetched multiple times per request | Consolidate into single fetch with shared result |

### Implementation

**New runtime module: `src/runtime/optimizer.js`**

**Lume syntax — optimization config:**
```
optimize:
    enabled: true
    mode: suggest  // "suggest" = show suggestions, "auto" = apply automatically
    ai_model: claude.sonnet
    budget: 1000 tokens per optimization
    constraints:
        max_mutations_per_day: 10
        require_test_pass: true
        require_intent_pass: true
        log_all_changes: true
    ignore:
        - "critical_payment_function"
        - "auth_handler"
```

**How automatic optimization works:**

```
Step 1: Monitor detects slow function (Layer 1)
    greet() avg_time: 450ms (threshold: 200ms)

Step 2: Optimizer reads the function source
    to greet(name: text) -> text:
        let greeting = ask "Create a personalized greeting for {name}"
        return greeting

Step 3: Optimizer sends to AI
    think "This Lume function is slow (450ms avg).
           Analyze why and suggest an optimization.
           The function must maintain the same signature
           (takes text, returns text).
           Current source: [source code]"

Step 4: AI suggests optimization
    "The function calls an AI model on every invocation.
     Add caching for repeated names."

Step 5: Optimizer generates mutated version
    @cached 1 hour
    to greet(name: text) -> text:
        let greeting = ask "Create a personalized greeting for {name}"
        return greeting

Step 6: Mutated version runs in sandbox
    - Same type signature? YES
    - Intent block tests pass? YES (or N/A if none exist)
    - Faster? YES (avg_time: 12ms for cached hits)

Step 7: Apply or suggest
    Mode "suggest": Show developer the optimization and wait for approval
    Mode "auto": Apply immediately and log the change

Step 8: Log the mutation
    Mutation Log Entry:
    - Date: 2026-09-15T14:30:00Z
    - Function: greet
    - Trigger: avg_time exceeded threshold (450ms > 200ms)
    - Change: Added @cached decorator
    - Result: avg_time reduced to 12ms (97% improvement)
    - Rollback available: YES
```

### Safety Guardrails
1. Functions listed in `optimize.ignore` are never touched
2. Type signatures must be preserved — inputs and outputs cannot change
3. Intent block tests must pass after mutation — if they fail, the change is rolled back
4. All mutations are logged with before/after code, reason, and rollback capability
5. `max_mutations_per_day` prevents runaway optimization loops
6. `require_test_pass: true` means the full test suite runs after each mutation
7. A human can run `lume rollback` to undo any optimization

### Deliverables
- `src/runtime/optimizer.js` — Self-optimizing runtime module
- `optimize` keyword parsed and handled in config blocks
- Integration with `mutate` keyword from main spec
- Sandbox execution environment for testing mutations
- Mutation log with full history and rollback capability
- Two modes: `suggest` (human approval) and `auto` (fully autonomous)
- Integration with Layer 1 monitoring (optimization triggers based on metrics)
- Integration with Layer 2 healing (healer can trigger optimizer for recurring issues)

---

## LAYER 4: SELF-EVOLVING

### What It Does
The program doesn't just fix problems — it anticipates them. It watches trends, predicts issues before they happen, adapts to external changes, and evolves its capabilities over time.

### Evolution Capabilities

| Capability | Description | Example |
|-----------|-------------|---------|
| Predictive scaling | Detects usage trends and pre-optimizes | Traffic doubles every Monday at 9am — pre-warm caches at 8:45am |
| Dependency monitoring | Watches for security updates and new versions | lodash 4.18.0 has a vulnerability — auto-update to 4.18.1, test, deploy |
| Model evolution | Tests new AI models against current ones | GPT-5 released — benchmark against GPT-4o, switch if better and cheaper |
| Schema adaptation | Detects API response format changes | External API added a new field — update parser automatically |
| Cost optimization | Tracks spending and finds savings | "Switching ask calls from claude.sonnet to claude.haiku saves $40/day with 2% quality drop" |
| Pattern learning | Learns from usage patterns to suggest new features | "Users frequently call fetch_weather then fetch_news. Suggest a combined function?" |

### Implementation

**New runtime module: `src/runtime/evolver.js`**

The evolver runs as a persistent background process (daemon) alongside the main Lume program.

**Lume syntax — evolution config:**
```
evolve:
    enabled: true
    daemon: true  // Runs as background process
    check_interval: 1 hour
    capabilities:
        dependency_updates: true
        model_benchmarking: true
        schema_adaptation: true
        cost_optimization: true
        pattern_learning: suggest  // "suggest" or "auto"
    notifications:
        channel: "webhook"
        url: "https://your-app.com/api/evolution-alerts"
    constraints:
        require_human_approval_for:
            - dependency_major_versions
            - model_switches
            - schema_changes
        auto_approve:
            - dependency_patches
            - cache_adjustments
            - cost_optimizations_under_5_percent
```

**Dependency monitoring:**
```
// The evolver checks npm for updates daily
Evolution Log:
- lodash 4.17.21 -> 4.18.0 available
  Type: minor version (auto-approve eligible)
  Action: Installed in sandbox, ran all tests
  Result: All tests pass, no breaking changes
  Applied: YES (auto-approved)

- express 4.x -> 5.0.0 available
  Type: major version (requires human approval)
  Action: Installed in sandbox, ran all tests
  Result: 3 tests failed (breaking API changes)
  Applied: NO (awaiting human review)
  Suggestion: Here are the 3 changes needed to upgrade: [details]
```

**Model benchmarking:**
```
// The evolver periodically tests AI model performance
Evolution Log:
- Benchmark run: 2026-10-01
  Current model: claude.sonnet
  Tested: gpt.4o, claude.haiku, gpt.4o-mini
  Results:
    claude.sonnet — quality: 94%, cost: $0.003/call, latency: 800ms
    gpt.4o — quality: 92%, cost: $0.004/call, latency: 650ms
    claude.haiku — quality: 87%, cost: $0.001/call, latency: 300ms
  Recommendation: Stay with claude.sonnet (best quality)
  For cost-sensitive calls: Switch to claude.haiku (70% cost savings, 7% quality drop)
  Action: Suggest to developer (requires approval for model switch)
```

### The Evolution Daemon

```
Lume Program (main process)
    |
    |--- [Layer 1: Monitor] — Collects metrics continuously
    |
    |--- [Layer 2: Healer] — Responds to failures in real-time
    |
    |--- [Layer 3: Optimizer] — Improves code based on metrics
    |
    └--- [Layer 4: Evolver] — Background daemon
              |
              |--- Dependency checker (hourly)
              |--- Model benchmarker (daily)
              |--- Schema validator (on each API call failure)
              |--- Cost analyzer (daily)
              |--- Pattern learner (weekly)
              |
              └--- Notifications → Developer
```

### Deliverables
- `src/runtime/evolver.js` — Self-evolving runtime module
- Background daemon process management
- npm dependency checker and auto-updater
- AI model benchmarking system
- Schema change detection and adaptation
- Cost tracking and optimization recommendations
- Pattern learning engine (usage analysis)
- Notification system (webhook, email, log)
- `evolve` keyword parsed and handled in config blocks
- `lume evolve status` CLI command to see evolution activity
- `lume evolve history` CLI command to see all evolution decisions
- `lume evolve approve [id]` / `lume evolve reject [id]` for pending decisions

---

## CLI COMMANDS FOR MILESTONE 6

| Command | Description |
|---------|-------------|
| `lume monitor` | Show real-time monitoring dashboard in terminal |
| `lume monitor --web` | Launch web-based monitoring dashboard |
| `lume heal status` | Show current healing status and circuit breaker states |
| `lume heal log` | Show healing event history |
| `lume optimize suggest` | Run optimization analysis and show suggestions |
| `lume optimize apply [id]` | Apply a specific optimization suggestion |
| `lume optimize rollback [id]` | Roll back a specific optimization |
| `lume optimize log` | Show mutation/optimization history |
| `lume evolve status` | Show evolution daemon status and pending decisions |
| `lume evolve history` | Show all evolution decisions and outcomes |
| `lume evolve approve [id]` | Approve a pending evolution decision |
| `lume evolve reject [id]` | Reject a pending evolution decision |
| `lume evolve benchmark` | Trigger an immediate model benchmark |
| `lume evolve deps` | Check for dependency updates now |

---

## NEW KEYWORDS AND AST NODES

### Keywords to Add
`monitor`, `heal`, `healable`, `optimize`, `evolve`, `rollback`, `suggest`, `auto`, `daemon`

### New AST Node Types

| Node Type | Description | Example Source |
|-----------|-------------|----------------|
| `MonitorBlock` | Monitoring configuration | `monitor:` |
| `HealBlock` | Healing configuration | `heal:` |
| `OptimizeBlock` | Optimization configuration | `optimize:` |
| `EvolveBlock` | Evolution configuration | `evolve:` |
| `HealableDecorator` | Marks function as auto-healable | `@healable` |
| `RollbackStatement` | Undo a mutation | `rollback` |

---

## FILE STRUCTURE ADDITIONS

```
lume/
  src/
    runtime/
      monitor.js      # Layer 1: Self-monitoring
      healer.js        # Layer 2: Self-healing
      optimizer.js     # Layer 3: Self-optimizing
      evolver.js       # Layer 4: Self-evolving
      sandbox.js       # Isolated execution environment for testing mutations
      mutation-log.js  # Tracks all code changes with rollback capability
  tests/
    unit/
      monitor.test.js
      healer.test.js
      optimizer.test.js
      evolver.test.js
    integration/
      self-sustaining.test.js
```

---

## ACCEPTANCE CRITERIA

Milestone 6 is DONE WHEN:

1. **Layer 1:** A Lume program automatically tracks execution time, call count, error rate, and memory usage for every function without any developer code. Metrics are accessible via `monitor.stats()`. Web dashboard displays real-time metrics.

2. **Layer 2:** A Lume program with `@healable` functions automatically retries failed operations, falls back to backup endpoints/models, and implements the circuit breaker pattern. The program stays running when external services fail.

3. **Layer 3:** The optimizer can read a slow function's source, send it to an AI model for analysis, receive a suggested improvement, test it in a sandbox, verify type signatures and intent tests pass, and either suggest it to the developer or apply it automatically. All mutations are logged and rollbackable.

4. **Layer 4:** The evolution daemon runs as a background process, checks for dependency updates, benchmarks AI models, detects API schema changes, and sends notifications. Human approval is required for major changes. Minor changes can be auto-approved based on configuration.

5. **All layers integrate:** Monitor feeds data to healer (triggers healing on errors), healer feeds data to optimizer (recurring issues trigger optimization), optimizer feeds data to evolver (optimization patterns inform evolution decisions).

6. **Tests pass:** Unit tests for each layer and integration tests for the full self-sustaining pipeline.

---

## IMPLEMENTATION RULES

1. Build layers in order: Layer 1 first, then 2, then 3, then 4. Each depends on the one below it.
2. Layer 1 (monitoring) must have minimal performance overhead — less than 5% impact on execution time.
3. Layer 2 (healing) must never make a problem worse. If a recovery strategy fails, fall back to the default error handling from Milestones 1-5.
4. Layer 3 (optimizing) must be conservative. When in doubt, suggest instead of auto-apply. Safety guardrails are non-negotiable.
5. Layer 4 (evolving) must always require human approval for major changes (dependency major versions, model switches, schema changes) unless explicitly configured otherwise.
6. All self-sustaining features must be optional. A Lume program without any `monitor`/`heal`/`optimize`/`evolve` blocks works exactly as it did in Milestones 1-5.
7. The mutation log is append-only and cannot be deleted by the program itself. It's the audit trail.

---

*Lume Milestone 6 — Making software that takes care of itself.*
