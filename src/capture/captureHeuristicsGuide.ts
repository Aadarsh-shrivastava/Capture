import type { ItemTypeName } from '@/ui/itemTypeConfig';

/** One classification example shown to the model and used in docs. */
export type HeuristicExample = {
  input: string;
  typeName: ItemTypeName;
  importance: number | null;
  urgency: number | null;
  tagNames: string[];
  groupNames: string[];
  rationale: string;
};

/** Signal bundle for a single item type. */
export type TypeHeuristic = {
  typeName: ItemTypeName;
  /** One-line rule for the model */
  rule: string;
  /** Words/phrases that strongly suggest this type */
  signalPhrases: string[];
  /** Regex patterns used by the rule-based analyzer */
  signalPatterns: RegExp[];
  /** Phrases that usually mean it is NOT this type */
  antiSignals: string[];
  /** When this type wins over a close alternative */
  tieBreakers: string[];
};

export type ScoreBand = {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  signalPhrases: string[];
  signalPatterns: RegExp[];
};

export type TagHeuristic = {
  tag: string;
  when: string;
  signalPhrases: string[];
  signalPatterns: RegExp[];
};

/**
 * Future group matching — keyword hints map to group names.
 * resolveCaptureDraft will match these against existing groups when present.
 */
export type GroupHeuristic = {
  groupName: string;
  when: string;
  signalPhrases: string[];
  signalPatterns: RegExp[];
};

export const TYPE_HEURISTICS: TypeHeuristic[] = [
  {
    typeName: 'Journal',
    rule:
      'Personal lived experience — something that happened to me/us, how I felt, or a recap of my day. First-person + past/experiential language.',
    signalPhrases: [
      'today was',
      'today i',
      'my day',
      'i had so much',
      'i felt',
      'we went',
      'we had',
      'i went',
      'i met',
      'dear diary',
      'grateful for',
      'looking back',
      'this morning i',
      'last night i',
      'so much fun',
      'really happening day',
      'mood',
      'reflecting on',
    ],
    signalPatterns: [
      /\btoday was\b/i,
      /\btoday i\b/i,
      /\bmy day\b/i,
      /\bi (had|felt|went|met|enjoyed|loved|hated|realized|learned|noticed)\b/i,
      /\bwe (went|had|met|enjoyed|spent)\b/i,
      /\b(dear diary|grateful for|looking back)\b/i,
      /\b(so much fun|really happening|amazing day|rough day|long day)\b/i,
      /\b(felt|feeling|mood|emotion)\b/i,
    ],
    antiSignals: [
      'is a',
      'refers to',
      'defined as',
      'need to',
      'have to',
      'what if',
      'documentation',
      'specification',
    ],
    tieBreakers: [
      'If the text recounts the author\'s day or feelings → Journal, not Note.',
      'If it says "today was…" or "I had fun" → Journal.',
    ],
  },
  {
    typeName: 'Note',
    rule:
      'Reference material — facts, definitions, how something works, bookmarks, or third-person/common knowledge not about the author\'s experience.',
    signalPhrases: [
      'is a',
      'refers to',
      'defined as',
      'means that',
      'documentation',
      'reference',
      'according to',
      'in summary',
      'key points',
      'security threat',
      'vulnerability',
      'api endpoint',
      'syntax',
      'cheat sheet',
    ],
    signalPatterns: [
      /\b(is a|are a|refers to|defined as|means that|stands for)\b/i,
      /\b(documentation|reference|specification|overview|summary of)\b/i,
      /\b(according to|in general|typically|commonly)\b/i,
      /\b(threat|vulnerability|attack|protocol|algorithm|pattern)\b/i,
      /https?:\/\//i,
    ],
    antiSignals: [
      'today i',
      'my day',
      'need to',
      'remind me',
      'what if',
      'i felt',
    ],
    tieBreakers: [
      'If it explains a subject (e.g. "IDOR is a security threat") without personal narrative → Note.',
      'URLs and factual snippets → Note unless clearly a todo.',
    ],
  },
  {
    typeName: 'Task',
    rule:
      'Action the author intends to take — verbs of obligation, errands, reminders, deadlines, or "I need to / should / must".',
    signalPhrases: [
      'need to',
      'have to',
      'must',
      'should',
      'remind me',
      'todo',
      'to-do',
      'call',
      'email',
      'buy',
      'pick up',
      'submit',
      'finish',
      'complete',
      'schedule',
      'book',
      'pay',
      'send',
      'fix',
      'deadline',
      'due',
      'go to',
      'get to',
    ],
    signalPatterns: [
      /\b(need to|have to|got to|gotta|must|should)\b/i,
      /\b(remind me|todo|to-do|action item)\b/i,
      /\b(call|email|text|message|buy|pick up|submit|finish|complete|send|fix|pay)\b/i,
      /\b(deadline|due|by (monday|tuesday|wednesday|thursday|friday|tomorrow|eod))\b/i,
      /\b(go to|head to|visit|attend|meet with)\b/i,
    ],
    antiSignals: [
      'today was',
      'is a security',
      'defined as',
      'what if we',
      'maybe someday',
    ],
    tieBreakers: [
      'If there is a clear action for the author to perform → Task.',
      'Imperatives like "buy milk" or "call mom" → Task even without "I".',
    ],
  },
  {
    typeName: 'Idea',
    rule:
      'Speculative or exploratory thought — possibilities, brainstorms, "what if", not yet committed to action or reference doc.',
    signalPhrases: [
      'what if',
      'maybe we could',
      'idea:',
      'brainstorm',
      'consider',
      'could try',
      'might work',
      'thought experiment',
      'hypothesis',
      'worth exploring',
      'random thought',
      'someday',
    ],
    signalPatterns: [
      /\bwhat if\b/i,
      /\b(maybe|perhaps|could|might) (we|i|try|build|add|use)\b/i,
      /\b(idea|brainstorm|concept|hypothesis|thought experiment)\b/i,
      /\b(worth exploring|food for thought|random thought)\b/i,
      /\?\s*$/,
    ],
    antiSignals: [
      'need to',
      'deadline',
      'is a',
      'today was',
      'remind me',
    ],
    tieBreakers: [
      'Open-ended speculation without commitment → Idea.',
      'Questions about possibilities → Idea unless clearly a research Note.',
    ],
  },
];

export const URGENCY_HEURISTICS: ScoreBand[] = [
  {
    level: 5,
    label: 'Immediate — do now',
    signalPhrases: ['asap', 'right now', 'immediately', 'urgent', 'emergency'],
    signalPatterns: [/\b(asap|right now|immediately|urgent|emergency)\b/i],
  },
  {
    level: 4,
    label: 'Today',
    signalPhrases: ['today', 'tonight', 'this morning', 'this afternoon', 'eod', 'end of day'],
    signalPatterns: [/\b(today|tonight|this morning|this afternoon|eod|end of day)\b/i],
  },
  {
    level: 3,
    label: 'Soon — this week',
    signalPhrases: ['tomorrow', 'this week', 'soon', 'by friday'],
    signalPatterns: [/\b(tomorrow|this week|soon|by (monday|friday))\b/i],
  },
  {
    level: 2,
    label: 'Later',
    signalPhrases: ['next week', 'when i can', 'eventually', 'no rush'],
    signalPatterns: [/\b(next week|when i can|eventually|no rush|later)\b/i],
  },
  {
    level: 1,
    label: 'Someday / low',
    signalPhrases: ['someday', 'maybe later', 'nice to have'],
    signalPatterns: [/\b(someday|maybe later|nice to have)\b/i],
  },
];

export const IMPORTANCE_HEURISTICS: ScoreBand[] = [
  {
    level: 5,
    label: 'Critical / blocking',
    signalPhrases: ['critical', 'blocking', 'must not fail', 'production down'],
    signalPatterns: [/\b(critical|blocking|must not fail|production down|sev-?1)\b/i],
  },
  {
    level: 4,
    label: 'High — key outcome',
    signalPhrases: ['important', 'essential', 'priority', 'crucial', 'deadline'],
    signalPatterns: [/\b(important|essential|priority|crucial|key|deadline)\b/i],
  },
  {
    level: 3,
    label: 'Moderate',
    signalPhrases: ['should', 'need to', 'would be good'],
    signalPatterns: [/\b(should|need to|would be good)\b/i],
  },
  {
    level: 2,
    label: 'Low',
    signalPhrases: ['nice to have', 'when possible'],
    signalPatterns: [/\b(nice to have|when possible|optional)\b/i],
  },
  {
    level: 1,
    label: 'Minimal',
    signalPhrases: ['if i get time', 'low priority'],
    signalPatterns: [/\b(if i get time|low priority|trivial)\b/i],
  },
];

export const TAG_HEURISTICS: TagHeuristic[] = [
  {
    tag: 'personal',
    when: 'Journal-like or family/social personal context',
    signalPhrases: ['family', 'friend', 'my day', 'felt', 'fun'],
    signalPatterns: [/\b(family|friend|my day|felt|fun|weekend)\b/i],
  },
  {
    tag: 'work',
    when: 'Job, meetings, colleagues, deliverables',
    signalPhrases: ['meeting', 'client', 'deadline', 'sprint', 'boss', 'project'],
    signalPatterns: [/\b(meeting|client|deadline|sprint|boss|project|standup)\b/i],
  },
  {
    tag: 'health',
    when: 'Exercise, medical, wellness',
    signalPhrases: ['doctor', 'gym', 'workout', 'sleep', 'meditation'],
    signalPatterns: [/\b(doctor|gym|workout|sleep|meditation|health)\b/i],
  },
  {
    tag: 'learning',
    when: 'Study, courses, technical reference',
    signalPhrases: ['learn', 'course', 'tutorial', 'documentation', 'security'],
    signalPatterns: [/\b(learn|course|tutorial|documentation|security|study)\b/i],
  },
  {
    tag: 'finance',
    when: 'Money, bills, payments',
    signalPhrases: ['pay', 'bill', 'invoice', 'budget', 'tax'],
    signalPatterns: [/\b(pay|bill|invoice|budget|tax|rent)\b/i],
  },
  {
    tag: 'urgent',
    when: 'Time-sensitive task language (Tasks only)',
    signalPhrases: ['asap', 'urgent', 'deadline', 'right now'],
    signalPatterns: [/\b(asap|urgent|deadline|right now|immediately)\b/i],
  },
  {
    tag: 'link',
    when: 'Contains a URL',
    signalPhrases: [],
    signalPatterns: [/https?:\/\//i],
  },
  {
    tag: 'idea',
    when: 'Speculative capture',
    signalPhrases: ['what if', 'brainstorm', 'maybe'],
    signalPatterns: [/\b(what if|brainstorm|maybe we)\b/i],
  },
];

/** Reserved for future ingress — match against user-created groups by name. */
export const GROUP_HEURISTICS: GroupHeuristic[] = [
  {
    groupName: 'Personal',
    when: 'Life, feelings, social, diary',
    signalPhrases: ['my day', 'family', 'friend', 'felt', 'weekend', 'fun'],
    signalPatterns: [/\b(my day|family|friend|felt|weekend|fun|diary)\b/i],
  },
  {
    groupName: 'Work',
    when: 'Professional tasks and notes',
    signalPhrases: ['meeting', 'client', 'project', 'deadline', 'sprint', 'colleague'],
    signalPatterns: [/\b(meeting|client|project|deadline|sprint|colleague|office)\b/i],
  },
  {
    groupName: 'Health',
    when: 'Medical and fitness',
    signalPhrases: ['doctor', 'gym', 'workout', 'sleep'],
    signalPatterns: [/\b(doctor|gym|workout|sleep|health)\b/i],
  },
  {
    groupName: 'Learning',
    when: 'Study and reference material',
    signalPhrases: ['learn', 'course', 'tutorial', 'documentation', 'security threat'],
    signalPatterns: [/\b(learn|course|tutorial|documentation|security|reference)\b/i],
  },
  {
    groupName: 'Finance',
    when: 'Money-related',
    signalPhrases: ['pay', 'bill', 'invoice', 'budget'],
    signalPatterns: [/\b(pay|bill|invoice|budget|tax)\b/i],
  },
  {
    groupName: 'Ideas',
    when: 'Brainstorm backlog',
    signalPhrases: ['what if', 'brainstorm', 'concept', 'maybe we'],
    signalPatterns: [/\b(what if|brainstorm|concept|maybe we)\b/i],
  },
];

/** Curated examples for the model — include edge cases from product requirements. */
export const HEURISTIC_EXAMPLES: HeuristicExample[] = [
  {
    input: 'today was a really happening day and i had so much fun',
    typeName: 'Journal',
    importance: 2,
    urgency: null,
    tagNames: ['personal'],
    groupNames: ['Personal'],
    rationale: 'First-person recap of the author\'s day and feelings — not reference material.',
  },
  {
    input: 'IDOR is a security threat where attackers access objects by manipulating identifiers',
    typeName: 'Note',
    importance: 3,
    urgency: null,
    tagNames: ['learning'],
    groupNames: ['Learning'],
    rationale: 'Factual definition about a subject — no personal narrative or action item.',
  },
  {
    input: 'remind me to call mom tomorrow — it\'s important',
    typeName: 'Task',
    importance: 4,
    urgency: 3,
    tagNames: ['personal'],
    groupNames: ['Personal'],
    rationale: 'Clear action + relative deadline + high personal importance. Title: "Call mom" only.',
  },
  {
    input: 'i need to go to bank this sunday at 5 its urgent',
    typeName: 'Task',
    importance: 3,
    urgency: 4,
    tagNames: ['personal', 'urgent'],
    groupNames: ['Personal'],
    rationale: 'Action task with weekday deadline and urgency. Title: "Go to bank" — date/time/urgency are metadata, not title.',
  },
  {
    input: 'go to banke tis sunday',
    typeName: 'Task',
    importance: 3,
    urgency: null,
    tagNames: ['personal'],
    groupNames: ['Personal'],
    rationale: 'Speech-to-text typos ("banke", "tis"). Rewrite title as "Go to bank" — fix spelling/grammar, strip date to due_at.',
  },
  {
    input: 'what if we added offline sync with conflict resolution?',
    typeName: 'Idea',
    importance: 3,
    urgency: null,
    tagNames: ['idea', 'work'],
    groupNames: ['Ideas', 'Work'],
    rationale: 'Speculative product thought — not committed work yet.',
  },
  {
    input: 'buy groceries: milk, eggs, bread before Friday',
    typeName: 'Task',
    importance: 2,
    urgency: 3,
    tagNames: ['personal'],
    groupNames: ['Personal'],
    rationale: 'Errand list with implicit deadline.',
  },
  {
    input: 'https://owasp.org/www-project-top-ten/ — good security checklist',
    typeName: 'Note',
    importance: null,
    urgency: null,
    tagNames: ['link', 'learning'],
    groupNames: ['Learning'],
    rationale: 'Bookmark + short annotation → Note with Visitable behavior.',
  },
];

function matchScore(text: string, patterns: RegExp[], phrases: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const p of patterns) {
    if (p.test(text)) score += 2;
  }
  for (const phrase of phrases) {
    if (lower.includes(phrase.toLowerCase())) score += 1;
  }
  return score;
}

function antiScore(text: string, antiSignals: string[]): number {
  const lower = text.toLowerCase();
  return antiSignals.reduce((n, s) => (lower.includes(s.toLowerCase()) ? n + 2 : n), 0);
}

export function scoreTypeFromGuide(text: string): Record<ItemTypeName, number> {
  const scores: Record<ItemTypeName, number> = { Task: 0, Note: 0, Journal: 0, Idea: 0 };

  for (const rule of TYPE_HEURISTICS) {
    scores[rule.typeName] += matchScore(text, rule.signalPatterns, rule.signalPhrases);
    scores[rule.typeName] -= antiScore(text, rule.antiSignals);
  }

  return scores;
}

export function inferTypeFromGuide(text: string): ItemTypeName {
  const scores = scoreTypeFromGuide(text);
  const ranked = (Object.entries(scores) as [ItemTypeName, number][]).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] <= 0) return 'Note';
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
    // Tie-break: prefer Journal for personal day language, Note for definitional
    if (/\btoday was\b/i.test(text) || /\bi had so much\b/i.test(text)) return 'Journal';
    if (/\bis a\b/i.test(text) || /\bdefined as\b/i.test(text)) return 'Note';
  }
  return ranked[0][0];
}

function scoreFromBands(text: string, bands: ScoreBand[]): number | null {
  for (const band of bands) {
    if (matchScore(text, band.signalPatterns, band.signalPhrases) > 0) {
      return band.level;
    }
  }
  return null;
}

export function inferUrgencyFromGuide(text: string, typeName: ItemTypeName): number | null {
  if (typeName !== 'Task') return null;
  return scoreFromBands(text, URGENCY_HEURISTICS);
}

export function inferImportanceFromGuide(text: string, typeName: ItemTypeName): number | null {
  const scored = scoreFromBands(text, IMPORTANCE_HEURISTICS);
  if (scored != null) return scored;
  if (typeName === 'Journal') return 2;
  if (typeName === 'Task') return 3;
  return null;
}

export function inferTagsFromGuide(text: string, typeName: ItemTypeName): string[] {
  const tags = new Set<string>();
  for (const rule of TAG_HEURISTICS) {
    if (rule.tag === 'urgent' && typeName !== 'Task') continue;
    if (matchScore(text, rule.signalPatterns, rule.signalPhrases) > 0) {
      tags.add(rule.tag);
    }
  }
  if (typeName === 'Idea') tags.add('idea');
  if (typeName === 'Journal') tags.add('personal');
  return Array.from(tags).slice(0, 5);
}

export function inferGroupsFromGuide(text: string): string[] {
  const groups: string[] = [];
  for (const rule of GROUP_HEURISTICS) {
    if (matchScore(text, rule.signalPatterns, rule.signalPhrases) > 0) {
      groups.push(rule.groupName);
    }
  }
  return groups.slice(0, 3);
}

/** Full reference block injected into the LLM system prompt. */
export function formatHeuristicsGuideForPrompt(): string {
  const typeBlock = TYPE_HEURISTICS.map(
    (t) =>
      `### ${t.typeName}\n${t.rule}\nSignals: ${t.signalPhrases.slice(0, 12).join(', ')}${t.signalPhrases.length > 12 ? ', …' : ''}\nAvoid when: ${t.antiSignals.join(', ')}\nTie-breakers: ${t.tieBreakers.join(' ')}`,
  ).join('\n\n');

  const urgencyBlock = URGENCY_HEURISTICS.map(
    (b) => `- ${b.level} (${b.label}): ${b.signalPhrases.join(', ')}`,
  ).join('\n');

  const importanceBlock = IMPORTANCE_HEURISTICS.map(
    (b) => `- ${b.level} (${b.label}): ${b.signalPhrases.join(', ')}`,
  ).join('\n');

  const tagBlock = TAG_HEURISTICS.map((t) => `- #${t.tag}: ${t.when}`).join('\n');

  const groupBlock = GROUP_HEURISTICS.map(
    (g) => `- "${g.groupName}": ${g.when} (signals: ${g.signalPhrases.slice(0, 6).join(', ')})`,
  ).join('\n');

  const exampleBlock = HEURISTIC_EXAMPLES.map(
    (ex) =>
      `Input: "${ex.input}"\n→ typeName: ${ex.typeName}, importance: ${ex.importance ?? 'null'}, urgency: ${ex.urgency ?? 'null'}, tagNames: [${ex.tagNames.map((t) => `"${t}"`).join(', ')}], groupNames: [${ex.groupNames.map((g) => `"${g}"`).join(', ')}]\nWhy: ${ex.rationale}`,
  ).join('\n\n');

  return `CLASSIFICATION HEURISTICS (use these rules; user may override type in UI later)

TYPE RULES:
${typeBlock}

URGENCY (Tasks only, 1–5 or null):
${urgencyBlock}

IMPORTANCE (1–5 or null):
${importanceBlock}

TAGS (short lowercase labels, 0–5 tags):
${tagBlock}

GROUPS (match existing group names when possible; empty array if none fit):
${groupBlock}

WORKED EXAMPLES:
${exampleBlock}`;
}
