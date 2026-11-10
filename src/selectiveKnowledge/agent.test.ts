import {NoTypeError, rawThought, runSelectiveAgent, titleFromText, type Complete} from './agent';

const now = new Date(2026, 9, 31, 10, 0); // Sat 31 Oct 2026, 10:00 local
const text = 'I need to go to gym tomorrow, at 6 pm, and hit those leg muscles';

/** Fake model: answers by which knowledge file the step loaded. */
function fakeModel(answers: Record<string, string>): Complete {
  return async messages => {
    const system = messages[0].content;
    if (system.startsWith('Is this something the user still has to DO')) return answers.type === 'Task' ? 'yes' : 'no';
    if (system.startsWith("Is the user telling about their own day")) return answers.type === 'Journal' ? 'yes' : 'no';
    if (system.startsWith('Should this come back')) return answers.comesBack ?? 'no';
    if (system.startsWith('Write a short title')) return answers.title;
    if (system.startsWith("Rewrite the user's text")) return answers.description ?? '';
    if (system.startsWith('How pressing')) return answers.priority ?? 'normal';
    if (system.startsWith('Does this item clearly belong')) return answers.group ?? 'NONE';
    if (system.startsWith('Pick the sticker')) return answers.mascot ?? 'done';
    throw new Error('unknown step');
  };
}
const gymAnswers = {type: 'Task', title: 'Go to gym', description: 'I need to go to the gym tomorrow at 6 pm and hit those leg muscles.'};

test('a task: model judges it, writes title and description; the date is read from the words', async () => {
  const {draft, journey} = await runSelectiveAgent(text, fakeModel(gymAnswers), {now});
  expect(draft.typeName).toBe('Task');
  expect(draft.title).toBe('Go to gym');
  expect(draft.content).toBe('I need to go to the gym tomorrow at 6 pm and hit those leg muscles.');
  expect(new Date(draft.behaviorData!.Doable.due_at).getTime()).toBe(new Date(2026, 10, 1, 18, 0).getTime());
  expect(draft.behaviorData!.Doable.due_at).not.toMatch(/Z$/); // stored with local offset, not UTC
  expect(journey[0]).toBe('thought: something to do (your words: todo)'); // a date said = to do, no model needed
});

test('no type from the model is an error (retried later)', async () => {
  const broken: Complete = async () => {
    throw new Error('model crashed');
  };
  await expect(runSelectiveAgent('withdraw cash', broken, {now})).rejects.toBeInstanceOf(NoTypeError);
});

test('a title or description with words the user never said is replaced by their own words', async () => {
  const {draft} = await runSelectiveAgent(
    'fix the leaking tap in the kitchen',
    fakeModel({type: 'Task', title: 'Fix the leaky faucet', description: 'Fix the tap by checking for water damage.'}),
    {now},
  );
  expect(draft.title).toBe('Fix the leaking tap');
  expect(draft.content).toBe('Fix the leaking tap in the kitchen');
});

test('dates never stay in the title', async () => {
  const {draft} = await runSelectiveAgent('dentist appointment on friday at 3pm', fakeModel({type: 'Task', title: 'Dentist appointment on Friday at 3 pm'}), {now});
  expect(draft.title).toBe('Dentist appointment');
});

test('nothing beyond the title: no description', async () => {
  const {draft} = await runSelectiveAgent('buy groceries', fakeModel({type: 'Task', title: 'Buy groceries', description: 'Buy groceries.'}), {now});
  expect(draft.content).toBeNull();
});

test('no ghost facts: a plain task gets no date, repeat, reminder or steps whatever the model would say', async () => {
  const {draft} = await runSelectiveAgent('pick up the laundry', fakeModel({type: 'Task', title: 'Pick up laundry'}), {now});
  expect(draft.behaviorData).toEqual({Doable: {status: 'pending', due_at: '', estimated_minutes: ''}});
  expect(draft.optionalBehaviorNames).toEqual([]);
});

test('repeat, reminder and steps come from the words the user said', async () => {
  const {draft} = await runSelectiveAgent(
    'gym every monday and thursday at 7am, remind me 10 minutes before',
    fakeModel({type: 'Task', title: 'Gym'}),
    {now},
  );
  expect(draft.behaviorData?.Repeatable?.days).toBe('[1,4]');
  expect(draft.behaviorData?.Remindable?.offsets).toBe('[10]');
  expect(new Date(draft.behaviorData!.Doable.due_at).getTime()).toBe(new Date(2026, 10, 2, 7, 0).getTime());
});

test('priority is a fixed choice', async () => {
  const {draft} = await runSelectiveAgent('urgent: fix the login bug', fakeModel({type: 'Task', title: 'Fix login bug', priority: 'urgent'}), {now});
  expect([draft.urgency, draft.importance]).toEqual([5, null]);
});

test('raw thought keeps the exact words as a Note', () => {
  expect(rawThought('buy milk')).toMatchObject({typeName: 'Note', title: 'buy milk', content: 'buy milk'});
});

test('group step picks an existing group and ignores made-up ones', async () => {
  const groups = [{name: 'Gym', description: 'workouts, diet'}, {name: 'Work'}];
  const answers = {type: 'Task', title: 'Go to gym', description: 'NONE', datetime: 'NONE'};
  const picked = await runSelectiveAgent(text, fakeModel({...answers, group: 'gym'}), {now, groups});
  expect(picked.draft.groupNames).toEqual(['Gym']);
  const invented = await runSelectiveAgent(text, fakeModel({...answers, group: 'Fitness'}), {now, groups});
  expect(invented.draft.groupNames).not.toContain('Fitness');
});

test('no group when the model forces one that does not fit the text', async () => {
  const groups = [{name: 'Gym', description: 'workouts, diet'}];
  const answers = {type: 'Task', title: 'Buy milk', description: 'NONE', datetime: 'NONE', group: 'Gym'};
  const {draft} = await runSelectiveAgent('buy milk today', fakeModel(answers), {now, groups});
  expect(draft.groupNames).toEqual([]);
});

test('sticker: one of the fixed list, or none', async () => {
  const picked = await runSelectiveAgent('gym tomorrow at 7am', fakeModel({type: 'Task', title: 'Gym', mascot: 'workout'}), {now});
  expect(picked.draft.mascot).toBe('workout');
  const unknown = await runSelectiveAgent('gym tomorrow at 7am', fakeModel({type: 'Task', title: 'Gym', mascot: 'dragon'}), {now});
  expect(unknown.draft.mascot).toBeNull();
});

test('everything is a thought: the judgments decide the label and what is attached', async () => {
  const todo = await runSelectiveAgent('pick up the laundry', fakeModel({type: 'Task', title: 'Pick up laundry'}), {now});
  expect(todo.draft.typeName).toBe('Task');
  const day = await runSelectiveAgent('lunch with mom was lovely', fakeModel({type: 'Journal', title: 'Lunch with mom'}), {now});
  expect(day.draft.typeName).toBe('Journal');
  const idea = await runSelectiveAgent('what if cars could fly', fakeModel({type: 'Note', title: 'Flying cars', comesBack: 'yes'}), {now});
  expect([idea.draft.typeName, idea.draft.optionalBehaviorNames]).toEqual(['Note', ['Memorable']]);
  const fact = await runSelectiveAgent('my locker code is 4471', fakeModel({type: 'Note', title: 'Locker code'}), {now});
  expect([fact.draft.typeName, fact.draft.optionalBehaviorNames]).toEqual(['Note', []]);
});

test('a task is never asked about its day or coming back (one model call for the kind)', async () => {
  const asked: string[] = [];
  const model: Complete = async messages => {
    asked.push(messages[0].content.slice(0, 12));
    return messages[0].content.startsWith('Is this something') ? 'yes' : '';
  };
  await runSelectiveAgent('gym tomorrow', model, {now});
  expect(asked.filter(q => q.startsWith('Is the user') || q.startsWith('Should this'))).toEqual([]);
});

test('a to-do the model only guessed is marked unsure; one your words make clear is not', async () => {
  const guessed = await runSelectiveAgent('withdraw cash', fakeModel({type: 'Task', title: 'Withdraw cash'}), {now});
  expect([guessed.draft.typeName, guessed.draft.unsure]).toEqual(['Task', true]);
  const said = await runSelectiveAgent('withdraw cash tomorrow at 10', fakeModel({type: 'Note', title: 'Withdraw cash'}), {now});
  expect([said.draft.typeName, said.draft.unsure]).toEqual(['Task', false]);
  const fact = await runSelectiveAgent('Jatins number is 9893731864', fakeModel({type: 'Task', title: 'Jatins number'}), {now});
  expect(fact.draft.typeName).toBe('Note'); // the model said task; the words say fact
});

test('the fallback title drops a leading "idea:"', () => {
  expect(titleFromText('idea: an app that turns voice notes into tasks')).toBe('An app that turns voice notes');
});

test('your pick when sharing decides, not the model', async () => {
  const model = fakeModel({type: 'Task', title: 'React tips', comesBack: 'no'});
  const read = await runSelectiveAgent('great article https://example.com/react-tips', model, {now, kind: 'read'});
  expect([read.draft.typeName, read.draft.optionalBehaviorNames]).toEqual(['Note', expect.arrayContaining(['Memorable', 'Visitable'])]);
  const readTomorrow = await runSelectiveAgent('tomorrow great article https://example.com/react-tips', model, {now, kind: 'read'});
  expect(readTomorrow.draft.typeName).toBe('Task'); // said when → a to-do
  const keep = await runSelectiveAgent('wifi is orange77', fakeModel({type: 'Task', title: 'Wifi'}), {now, kind: 'keep'});
  expect([keep.draft.typeName, keep.draft.optionalBehaviorNames]).toEqual(['Note', []]);
});
