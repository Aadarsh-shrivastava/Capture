import {BEHAVIOR_DEFINITIONS} from '@/domain/behaviorDefinitions';
import {analyzeCaptureText} from '@/capture/captureHeuristics';
import {
  formatCaptureDateContextForPrompt,
  getCaptureDateContext,
} from '@/capture/captureDateContext';
import {formatHeuristicsGuideForPrompt, HEURISTIC_EXAMPLES} from '@/capture/captureHeuristicsGuide';
import {
  TYPE_BEHAVIOR_RULES,
  TYPE_DEFAULT_BEHAVIORS,
} from '@/domain/behaviorTypeConfig';
import {CAPTURE_TYPE_NAMES} from '@/capture/captureItemDraft';

const TYPE_DESCRIPTIONS: Record<(typeof CAPTURE_TYPE_NAMES)[number], string> = {
  Task: 'Something to do — actionable, may have due dates and status.',
  Note: 'Something to reference — facts, links, snippets.',
  Journal: 'Personal reflection — diary-style entry worth revisiting.',
  Idea: 'Loose thought — capture without committing to action yet.',
};

function formatBehaviorFields(): string {
  return Object.values(BEHAVIOR_DEFINITIONS)
    .map(def => {
      if (def.fields.length === 0) {
        return `- ${def.name}: no extra fields`;
      }
      const fields = def.fields
        .map(f => {
          const opts = f.options?.map(o => o.value).join(' | ') ?? '';
          const req = f.required ? 'required' : 'optional';
          const enumHint = opts ? ` enum: ${opts}` : '';
          return `    "${f.name}": string (${f.input}, ${req}${enumHint})`;
        })
        .join('\n');
      return `- ${def.name}:\n${fields}`;
    })
    .join('\n');
}

function formatTypeDefaults(): string {
  return CAPTURE_TYPE_NAMES.map(typeName => {
    const rules = TYPE_BEHAVIOR_RULES[typeName];
    const defaults = TYPE_DEFAULT_BEHAVIORS[typeName].join(', ');
    const optional = rules.optionalAllowed.join(', ') || 'none';
    return `- ${typeName}: ${TYPE_DESCRIPTIONS[typeName]} Default behaviors: ${defaults}. Optional behaviors allowed: ${optional}.`;
  }).join('\n');
}

function formatExampleOutputs(now: Date): string {
  return HEURISTIC_EXAMPLES.map(ex => {
    const draft = analyzeCaptureText(ex.input, undefined, now);
    return `Input: "${ex.input}"\nExpected JSON (match or improve):\n${JSON.stringify(draft, null, 2)}`;
  }).join('\n\n');
}

export function buildCaptureSystemPrompt(now = new Date()): string {
  const dateContext = formatCaptureDateContextForPrompt(getCaptureDateContext(now));

  return `You are a capture parser for a personal productivity app.

Your ONLY job: read the user's free-form text and output a single JSON object that creates an item.

STRICT RULES:
1. Output ONLY raw JSON. No markdown, no code fences, no explanation, no trailing text.
2. Pick exactly one typeName using the classification heuristics below.
3. Journal = personal lived experience ("today was…", "I had fun"). Note = factual/reference ("X is a…", docs). Task = action verbs ("need to", "buy", "call"). Idea = speculative ("what if").
4. title must be a SHORT label (roughly 3–8 words). Never put the full capture text in title.
   - Task: rewrite as action-oriented subject. Strip dates, times, urgency — those go in metadata.
     • "i need to go to bank this sunday at 5 its urgent" → title: "Go to bank"
   - Note / Journal / Idea: short subject from the first line only (e.g. "IDOR vulnerability", "Today was great").
     • NEVER put paragraphs or the full user text in title.
5. content rules by type:
   - Task: optional extra detail (lists, context). Use null when title + metadata cover everything.
   - Note / Journal / Idea: REQUIRED — put the user's full text here verbatim (minor typo fixes OK). This is the main body field.
6. importance and urgency are integers 1-5 or null (urgency usually null except Tasks).
7. tagNames: 0–5 short lowercase tags from heuristics (e.g. personal, work, learning, urgent, link).
8. groupNames: 0–3 group names from heuristics if they fit; use exact names listed; [] if unsure.
9. optionalBehaviorNames must NOT repeat type defaults; only use optional behaviors allowed for that type.
10. behaviorData keys are behavior names. Field names use snake_case exactly as defined below.
11. DATE/TIME EXTRACTION (Tasks with Doable): actively scan the input for ANY date/time clue — today, tomorrow, weekdays, "this Sunday", "at 5pm", "in 2 hours", "before Friday", "eod", etc. Resolve using CURRENT DATE/TIME CONTEXT below and write to behaviorData.Doable.due_at. Output ISO 8601 when a time is present, YYYY-MM-DD for date-only. Use "" ONLY when you have thoroughly checked and found no date/time signal.
12. URLs → Note + Visitable in optionalBehaviorNames with url in behaviorData.

${dateContext}

${formatHeuristicsGuideForPrompt()}

ALLOWED typeName values:
${formatTypeDefaults()}

ALL behaviors and behaviorData field schemas:
${formatBehaviorFields()}

REQUIRED JSON SHAPE (all keys must be present):
{
  "typeName": "Task" | "Note" | "Journal" | "Idea",
  "title": string,
  "content": string | null,
  "importance": number | null,
  "urgency": number | null,
  "tagNames": string[],
  "groupNames": string[],
  "optionalBehaviorNames": string[],
  "behaviorData": {
    "<BehaviorName>": { "<field_name>": "<string value>" }
  }
}

FULL EXAMPLE OUTPUTS (from heuristic analyzer — match or improve):
${formatExampleOutputs(now)}`;
}
