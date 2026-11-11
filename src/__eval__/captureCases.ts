/**
 * Real-style brain dumps and the exact result we expect. "Now" for every case: Saturday 31 Oct 2026, 10:00 local.
 * Every case states its whole answer: anything the model adds that the user never said (a date, a repeat,
 * a reminder, steps) is scored as a failure, not ignored.
 */
export const EVAL_NOW = new Date(2026, 9, 31, 10, 0);

export type Due = 'none' | 'any' | {date: string; time?: string};

export type CaptureCase = {
  text: string;
  type: 'Task' | 'Note' | 'Idea' | 'Journal';
  /** Every word must appear in the title (case-insensitive). */
  title?: string[];
  /** Tasks only. Default: 'none' (no date was said). */
  due?: Due;
  /** Default: no repeat. */
  repeat?: {unit: 'day' | 'week' | 'month'; days?: number[]};
  /** Minutes before. Default: no reminder. */
  remind?: number[];
  /** Default: no steps. */
  steps?: number;
  priority?: 'urgent' | 'important' | 'normal';
  url?: string;
  /** Should it come back later? (Ideas: yes by default.) */
  comesBack?: boolean;
};

export const CAPTURE_CASES: CaptureCase[] = [
  // Tasks with a date / time
  {text: 'gym tomorrow at 7am', type: 'Task', title: ['gym'], due: {date: '2026-11-01', time: '07:00'}},
  {text: 'call mom tonight at 8', type: 'Task', title: ['call', 'mom'], due: {date: '2026-10-31', time: '20:00'}},
  {text: 'I need to submit the tax form by monday', type: 'Task', title: ['tax'], due: {date: '2026-11-02'}},
  {text: 'dentist appointment on friday at 3pm', type: 'Task', title: ['dentist'], due: {date: '2026-11-06', time: '15:00'}},
  {text: 'pay rent by nov 12', type: 'Task', title: ['rent'], due: {date: '2026-11-12'}},
  {text: 'submit the report next week', type: 'Task', title: ['report'], due: 'any'},
  {text: 'buy milk in 2 hours', type: 'Task', title: ['milk'], due: {date: '2026-10-31', time: '12:00'}},
  {text: 'book flight tickets this weekend', type: 'Task', title: ['flight'], due: 'any'},
  {text: 'meeting with Rahul at 4:30 pm today', type: 'Task', title: ['rahul'], due: {date: '2026-10-31', time: '16:30'}},
  {text: 'finish the slides before wednesday', type: 'Task', title: ['slides'], due: {date: '2026-11-04'}},
  {text: 'call the bank at 5', type: 'Task', title: ['bank'], due: {date: '2026-10-31', time: '17:00'}},
  {text: 'water the plants in 3 days', type: 'Task', title: ['plants'], due: {date: '2026-11-03'}},
  {text: 'next friday team dinner at 8pm', type: 'Task', title: ['dinner'], due: {date: '2026-11-06', time: '20:00'}},

  // Tasks with no date
  {text: 'buy groceries', type: 'Task', title: ['groceries']},
  {text: 'fix the leaking tap in the kitchen', type: 'Task', title: ['tap']},
  {text: 'renew my passport', type: 'Task', title: ['passport']},
  {text: 'email Priya about the contract', type: 'Task', title: ['priya']},
  {text: 'pick up the laundry', type: 'Task', title: ['laundry'], priority: 'normal'},

  // Priority
  {text: 'urgent: fix the login bug in production', type: 'Task', title: ['login'], priority: 'urgent'},
  {text: 'really important that I send the visa documents', type: 'Task', title: ['visa'], priority: 'important'},

  // Repeating
  {text: 'go to the gym every monday and thursday at 7am', type: 'Task', title: ['gym'], due: 'any', repeat: {unit: 'week', days: [1, 4]}},
  {text: 'take vitamins every day', type: 'Task', title: ['vitamins'], due: 'any', repeat: {unit: 'day'}},
  {text: 'pay the credit card bill monthly', type: 'Task', title: ['credit', 'card'], due: 'any', repeat: {unit: 'month'}},
  {text: 'weekly review every sunday evening', type: 'Task', title: ['review'], due: 'any', repeat: {unit: 'week', days: [0]}},
  {text: 'call grandma on weekends', type: 'Task', title: ['grandma'], due: 'any', repeat: {unit: 'week', days: [0, 6]}},

  // Reminders
  {text: 'doctor appointment tomorrow at 11am, remind me 1 hour before', type: 'Task', title: ['doctor'], due: {date: '2026-11-01', time: '11:00'}, remind: [60]},
  {text: 'flight at 6pm today, remind me 2 hours before', type: 'Task', title: ['flight'], due: {date: '2026-10-31', time: '18:00'}, remind: [120]},
  {text: 'standup at 9:30 tomorrow, remind me 10 minutes before', type: 'Task', title: ['standup'], due: {date: '2026-11-01', time: '09:30'}, remind: [10]},

  // Steps
  {text: 'plan the party: book the venue, order the cake, send invites', type: 'Task', title: ['party'], steps: 3},
  {text: 'set up the new laptop then install vscode then copy my dotfiles', type: 'Task', title: ['laptop'], steps: 3},

  // Notes
  {text: 'the wifi password at the office is bluefox42', type: 'Note', title: ['wifi'], comesBack: false},
  {text: 'vector databases store embeddings for similarity search', type: 'Note', title: ['vector']},
  {text: 'https://example.com/react-tips great article on react performance', type: 'Note', url: 'https://example.com/react-tips', comesBack: true},
  {text: "Rahul's shoe size is 10", type: 'Note', title: ['rahul'], comesBack: false},

  // Ideas
  {text: 'idea: an app that turns voice notes into tasks', type: 'Idea', title: ['voice']},
  {text: 'what if we added dark mode to the landing page', type: 'Idea', title: ['dark', 'mode']},
  {text: 'maybe start a podcast about productivity', type: 'Idea', title: ['podcast']},

  // Journal
  {text: 'today was rough, slept badly and skipped the gym', type: 'Journal'},
  {text: 'had a great dinner with friends, felt really happy', type: 'Journal'},
  {text: 'I felt anxious before the presentation but it went well', type: 'Journal'},
];

/** One dump → how many separate items it should become. More = items the user never asked for. */
export const SPLIT_CASES: {text: string; parts: number}[] = [
  {text: 'buy milk, call mom and book the dentist for tomorrow', parts: 1},
  {text: 'protein shake after gym. btw what is a vector database', parts: 2},
  {text: 'remind me to pay rent on friday also need to call the plumber', parts: 2},
  {text: 'had a long day at work, need to finish the slides tomorrow', parts: 1},
  {text: 'buy milk call mom book dentist', parts: 1},
  {text: 'call mom tomorrow', parts: 1},
  {text: 'I need to go to the gym tomorrow at 6 pm and hit legs', parts: 1},
  {text: 'finish the quarterly report and send it to the manager by friday', parts: 1},
  {text: 'pick up the kids from school and buy bread on the way', parts: 1},
  {text: 'the meeting went well and the client liked the demo', parts: 1},
];
