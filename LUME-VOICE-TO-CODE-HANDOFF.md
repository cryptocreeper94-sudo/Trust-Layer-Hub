# LUME VOICE-TO-CODE HANDOFF

**Document purpose:** Separate feature handoff for implementing voice input in the Lume compiler. This extends the existing pipeline — it does NOT replace or modify any existing functionality. The building agent already has the full M7-13 handoff; this document adds voice input as an additional input method.

**Prerequisites:** The Auto-Correct Layer and Tolerance Chain (from the main handoff) must be implemented first. Voice-to-code depends on them.

---

## CONCEPT: WHY VOICE WORKS WITH LUME

Traditional programming languages cannot accept voice input because they require exact syntax. A single wrong character breaks compilation. Speech-to-text engines produce imperfect transcriptions — homophones, missing punctuation, run-on sentences, informal phrasing. Traditional compilers cannot handle any of that.

Lume already can. The Auto-Correct Layer corrects misspellings and informal phrasing. The Tolerance Chain resolves ambiguous intent through a 7-step fallback. These systems were built to handle messy text input — but messy text input and speech-to-text output are the same kind of messy. Voice input is not a new problem for Lume; it's the same problem from a different source.

This makes Lume the first programming language where voice-to-code is architecturally natural, not bolted on.

---

## PIPELINE EXTENSION

**Current pipeline (text input):**

```
Text Input -> Auto-Correct -> Intent Resolver (Tolerance Chain) -> Live Security Check -> AST -> Transpiler -> Certified JavaScript
```

**Extended pipeline (voice input):**

```
Voice Input -> Speech-to-Text Engine -> Transcription Cleanup -> Text Input -> Auto-Correct -> Intent Resolver (Tolerance Chain) -> Live Security Check -> AST -> Transpiler -> Certified JavaScript
```

Voice adds two steps at the front of the pipeline:
1. **Speech-to-Text Engine** — converts audio to raw text
2. **Transcription Cleanup** — normalizes speech-to-text artifacts before passing to Auto-Correct

Everything after "Text Input" is identical to the existing pipeline. No changes to the Intent Resolver, Tolerance Chain, Security Layer, Transpiler, or Guardian Output Scanner.

---

## TRANSCRIPTION CLEANUP LAYER

Speech-to-text engines produce output that has specific patterns different from typed text. The Transcription Cleanup Layer normalizes these before passing to Auto-Correct.

### What it handles:

| Speech-to-Text Artifact | Example Transcription | Cleaned Output |
|------------------------|----------------------|----------------|
| Run-on sentences (no punctuation) | "get the users name from the database and show it on the screen" | "get the users name from the database\nshow it on the screen" |
| Filler words | "um get the uh users name" | "get the users name" |
| Homophones | "right the data to a file" | "write the data to a file" (context: file operation) |
| Number words vs digits | "create five buttons" / "create 5 buttons" | Normalized to consistent format |
| Punctuation spoken aloud | "get name period save it period" | "get name. save it." |
| Repeated words (stuttering/lag) | "get get the users name" | "get the users name" |
| Command words vs content | "new line get the users name" | Interpreted as line break + instruction |
| Dictation commands | "delete that" / "undo" / "go back" | Interpreted as editor commands, not code instructions |

### Sentence boundary detection from speech:

Speech doesn't have line breaks. The Transcription Cleanup Layer must detect where one instruction ends and the next begins:

1. **Pause detection** — if the speech-to-text engine provides timing data, pauses > 1.5 seconds indicate a new instruction
2. **Conjunction splitting** — "and then" / "and also" / "after that" indicate a new instruction
3. **Action verb detection** — a new action verb after a complete thought starts a new instruction: "get the name show it on screen" splits at "show"
4. **Explicit markers** — "next" / "new line" / "next step" / "then" spoken by the developer explicitly mark boundaries

### Homophone resolution:

Speech-to-text homophones are resolved using context from the instruction:

| Homophone Pair | Context Rule |
|---------------|-------------|
| write / right | File/database operation context -> "write"; direction/correctness context -> "right" |
| new / knew | Creation context -> "new"; past tense context -> "knew" |
| for / four | Loop/iteration context -> "for"; quantity context -> "four" |
| their / there / they're | Possessive context -> "their"; location -> "there"; contraction -> "they're" |
| two / to / too | Quantity -> "two"; direction/purpose -> "to"; excess -> "too" |
| no / know | Negation -> "no"; knowledge/awareness -> "know" |
| by / buy | Method/proximity -> "by"; purchase -> "buy" |
| sea / see | Water/ocean -> "sea"; visual/display -> "see" |
| mail / male | Email/message -> "mail"; gender -> "male" |
| wait / weight | Time/pause -> "wait"; measurement -> "weight" |

The homophone resolver runs BEFORE Auto-Correct. Auto-Correct then handles anything the homophone resolver missed.

---

## CLI INTERFACE

### `lume voice` — Interactive voice coding session

```bash
$ lume voice
[lume voice] Listening... (speak your instructions, say "compile" when done)

  > "get all the users from the database"
  [transcribed] get all the users from the database ✓

  > "filter the ones who signed up this month"
  [transcribed] filter the ones who signed up this month ✓

  > "show their names and email addresses in a table"
  [transcribed] show their names and email addresses in a table ✓

  > "compile"
  [lume voice] 3 instructions captured. Compiling...

  Compiling voice-session-001.lume...
    Line 1: get all the users from the database .......... OK
    Line 2: filter the ones who signed up this month ..... OK
    Line 3: show their names and email addresses in a table ... OK

  ✓ Compiled to voice-session-001.js (certified clean)
```

### CLI flags:

| Flag | Description |
|------|-------------|
| `lume voice` | Start interactive voice session, save to auto-named file |
| `lume voice --output app.lume` | Start voice session, save transcription to specific file |
| `lume voice --engine system` | Use system speech-to-text (default) |
| `lume voice --engine whisper` | Use OpenAI Whisper for transcription (requires API key) |
| `lume voice --live` | Compile each instruction as it's spoken (don't wait for "compile") |
| `lume voice --review` | Show transcription for review/edit before compiling |
| `lume voice --language spanish` | Accept voice input in Spanish (requires multilingual milestone) |

### Voice commands (spoken during a session):

| Voice Command | Action |
|--------------|--------|
| "compile" | End session and compile all captured instructions |
| "compile that" | Same as "compile" |
| "done" | Same as "compile" |
| "delete last" / "undo" | Remove the last transcribed instruction |
| "delete line [n]" | Remove instruction number n |
| "read it back" | Read all captured instructions back (text-to-speech) |
| "start over" | Clear all captured instructions |
| "pause" | Stop listening (resume with "continue" or "resume") |
| "save" | Save transcription to .lume file without compiling |

### `lume voice --live` — Real-time compilation mode

In live mode, each instruction compiles immediately as it's spoken:

```bash
$ lume voice --live --output app.lume
[lume voice] Live mode. Each instruction compiles as you speak.

  > "create a variable called counter set it to zero"
  [transcribed] create a variable called counter set it to zero
  [compiled] let counter = 0; ✓

  > "every second add one to counter"
  [transcribed] every second add one to counter
  [compiled] setInterval(() => { counter++; }, 1000); ✓

  > "show counter on the screen"
  [transcribed] show counter on the screen
  [compiled] console.log(counter); ✓

  > "done"
  [lume voice] 3 instructions compiled. Output: app.js (certified clean)
```

---

## SPEECH-TO-TEXT ENGINE SUPPORT

Lume should support multiple speech-to-text backends. The Transcription Cleanup Layer sits between the engine and Auto-Correct, so the engine is swappable.

### Tier 1 — Built-in (no external dependencies):

- **System speech recognition** — Web Speech API (browser/playground), platform native APIs (macOS/Windows/Linux)
- Works offline
- Quality varies by platform
- Default engine

### Tier 2 — Optional (requires API key):

- **OpenAI Whisper** — high accuracy, supports 50+ languages, requires network
- **Google Cloud Speech-to-Text** — high accuracy, streaming support
- **Azure Speech Services** — high accuracy, real-time transcription
- Configured in `.lume/voice-config.json`

### Voice configuration file (`.lume/voice-config.json`):

```json
{
  "voice": {
    "enabled": true,
    "engine": "system",
    "language": "en-US",
    "pause_threshold_ms": 1500,
    "filler_words": ["um", "uh", "like", "you know", "basically", "actually"],
    "compile_commands": ["compile", "compile that", "done", "build it", "run it"],
    "cancel_commands": ["start over", "clear", "reset"],
    "read_back": true,
    "confirmation_beep": true
  }
}
```

---

## PLAYGROUND INTEGRATION (lume-lang.com/playground)

The web playground should have a microphone button alongside the text editor:

- Click the mic button -> browser requests microphone permission -> starts listening
- Transcribed text appears in the editor in real-time as the developer speaks
- Developer can edit the transcribed text before compiling
- Compile button works the same whether text was typed or spoken
- Visual indicator showing when the mic is active (pulsing dot or waveform)

This uses the Web Speech API — no server-side processing needed for the playground. The transcription happens in the browser.

---

## ACCESSIBILITY ANGLE

Voice-to-code is not just a convenience feature. It's an accessibility feature:

- Developers with RSI (repetitive strain injury) can code without typing
- Developers with mobility impairments can code with voice alone
- Developers who think better out loud can speak their logic naturally
- Combined with Lume's natural language approach, voice input becomes truly accessible programming — no syntax to memorize, no typing required

This should be part of the marketing messaging: "Lume is the first programming language you can speak."

---

## ACCEPTANCE CRITERIA

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

---

## RELATIONSHIP TO EXISTING PIPELINE

This feature adds NOTHING new to the core compiler. The Intent Resolver, Tolerance Chain, Auto-Correct Layer, Security Layer, Guardian Output Scanner, Transpiler — all unchanged. Voice-to-code is purely an input method extension. The Transcription Cleanup Layer is new, but it sits BEFORE the existing pipeline, not inside it.

Think of it this way:
- Keyboard input -> `.lume` file -> compiler pipeline
- Voice input -> Transcription Cleanup -> `.lume` file -> compiler pipeline

Same destination, different on-ramp.

---

## MARKETING POSITION

> "Lume is the first programming language you can speak."

> "No syntax to memorize. No typing required. Just say what you want your program to do."

> "Voice-to-code isn't bolted on — it's architecturally natural. Lume was built to understand messy human input. Whether you type it, misspell it, or speak it, the intent is the same."

This ties directly to the cognitive distance concept: voice input reduces cognitive distance even further than text input. With text, you still have to type. With voice, you literally just think it and say it. The gap between thought and execution approaches zero.
