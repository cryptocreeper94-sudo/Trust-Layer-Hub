# LUME GAP RESOLUTION HANDOFF — PART 2

**Document purpose:** Addresses 8 additional architectural gaps (Gaps 8-15) identified in the Lume language system. This document is additive — it extends the original gap resolution document (Gaps 1-7) and all prior handoffs.

**Prerequisites:** The building agent should have already received LUME-MILESTONES-7-13-HANDOFF.md, LUME-VOICE-TO-CODE-HANDOFF.md, and LUME-GAP-RESOLUTION-HANDOFF.md (Gaps 1-7).

---

## GAP 8: VERSIONING AND MIGRATION — PATTERN LIBRARY EVOLUTION

### The Problem

The pattern library will grow and change over time. Version 1.0 ships with 34 patterns. Version 1.1 adds 10 new patterns and refines how 3 existing patterns resolve. A developer wrote their program on 1.0. When they update to 1.1:

- Do their existing programs still compile to the same output?
- If a pattern resolution changed, does their compiled JavaScript silently change behavior?
- How do they know what changed between versions?

The compile-lock file helps (it caches resolutions), but the spec doesn't define how the pattern library itself is versioned, how breaking changes are communicated, or how developers migrate code between versions.

### The Solution

A versioned pattern library with semantic versioning, migration tooling, and a compatibility mode that guarantees existing programs compile identically until the developer explicitly upgrades.

### Implementation

**Pattern library version declaration:**

Every `.lume` file can optionally declare which pattern library version it was written against:

```
mode: english
patterns: 1.0

get the user's name from the database
show it on the screen
```

If no `patterns:` declaration exists, the compiler uses the latest version installed.

**Version pinning in project config (`.lume/config.json`):**

```json
{
  "pattern_library_version": "1.0",
  "auto_upgrade": false,
  "compatibility_mode": true
}
```

When `compatibility_mode` is true, the compiler uses the pinned version's resolution rules even if a newer version is installed. This guarantees identical compilation output until the developer explicitly upgrades.

**`lume upgrade` command:**

```bash
$ lume upgrade --from 1.0 --to 1.1

Pattern Library Upgrade: 1.0 -> 1.1

Changes:
  NEW PATTERNS (10):
    - "try ... if it fails ..." -> TryCatchStatement
    - "wait for all of ..." -> PromiseAll
    - [8 more]

  CHANGED RESOLUTIONS (3):
    - "save the data" previously resolved to StoreOperation { target: "disk" }
      now resolves to StoreOperation { target: "default_store" }
      Impact: 2 files affected (app.lume:12, helpers.lume:7)

    - "remove the item" previously resolved to DeleteOperation { hard: true }
      now resolves to DeleteOperation { hard: false, soft: true }
      Impact: 1 file affected (cart.lume:23)

    - [1 more]

  DEPRECATED PATTERNS (1):
    - "grab" is deprecated in favor of canonical verb "get"
      Impact: 3 files affected

Files affected: 4
Would you like to:
  1. Upgrade and update all affected files automatically
  2. Upgrade but keep compatibility mode for affected files
  3. See a detailed diff of each affected file
  4. Cancel

> 1

✓ Upgraded to pattern library 1.1
✓ Updated 4 files
✓ Compile-lock regenerated
```

**Migration report (`lume upgrade --dry-run`):**

Non-destructive preview of what would change:

```bash
$ lume upgrade --dry-run --to 1.1

Would affect 4 files, 6 lines total.
No compilation output changes in 3 files.
1 file (cart.lume) would produce different JavaScript output.
Run without --dry-run to apply.
```

**Semantic versioning for pattern library:**

- **Patch (1.0.x):** Bug fixes to existing patterns. No resolution changes. Safe to auto-update.
- **Minor (1.x.0):** New patterns added. Existing resolutions unchanged. Safe to auto-update.
- **Major (x.0.0):** Pattern resolutions changed or patterns removed. Requires explicit upgrade with migration.

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

## GAP 9: THIRD-PARTY LIBRARIES — NPM PACKAGE INTEGRATION IN ENGLISH MODE

### The Problem

Real JavaScript programs use npm packages — Express, React, Lodash, Axios, Prisma, etc. English Mode needs a way for developers to reference third-party libraries naturally. "Create an Express server" should work, but the compiler needs to know what Express is, that it requires installation, and how to import it.

### The Solution

A package awareness system that recognizes common libraries by name, auto-installs them when referenced, and maps English descriptions to library-specific API calls.

### Implementation

**Natural reference syntax:**

```
mode: english

use Express to create a web server on port 3000
use Prisma to connect to the database
use Axios to fetch data from the weather API
use Lodash to sort the users by name
```

The `use [library]` pattern tells the compiler which package to reference. The rest of the instruction describes what to do with it.

**Package recognition:**

The compiler maintains a built-in registry of common npm packages with their English-friendly descriptions:

```json
{
  "package_registry": {
    "express": {
      "npm_name": "express",
      "aliases": ["Express", "express.js", "expressjs"],
      "capabilities": ["web server", "API", "routes", "middleware"],
      "import_style": "const express = require('express')"
    },
    "axios": {
      "npm_name": "axios",
      "aliases": ["Axios"],
      "capabilities": ["HTTP requests", "fetch data", "API calls"],
      "import_style": "const axios = require('axios')"
    },
    "lodash": {
      "npm_name": "lodash",
      "aliases": ["Lodash", "underscore"],
      "capabilities": ["sort", "filter", "group", "debounce", "throttle", "deep clone"],
      "import_style": "const _ = require('lodash')"
    },
    "prisma": {
      "npm_name": "@prisma/client",
      "aliases": ["Prisma", "prisma ORM"],
      "capabilities": ["database", "ORM", "query", "schema"],
      "import_style": "const { PrismaClient } = require('@prisma/client')"
    }
  }
}
```

**Auto-installation:**

When the compiler encounters a `use [library]` instruction and the package isn't installed:

```
Compiling app.lume...
  Line 1: "use Express to create a web server on port 3000"

  [lume] Express (npm: express) is not installed.
  Install it? (y/n) > y

  ✓ Installed express@4.18.2
  Line 1: use Express to create a web server on port 3000 ... OK
```

In non-interactive mode, missing packages fail with a clear error:

```
ERROR [LUME-E060] Line 1: Package "express" is not installed.
  Run `npm install express` or `lume install express` to install it.
```

**`lume install` command:**

```bash
$ lume install express
✓ Installed express@4.18.2
✓ Added to package registry: "Express" -> express

$ lume install my-custom-lib --as "custom tools"
✓ Installed my-custom-lib@1.0.0
✓ Added alias: "custom tools" -> my-custom-lib
```

The `--as` flag lets developers give English-friendly names to packages that don't have one in the built-in registry.

**Unknown packages:**

When the developer references a package the compiler doesn't recognize:

```
  Line 5: "use SuperWidget to render the dashboard"

  [lume] I don't recognize "SuperWidget" as a known package.
    1. Search npm for "superwidget"
    2. It's a local module (search project files)
    3. Let me specify the npm package name
    4. Skip this — I'll handle the import in a raw: block

  > 1

  [lume] Found: super-widget@2.1.0 — "A dashboard rendering library"
  Install? (y/n) > y
```

**Compiled output:**

```
mode: english

use Express to create a web server on port 3000
add a route for GET /users that returns all users
start the server
```

Compiles to:

```javascript
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
  res.json(getAllUsers());
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Package context for the Tolerance Chain:**

When a file uses a package, the Tolerance Chain gains context about that package's API. "Add middleware for JSON parsing" resolves differently when Express is in context (maps to `app.use(express.json())`) vs when it's not (generic middleware concept).

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

## GAP 10: DATA TYPES AND STRUCTURES — COMPLEX OBJECT DEFINITION IN ENGLISH

### The Problem

English Mode handles simple operations well, but real programs need complex data structures — objects with nested properties, typed arrays, optional fields, enums. "Create a user with a name, email, and a list of orders where each order has a product and a price" needs to compile to a proper data structure definition.

### The Solution

Natural language structure definitions that use indentation and descriptive phrases to define shape, types, and constraints.

### Implementation

**Simple structure definition:**

```
mode: english

a user has:
  - a name (text)
  - an email (text)
  - an age (number)
  - whether they are active (yes/no)
```

Compiles to:

```javascript
class User {
  constructor({ name, email, age, isActive = true }) {
    this.name = name;       // string
    this.email = email;     // string
    this.age = age;         // number
    this.isActive = isActive; // boolean
  }
}
```

**Nested structure:**

```
mode: english

a user has:
  - a name (text)
  - an email (text)
  - a list of orders, where each order has:
    - a product (text)
    - a price (number)
    - a quantity (number, default 1)
    - whether it has shipped (yes/no, default no)
```

Compiles to:

```javascript
class Order {
  constructor({ product, price, quantity = 1, hasShipped = false }) {
    this.product = product;
    this.price = price;
    this.quantity = quantity;
    this.hasShipped = hasShipped;
  }
}

class User {
  constructor({ name, email, orders = [] }) {
    this.name = name;
    this.email = email;
    this.orders = orders.map(o => new Order(o));
  }
}
```

**Type keywords:**

| English Phrase | JavaScript Type |
|---------------|----------------|
| text, string, word, name | string |
| number, count, amount, quantity, age, price | number |
| yes/no, true/false, whether, is/isn't | boolean |
| list of, collection of, array of, set of | Array |
| date, time, timestamp, when | Date |
| optional | field can be null/undefined |
| default [value] | default parameter value |
| one of [options] | enum/union type |

**Enum/union types:**

```
mode: english

a task has:
  - a title (text)
  - a status (one of: pending, in progress, completed, cancelled)
  - a priority (one of: low, medium, high, critical)
```

Compiles to:

```javascript
const TASK_STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', COMPLETED: 'completed', CANCELLED: 'cancelled' };
const TASK_PRIORITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };

class Task {
  constructor({ title, status = TASK_STATUS.PENDING, priority = TASK_PRIORITY.MEDIUM }) {
    this.title = title;
    this.status = status;
    this.priority = priority;
  }
}
```

**Constraints:**

```
mode: english

a user has:
  - a name (text, required, at least 2 characters)
  - an email (text, required, must contain @)
  - an age (number, optional, between 0 and 150)
  - a role (one of: user, admin, moderator, default user)
```

Compiles with validation:

```javascript
class User {
  constructor({ name, email, age = null, role = 'user' }) {
    if (!name || name.length < 2) throw new Error('name is required and must be at least 2 characters');
    if (!email || !email.includes('@')) throw new Error('email is required and must contain @');
    if (age !== null && (age < 0 || age > 150)) throw new Error('age must be between 0 and 150');
    if (!['user', 'admin', 'moderator'].includes(role)) throw new Error('role must be one of: user, admin, moderator');

    this.name = name;
    this.email = email;
    this.age = age;
    this.role = role;
  }
}
```

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

## GAP 11: ERROR HANDLING — TRY/CATCH/RETRY IN ENGLISH

### The Problem

Real programs fail. Network requests time out, databases go down, files don't exist. The pattern library needs explicit support for error handling patterns — try, catch, finally, throw, and retry logic. Without these, English Mode can only express the happy path.

### The Solution

English-friendly error handling syntax that maps to JavaScript try/catch/finally with support for retry logic and custom error messages.

### Implementation

**Basic try/catch:**

```
mode: english

try to get the user data from the API
if it fails, show "Could not load user data"
```

Compiles to:

```javascript
try {
  const userData = await api.getUserData();
} catch (error) {
  console.log("Could not load user data");
}
```

**Try with specific error handling:**

```
mode: english

try to save the file
if it fails because the disk is full, show "Not enough space"
if it fails because permission is denied, show "You don't have access"
if it fails for any other reason, show the error message
```

Compiles to:

```javascript
try {
  await saveFile();
} catch (error) {
  if (error.code === 'ENOSPC') {
    console.log("Not enough space");
  } else if (error.code === 'EACCES') {
    console.log("You don't have access");
  } else {
    console.log(error.message);
  }
}
```

**Try with finally:**

```
mode: english

try to connect to the database
  get all users
  show them on screen
if it fails, show "Database error"
either way, close the database connection
```

"either way" / "regardless" / "no matter what" / "always" maps to finally.

**Retry logic:**

```
mode: english

try to fetch the weather data
if it fails, retry up to 3 times with a 2 second delay
if it still fails after retrying, show "Weather service unavailable"
```

Compiles to:

```javascript
async function fetchWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetchWeatherData();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log("Weather service unavailable");
}
await fetchWithRetry();
```

**Throwing errors:**

```
mode: english

if the user is not logged in
  stop with error "Authentication required"

if the age is less than 0
  stop with error "Age cannot be negative"
```

"stop with error" / "fail with" / "throw an error" maps to `throw new Error(...)`.

**Error handling patterns:**

| English Phrase | JavaScript Equivalent |
|---------------|----------------------|
| try to [action] | try { [action] } |
| if it fails, [action] | catch (error) { [action] } |
| if it fails because [reason] | catch (error) { if (error matches reason) } |
| either way, [action] / regardless, [action] | finally { [action] } |
| retry up to N times | retry loop with N attempts |
| with a N second delay | setTimeout between retries |
| with exponential backoff | delay doubles each attempt |
| if it still fails after retrying | catch after all retries exhausted |
| stop with error "message" | throw new Error("message") |
| fail with "message" | throw new Error("message") |
| show the error message | console.log(error.message) |
| show what went wrong | console.log(error.message + error.stack) |
| ignore the error | catch (error) { /* swallow */ } |
| log the error and continue | catch (error) { console.error(error); } |

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

## GAP 12: TESTING IN ENGLISH — NATURAL LANGUAGE TEST FRAMEWORK

### The Problem

Developers need to write tests. Traditional test frameworks (Jest, Mocha, pytest) use assertion syntax that requires learning a testing DSL. English Mode should let developers write tests in the same natural language they write code in.

### The Solution

A `lume test` command and `.test.lume` file convention that lets developers write tests in English, compiling to a standard test runner (Jest).

### Implementation

**Test file syntax:**

```
mode: english

test "user creation":
  create a user with name "Alice" and email "alice@test.com"
  the user's name should be "Alice"
  the user's email should be "alice@test.com"
  the user should be active

test "login with correct password":
  create a user with password "secret123"
  log in with email "alice@test.com" and password "secret123"
  it should succeed
  the result should include a token

test "login with wrong password":
  create a user with password "secret123"
  log in with email "alice@test.com" and password "wrong"
  it should fail
  the error should say "Invalid password"

test "empty cart total":
  create an empty cart
  the total should be 0
  the cart should have 0 items
```

**Assertion patterns:**

| English Phrase | Jest Equivalent |
|---------------|----------------|
| [X] should be [Y] | expect(X).toBe(Y) |
| [X] should equal [Y] | expect(X).toEqual(Y) |
| [X] should not be [Y] | expect(X).not.toBe(Y) |
| [X] should be greater than [Y] | expect(X).toBeGreaterThan(Y) |
| [X] should be less than [Y] | expect(X).toBeLessThan(Y) |
| [X] should be between [Y] and [Z] | expect(X).toBeGreaterThanOrEqual(Y); expect(X).toBeLessThanOrEqual(Z) |
| [X] should contain [Y] | expect(X).toContain(Y) |
| [X] should include [Y] | expect(X).toContain(Y) |
| [X] should be empty | expect(X).toHaveLength(0) |
| [X] should not be empty | expect(X.length).toBeGreaterThan(0) |
| [X] should have [N] items | expect(X).toHaveLength(N) |
| [X] should be true | expect(X).toBe(true) |
| [X] should be false | expect(X).toBe(false) |
| [X] should be null | expect(X).toBeNull() |
| [X] should exist | expect(X).toBeDefined() |
| [X] should not exist | expect(X).toBeUndefined() |
| it should succeed | expect(result.success).toBe(true) / no error thrown |
| it should fail | expect(fn).toThrow() |
| the error should say [message] | expect(error.message).toBe(message) |
| it should take less than [N] milliseconds | performance assertion with timer |
| [X] should match [pattern] | expect(X).toMatch(pattern) |

**Test groups:**

```
mode: english

describe "shopping cart":

  test "adding items":
    create an empty cart
    add "Laptop" to the cart with price 999
    the cart should have 1 item
    the total should be 999

  test "removing items":
    create a cart with "Laptop" at 999 and "Mouse" at 29
    remove "Mouse" from the cart
    the cart should have 1 item
    the total should be 999

  test "empty cart":
    create an empty cart
    the cart should be empty
    the total should be 0
```

**Setup and teardown:**

```
mode: english

describe "database operations":

  before each test:
    connect to the test database
    clear all test data

  after each test:
    disconnect from the database

  test "saving a user":
    create a user with name "Bob"
    save the user to the database
    get the user by name "Bob"
    the user should exist
```

"before each test:" maps to beforeEach(), "after each test:" maps to afterEach(), "before all tests:" maps to beforeAll(), "after all tests:" maps to afterAll().

**`lume test` command:**

```bash
$ lume test
Running tests...

  shopping cart:
    ✓ adding items (3ms)
    ✓ removing items (2ms)
    ✓ empty cart (1ms)

  database operations:
    ✓ saving a user (45ms)

4 tests passed, 0 failed

$ lume test --file cart.test.lume    # Run specific test file
$ lume test --filter "adding"        # Run tests matching name
$ lume test --verbose                # Show detailed output for each assertion
$ lume test --watch                  # Re-run on file changes
```

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

## GAP 13: ENVIRONMENT AND CONFIGURATION — CONDITIONAL COMPILATION BY ENVIRONMENT

### The Problem

Real applications behave differently in development, staging, and production. Database URLs differ, logging verbosity changes, feature flags toggle. Traditional code uses environment variables and conditional checks. English Mode needs a natural way to express environment-specific behavior.

### The Solution

English-friendly environment blocks and configuration references that compile to environment-aware JavaScript.

### Implementation

**Environment blocks:**

```
mode: english

in production:
  use the live database
  send real emails
  log only errors

in development:
  use the test database
  show emails in the console instead of sending them
  log everything

in all environments:
  check that the API key exists
  start the server on port 3000
```

Compiles to:

```javascript
if (process.env.NODE_ENV === 'production') {
  connectToDatabase(process.env.LIVE_DATABASE_URL);
  emailService.configure({ mode: 'live' });
  logger.setLevel('error');
} else if (process.env.NODE_ENV === 'development') {
  connectToDatabase(process.env.TEST_DATABASE_URL);
  emailService.configure({ mode: 'console' });
  logger.setLevel('debug');
}

if (!process.env.API_KEY) throw new Error('API_KEY is required');
app.listen(3000);
```

**Environment variable references:**

```
mode: english

get the database URL from the environment
get the API key from the environment, fail if it's missing
get the port from the environment, default to 3000
```

| English Phrase | JavaScript |
|---------------|------------|
| get [X] from the environment | process.env.X |
| fail if it's missing | throw if undefined |
| default to [value] | \|\| value |
| the environment is production | process.env.NODE_ENV === 'production' |
| the environment is development | process.env.NODE_ENV === 'development' |
| if we're in production | process.env.NODE_ENV === 'production' |

**Feature flags:**

```
mode: english

if the "dark mode" feature is enabled:
  use the dark theme
otherwise:
  use the light theme

if the "beta dashboard" feature is enabled:
  show the new dashboard
```

Feature flags are checked via environment variables (`process.env.FEATURE_DARK_MODE === 'true'`) or a config file (`.lume/features.json`):

```json
{
  "features": {
    "dark_mode": { "development": true, "production": false },
    "beta_dashboard": { "development": true, "production": false }
  }
}
```

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

## GAP 14: CONCURRENCY AND ASYNC PATTERNS — PARALLEL AND SEQUENTIAL OPERATIONS

### The Problem

The main handoff mentions async auto-detection, but real programs have complex async patterns: waiting for multiple operations simultaneously, racing operations, sequential chains, and error handling across parallel operations. English Mode needs natural ways to express these patterns.

### The Solution

English-friendly concurrency patterns that compile to Promise.all, Promise.race, Promise.allSettled, and sequential async chains.

### Implementation

**Parallel execution (Promise.all):**

```
mode: english

at the same time:
  - get the user data from the API
  - get the order history from the database
  - get the notifications from the notification service
then combine the results
```

Compiles to:

```javascript
const [userData, orderHistory, notifications] = await Promise.all([
  api.getUserData(),
  db.getOrderHistory(),
  notificationService.getNotifications()
]);
```

**Race (Promise.race):**

```
mode: english

use whichever finishes first:
  - get the data from the primary server
  - get the data from the backup server
```

Compiles to:

```javascript
const data = await Promise.race([
  primaryServer.getData(),
  backupServer.getData()
]);
```

**All settled (try all, report results):**

```
mode: english

try all of these and report what happened:
  - send email to the user
  - send SMS to the user
  - send push notification to the user
show which ones succeeded and which ones failed
```

Compiles to:

```javascript
const results = await Promise.allSettled([
  sendEmail(user),
  sendSMS(user),
  sendPushNotification(user)
]);
const succeeded = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');
console.log(`${succeeded.length} succeeded, ${failed.length} failed`);
```

**Sequential with dependency:**

```
mode: english

first, get the user's ID
then, use the ID to get their orders
then, calculate the total from the orders
finally, show the total
```

"first/then/finally" creates a sequential async chain where each step can reference the result of the previous step.

**Timeout on async operations:**

```
mode: english

get the data from the API, but give up after 5 seconds
```

Compiles to AbortController-based timeout.

**Concurrency patterns summary:**

| English Phrase | JavaScript Pattern |
|---------------|-------------------|
| at the same time: [list] | Promise.all([...]) |
| do these simultaneously: [list] | Promise.all([...]) |
| wait for all of: [list] | Promise.all([...]) |
| use whichever finishes first: [list] | Promise.race([...]) |
| try all of these and report: [list] | Promise.allSettled([...]) |
| first, [A] then, [B] then, [C] | sequential await chain |
| but give up after [N] seconds | AbortController timeout |
| do [X] every [N] seconds | setInterval |
| do [X] after [N] seconds | setTimeout |
| do [X] in the background | non-blocking (no await) |

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

## GAP 15: COMMENTS AND DOCUMENTATION — DISTINGUISHING NOTES FROM INSTRUCTIONS

### The Problem

In English Mode, the entire file is English. How does the compiler distinguish between an instruction ("get the users") and a note to other developers ("this section handles user authentication")? Without a comment syntax, the compiler will try to resolve everything as code.

### The Solution

A simple comment syntax that uses natural English markers to indicate non-compilable notes and documentation.

### Implementation

**Comment syntax:**

```
mode: english

note: this section handles user authentication
get the user's email from the login form
check if the email exists in the database

note: we hash the password before comparing
get the stored password hash
compare the input password to the hash

todo: add rate limiting to prevent brute force attacks

note to self: refactor this section when we add OAuth

explain: we check the token expiry before every API call
  because expired tokens return 401 errors and confuse users
if the token is expired
  refresh the token
```

**Comment markers:**

| Marker | Purpose | Compiled Output |
|--------|---------|----------------|
| `note:` | General comment | `// [comment text]` |
| `todo:` | Future task marker | `// TODO: [comment text]` |
| `fixme:` | Bug marker | `// FIXME: [comment text]` |
| `note to self:` | Personal developer note | `// NOTE: [comment text]` |
| `explain:` | Multi-line explanation (indented block) | `/* [comment text] */` |
| `why:` | Explains the reasoning for the next instruction | `// Why: [comment text]` |
| `warning:` | Important note about the following code | `// WARNING: [comment text]` |
| `#` | Quick inline comment (single line) | `// [comment text]` |

**Multi-line comments:**

```
mode: english

explain: this function calculates the shipping cost based on
  the weight of the package, the destination country, and
  whether the customer has a premium membership. Premium
  members get free shipping on orders over $50.

calculate the shipping cost
```

The `explain:` block continues until the indentation returns to the base level. Everything inside is treated as a comment.

**Inline comments:**

```
mode: english

get all users # only active ones for now
filter by status is active # todo: add date range filter
show the count
```

Text after `#` on any line is treated as a comment.

**Documentation generation:**

```bash
$ lume docs app.lume

Generates documentation from explain: blocks and note: comments.
Output: app.docs.md
```

The `explain:` blocks become documentation sections. `note:` becomes inline documentation. This generates a readable markdown file describing what the code does, written in the developer's own words.

**Auto-detection safeguard:**

To prevent the compiler from accidentally treating a comment as an instruction, the comment markers are checked BEFORE the Tolerance Chain runs. If a line starts with any comment marker, it is immediately classified as a comment and skipped. No pattern matching, no AI resolution, no security scanning — it's a comment.

If a developer accidentally writes something that looks like a comment but is meant to be an instruction:

```
mode: english

note the user's preferences   # Is this a comment or an instruction?
```

The compiler treats this as a comment (starts with "note"). If the developer meant "save the user's preferences," they should rephrase. The linter (Gap 7) would flag this:

```
  Line 5: "note the user's preferences"
  [lint] LUME-L011: This line starts with a comment marker ("note:") but might be an instruction.
  Did you mean: "save the user's preferences"?
```

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

## SUMMARY: ALL GAPS (1-15) AND THEIR RESOLUTION

| Gap | Problem | Solution | New Criteria |
|-----|---------|----------|-------------|
| 1 | All tolerance layers fail | Interactive Clarification Mode | 9 |
| 2 | Compound boolean logic | Natural language logic blocks | 12 |
| 3 | Cross-file references | Implicit module resolution | 10 |
| 4 | Inconsistent English | Canonical form + formatter | 11 |
| 5 | No performance control | Hint annotations | 11 |
| 6 | JS errors, not English errors | Enhanced source maps + English errors | 10 |
| 7 | No linter for English | Lume linter + style enforcement | 10 |
| 8 | Pattern library evolution | Versioned patterns + migration tooling | 10 |
| 9 | npm package usage | Package awareness + auto-install | 10 |
| 10 | Complex data structures | English structure definitions | 9 |
| 11 | No error handling | Try/catch/retry in English | 14 |
| 12 | No test framework | Natural language test assertions | 13 |
| 13 | Environment differences | Conditional compilation by environment | 9 |
| 14 | Complex async patterns | Parallel/sequential/race in English | 10 |
| 15 | Comments vs instructions | Comment markers + documentation generation | 12 |
| **Total** | | | **160** |

Combined with the 125 criteria from the main handoff, 20 from voice-to-code, and 73 from Gap Resolution Part 1, the total acceptance criteria across all documents is **378**.

---

## RELATIONSHIP TO OTHER DOCUMENTS

This document extends but does not replace:

- **LUME-MILESTONES-7-13-HANDOFF.md** — Core spec (125 criteria)
- **LUME-VOICE-TO-CODE-HANDOFF.md** — Voice input (20 criteria)
- **LUME-GAP-RESOLUTION-HANDOFF.md** — Gaps 1-7 (73 criteria)
- **LUME-ACADEMIC-PAPER-BRIEF.md** — Academic paper brief
- **This document** — Gaps 8-15 (160 criteria)

All documents will be compiled into a single master document when the specification is complete.
