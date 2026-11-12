# Ask your notes: assistant, memory and context plan

Goal: the user asks in plain words ("what am I doing next Monday?", "what did I say about uncle Sam?") and gets a
correct answer built from their own tasks, notes, journals and ideas, on the phone, offline.

## Constraints

- Model: Qwen at Q4, 380 MB (~0.5B parameters), `n_ctx: 2048` (`src/hooks/useLlamaModel.ts`).
- One completion at a time (`complete()` lock), shared with the capture queue.
- A model this size writes fluent text from a few given facts, but it cannot reliably pick tools, reason over
  many items, or keep long context. It also makes up facts when it has none.

## Principle

**Code finds the facts; the model only words the answer.** Every step that must be right (what the question asks,
which dates, which items) is plain, tested code. The model gets a small, fixed set of facts and is allowed to say
"I don't know".

```
question
  -> router (code: rules + date parser)          what kind of question, which dates / topic
  -> lookup (code: SQLite queries)               at most 8 items
  -> context builder (code: hard token budget)   facts + memory + last turns
  -> model (only if there are facts)             short answer citing [n]
  -> UI                                          answer + tappable sources
```

## 1. Router (code)

Sorts each question into an intent, using rules and the existing date parser (`captureDateContext`,
`inferDueAtFromText`):

| Intent   | Example                              | Output                    |
|----------|--------------------------------------|---------------------------|
| schedule | "what am I doing next Monday"        | date range                |
| recall   | "what did I say about uncle Sam"     | search terms              |
| recent   | "how was last week", "my ideas lately" | type + date range       |
| status   | "what's overdue", "how many today"   | filter                    |

No match = recall over everything. The model never chooses the intent.

## 2. Lookups (code, unit-tested)

Plain TypeScript over SQLite. The same functions later become the suite's API for other apps.

- `tasksBetween(from, to)`: reuses `focusRepository` and repeat expansion (`upcomingOccurrences`), so repeating
  tasks show on the right day.
- `itemsAbout(query)`: full-text search. New FTS5 table (migration 14) over title, content and tag names, kept in
  sync with triggers, ranked with `bm25`. Today's search (`searchRepository`) uses `LIKE`, which can't rank.
- `journalsBetween(from, to)`, `recent(type, n)`, `overdue()`.

## 3. Context budget (hard caps in code)

| Part                     | Tokens |
|--------------------------|--------|
| System rules             | ~120   |
| About-me memory          | <=150  |
| Facts (<= 8 items)       | <=800  |
| Last 2 turns             | <=300  |
| Answer                   | <=350  |

- Each fact is one line: `[n] Mon 17 Nov · Task · Dentist 3 PM — first 100 chars of the body`.
- Rules: answer only from the facts, cite `[n]`, say "I couldn't find that in your notes" when they don't say.
- **No facts: no model call.** Code answers "Nothing about that in your notes."
- Schedule questions: code shows the task list itself (always correct); the model only adds a one-line summary.
- `[n]` citations render as links that open the item.

## 4. Memory (three layers)

1. **Long-term: the items.** Already stored. Retrieved per question; never put in the prompt wholesale.
2. **About me.** Under 10 short lines, always in the prompt: "Uncle Sam = dad's brother", "I work 9–6". The user
   edits it; the app suggests lines from notes saved as facts ("just keep"), and the user confirms each one.
3. **Conversation.** The last 2 turns, plus the last topic tracked by code, so "when is **he** coming?" reuses
   "Sam" without trusting the model to remember. Chat history is not saved as items (for now).

## 5. Search by meaning (later)

A small embedding model (~25–50 MB GGUF, llama.rn embedding call) stored as vectors per item, so "uncle Sam" also
finds "Sam's visit next month". Comes after FTS: FTS covers most questions at no cost.

To check first: llama.rn 0.13 running an embedding context next to the chat context on Android (memory).

## 6. Model upgrade (optional)

A ~1.5B model (e.g. Qwen2.5-1.5B Q4, ~1 GB) is much better at answering from given facts. Offer it as an optional
download; keep 0.5B as the default. Everything above is model-agnostic, so a cloud model could plug in the same
way later.

## 7. Eval

Add question/answer cases to `src/__eval__/`: a fixed set of items, questions, and the item ids each answer must
cite. Score: right sources cited, no invented facts, "don't know" when nothing matches.

## Phases

1. **Phase 1:** router + lookups + FTS + context builder + sources in Chat. Covers "next Monday" and "uncle Sam".
2. **Phase 2:** about-me memory, follow-up questions.
3. **Phase 3:** search by meaning (embeddings).
4. **Phase 4:** expose the lookups to other apps in the suite.

Also worth doing alongside: classification by rules/embeddings and one JSON model call per capture (type + title)
instead of 5–8 yes/no calls; see the discussion of why chat answers read better than capture output.
