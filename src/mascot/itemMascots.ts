/**
 * Item stickers: assets/images/mascot-tasks.png, a 4×5 grid of 20 poses, row by row in this order.
 * The capture model picks one per item (fixed list, so it can only answer one of these). The hint is what the model reads.
 */
export const ITEM_MASCOTS = {
  work: 'work, laptop, emails, coding, office, meeting, report',
  relax: 'rest, break, stretching, a day off',
  meditate: 'meditation, yoga, calm, breathing, mindfulness',
  hydrate: 'drinking water, coffee, tea, a drink',
  sleep: 'sleep, nap, bedtime, tired',
  study: 'study, reading, writing, notes, learning, homework, journaling',
  done: 'checklist, errands, chores, paperwork, bills, forms, admin',
  cook: 'cooking, recipes, kitchen, meal prep, baking',
  workout: 'gym, exercise, running, sports, workout',
  eat: 'eating, food, lunch, dinner, restaurant, groceries',
  laundry: 'laundry, cleaning, washing, tidying the house',
  browse: 'browsing, shopping online, articles, a link to read',
  music: 'music, podcast, listening, songs',
  stress: 'stress, worry, problem, bug, deadline pressure, feeling bad',
  goal: 'goals, targets, focus, ambition, an important aim',
  plan: 'planning, calendar, appointment, schedule, booking',
  pet: 'pets, cat, dog, love, family, friends, feelings of joy',
  chat: 'call, text, message, email someone, talk to a person',
  idea: 'ideas, what if, brainstorming, inspiration',
  night: 'night, evening, late, dreams',
} as const;

export type ItemMascot = keyof typeof ITEM_MASCOTS;

export const ITEM_MASCOT_KEYS = Object.keys(ITEM_MASCOTS) as ItemMascot[];

export const isItemMascot = (value: unknown): value is ItemMascot => typeof value === 'string' && value in ITEM_MASCOTS;

/** Sheet geometry (px). */
export const ITEM_SHEET = {width: 1229, height: 1280, cols: 4, rows: 5};
