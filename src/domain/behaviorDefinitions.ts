export type FieldInput = 'text' | 'url' | 'number' | 'datetime' | 'select';

export type BehaviorFieldDef = {
  name: string;
  label: string;
  input: FieldInput;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export type BehaviorDefinition = {
  name: string;
  tableName: string | null;
  fields: BehaviorFieldDef[];
};

const DOABLE_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const INTERVAL_UNIT_OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export const BEHAVIOR_DEFINITIONS: Record<string, BehaviorDefinition> = {
  Doable: {
    name: 'Doable',
    tableName: 'doable_items',
    fields: [
      {
        name: 'status',
        label: 'Status',
        input: 'select',
        required: true,
        options: DOABLE_STATUS_OPTIONS,
      },
      { name: 'due_at', label: 'Due', input: 'datetime', placeholder: 'e.g. Sunday, Sep 28 at 5:00 PM' },
      { name: 'estimated_minutes', label: 'Estimated time (min)', input: 'number', placeholder: '30' },
    ],
  },
  Notable: {
    name: 'Notable',
    tableName: null,
    fields: [],
  },
  Memorable: {
    name: 'Memorable',
    tableName: 'memorable_items',
    fields: [
      { name: 'review_at', label: 'Review at', input: 'datetime', placeholder: 'e.g. Mon, Sep 29' },
      { name: 'last_reviewed_at', label: 'Last reviewed', input: 'datetime', placeholder: 'e.g. Mon, Sep 29' },
    ],
  },
  Visitable: {
    name: 'Visitable',
    tableName: 'visitable_items',
    fields: [
      { name: 'url', label: 'Link', input: 'url', required: true, placeholder: 'https://...' },
      { name: 'title', label: 'Link title', input: 'text', placeholder: 'Optional title' },
    ],
  },
  Repeatable: {
    name: 'Repeatable',
    tableName: 'repeatable_items',
    fields: [
      { name: 'interval_value', label: 'Repeat every', input: 'number', required: true, placeholder: '1' },
      {
        name: 'interval_unit',
        label: 'Interval unit',
        input: 'select',
        required: true,
        options: INTERVAL_UNIT_OPTIONS,
      },
      { name: 'next_occurrence_at', label: 'Next occurrence', input: 'datetime', placeholder: 'e.g. Mon, Sep 29' },
      { name: 'start_at', label: 'Starts', input: 'datetime', placeholder: 'e.g. Mon, Sep 29' },
      { name: 'end_at', label: 'Ends', input: 'datetime', placeholder: 'e.g. Mon, Sep 29' },
    ],
  },
  Trackable: {
    name: 'Trackable',
    tableName: 'trackable_items',
    fields: [
      { name: 'current_value', label: 'Current', input: 'number', placeholder: '0' },
      { name: 'target_value', label: 'Target', input: 'number', placeholder: '100' },
      { name: 'unit', label: 'Unit', input: 'text', placeholder: 'km, pages, ...' },
    ],
  },
  Schedulable: {
    name: 'Schedulable',
    tableName: 'schedulable_items',
    fields: [
      { name: 'starts_at', label: 'Starts', input: 'datetime', placeholder: 'e.g. Sun, Sep 28 at 5:00 PM' },
      { name: 'ends_at', label: 'Ends', input: 'datetime', placeholder: 'e.g. Sun, Sep 28 at 6:00 PM' },
      { name: 'timezone', label: 'Timezone', input: 'text', placeholder: 'Asia/Kolkata' },
    ],
  },
};

export const ALL_BEHAVIOR_NAMES = Object.keys(BEHAVIOR_DEFINITIONS);

export function getBehaviorDefinition(name: string): BehaviorDefinition | undefined {
  return BEHAVIOR_DEFINITIONS[name];
}

export function behaviorHasFields(name: string): boolean {
  const def = getBehaviorDefinition(name);
  return (def?.fields.length ?? 0) > 0;
}

export function getDefaultFieldValues(name: string): Record<string, string> {
  const def = getBehaviorDefinition(name);
  if (!def) return {};

  const values: Record<string, string> = {};
  for (const field of def.fields) {
    if (field.input === 'select' && field.options?.[0]) {
      values[field.name] = field.options[0].value;
    } else if (field.name === 'status') {
      values[field.name] = 'pending';
    } else if (field.name === 'interval_unit') {
      values[field.name] = 'week';
    } else if (field.name === 'interval_value') {
      values[field.name] = '1';
    } else {
      values[field.name] = '';
    }
  }
  return values;
}
