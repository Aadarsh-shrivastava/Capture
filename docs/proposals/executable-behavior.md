# Proposal: Executable behavior

Status: proposed, not implemented.

## Idea

Some items are plans or ideas you eventually *try*, not tasks you tick off: "test cold showers for a week", "pitch the app to 3 friends", "try the new pasta recipe". **Executable** lets such an item be run, and the outcome recorded, so ideas turn into evidence.

## What the user sees

- An **Execute** button on the item detail page (only for items whose type has Executable).
- Tapping it starts a *run*: optional start note, timestamp.
- Finishing the run asks for a short **result** ("worked", "didn't", or free text) and an optional rating (1–5).
- The detail page shows a compact run history: date · result · rating. Latest run on top.
- An idea with good results can be **promoted** to a Task (or repeated) from the ⋯ menu.

## Data (fits the existing behavior system — no new tables)

Stored as JSON in `item_behavior_data` under behavior `Executable`:

```json
{
  "runs": "[{\"startedAt\":\"…\",\"endedAt\":\"…\",\"result\":\"worked\",\"note\":\"…\",\"rating\":4}]"
}
```

- Field `runs` uses the `list` input kind (JSON-encoded array), like Divisible steps.
- Definition: `BEHAVIOR_DEFINITIONS.Executable = {tableName: null, fields: [{name: 'runs', input: 'list'}]}`.
- Seed: add `Executable` to `src/db/seed.ts` behaviors. Allowed (optional) on Idea and Note by default via migration; custom types can opt in from Settings → Item types (add to `MANAGEABLE`).

## Code shape

- `src/behaviors/executable.ts` — pure helpers: `parseRuns`, `startRun`, `finishRun(result, rating, note)`, `lastRun`. Unit tests.
- `src/behaviors/ExecuteBar.tsx` — the Execute / Finish button + result sheet for the detail page.
- `src/behaviors/RunHistory.tsx` — compact list on the detail page.
- Detail page renders both only when the item has Executable (same pattern as `ChecklistView`).
- Writes go through `taskActions.updateBehaviorData(itemId, 'Executable', data)` — already exists.

## Later hooks

- **Pinning / sessions** (planned): a run is a session; when time tracking lands, `startedAt`/`endedAt` give duration for free.
- **Agent step**: knowledge file `executable.detect` — "is this something to try/test?" → attach Executable on capture ("try…", "experiment", "test whether…").
- **Weekly review**: "Ideas you ran this week" with results.
- **Memory/personality**: run results are strong signals of what works for the user.

## Effort

Small–medium: one behavior definition + seed, ~3 small components, helpers + tests. No migration beyond seeding the behavior and its optional mapping.
