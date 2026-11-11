# Capture — Status (2026-10-31)

## What works

- **Onboarding** — welcome → create vault (name + location) → profile (name, photo).
- **Vault** — one folder holds the database, AI model and media (`src/vault/`). Location: "On this iPhone" (visible in Files) or private.
- **Capture** — typed/voice capture, full-screen review, undo. Agentic parser (`src/selectiveKnowledge/`, on by default) runs small steps: type → title → description → date → group, with live step lines while analyzing; heuristics fallback.
- **Focus** — today: Now card + collapsible Next (2 timed) / Later; other days: plain list. Swipe to complete/reschedule, "Later" pushes N hours (setting), completed tasks slide out, day progress bar, pull down to capture (iOS).
- **Library** — type cards, groups row, task lists with sort/filter, search across titles/notes/tags/groups.
- **Groups** — group page (add existing / capture into group / remove), groups list with multi-select archive/delete + undo.
- **Selection** — long-press multi-select on Focus, lists, search, group pages; bulk complete/delete with staggered slide-out and undo.
- **Notifications** — reminders 30 and 5 min before timed tasks, Done/Snooze actions, 8 AM summary, Sunday weekly review nudge, overdue app badge.
- **Reviews** — daily leftovers sheet (first open of the day), weekly review (Sunday evening).
- **Profile** — name, photo/emoji, stats, activity map.
- **Dev tools** — floating button (dev builds): run reminder job, show reviews, agentic capture switch.

## Module map

Feature modules expose one `index` entry: `vault`, `onboarding`, `profile`, `groups`, `selection`, `undo`, `taskActions`, `recurrence`, `notifications`, `dailyReview`, `weeklyReview`, `search`, `progress`, `motion`, `dev`, `selectiveKnowledge`.

## Known gaps / next

- Subtasks/checklists, Upcoming (7-day) view, repeating tasks UI (logic exists), iOS widget + share sheet, export/backup, accessibility (dynamic type, VoiceOver), light theme.
- Lists render with `ScrollView` + `map`; switch to `FlatList` once item counts grow.
- Row removal isn't animated (LayoutAnimation crashes on the new architecture); add `react-native-reanimated` for exit/reflow animations.
- App settings (kv store) live outside the vault and show as a `SQLite` folder in Files.
- Vault can't be moved/renamed after setup.
- Android: pull-to-capture needs a RefreshControl (no overscroll bounce).
