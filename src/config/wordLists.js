export const LETTERS_EASY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const LETTERS_MEDIUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const LETTERS_HARD = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '.', ',', '!', '?',
].join('').split('');

export const WORDS_EASY = [
  'cat', 'dog', 'sun', 'hat', 'cup', 'bug', 'red', 'big', 'run', 'fun',
  'map', 'pen', 'box', 'fox', 'jam', 'web', 'log', 'mud', 'egg', 'ice',
];

export const WORDS_MEDIUM = [
  'apple', 'house', 'water', 'happy', 'green', 'mouse', 'plant', 'cloud',
  'beach', 'dance', 'fruit', 'light', 'piano', 'smile', 'train', 'world',
  'bread', 'chair', 'dream', 'flame', 'grape', 'heart', 'juice', 'kite',
];

export const PHRASES_HARD = [
  'the cat ran',
  'a big red dog',
  'sun and fun',
  'i like cats',
  'we can run',
  'my pet fox',
  'hot summer day',
  'blue sky above',
  'fast brown fox',
  'happy kids play',
];

export const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

export const TOP_ROW = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];

export const KEY_EXPLORER_KEYS = {
  easy: LETTERS_EASY.slice(0, 10),
  medium: HOME_ROW,
  hard: [...HOME_ROW, ...TOP_ROW],
};

export const COLORS = [
  { name: 'Red', hex: '#e74c3c', emoji: '🔴' },
  { name: 'Blue', hex: '#3498db', emoji: '🔵' },
  { name: 'Green', hex: '#2ecc71', emoji: '🟢' },
  { name: 'Yellow', hex: '#f1c40f', emoji: '🟡' },
  { name: 'Purple', hex: '#9b59b6', emoji: '🟣' },
  { name: 'Orange', hex: '#e67e22', emoji: '🟠' },
];

export const CRITTERS = ['🐸', '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯'];

export const KEY_NINJA_MEDIUM = [
  ...'asdfghjklqwertyuiop',
];

export const KEY_NINJA_HARD = [
  ...'abcdefghijklmnopqrstuvwxyz',
  ...'0123456789',
];

/** { parts: string[], answer: string, distractors: string[] } — null in parts = blank */
export const SENTENCE_CLUES_EASY = [
  { parts: ['The', null, 'sat on the mat.'], answer: 'cat', distractors: ['dog', 'sun'] },
  { parts: ['I see a big', null, 'ball.'], answer: 'red', distractors: ['cat', 'run'] },
  { parts: ['The', null, 'likes to run.'], answer: 'dog', distractors: ['hat', 'bug'] },
  { parts: ['We had', null, 'at the park.'], answer: 'fun', distractors: ['sun', 'mud'] },
  { parts: ['I wear a', null, 'on my head.'], answer: 'hat', distractors: ['cup', 'fox'] },
  { parts: ['The sun is', null, 'today.'], answer: 'hot', distractors: ['big', 'red'] },
  { parts: ['I can', null, 'very fast.'], answer: 'run', distractors: ['jam', 'egg'] },
  { parts: ['My pet', null, 'is soft.'], answer: 'cat', distractors: ['box', 'pen'] },
  { parts: ['The little', null, 'went to sleep.'], answer: 'dog', distractors: ['map', 'ice'] },
  { parts: ['I drink from a', null, '.'], answer: 'cup', distractors: ['log', 'web'] },
];

export const SENTENCE_CLUES_MEDIUM = [
  { parts: ['The', null, 'is green and tall.'], answer: 'plant', distractors: ['chair', 'beach', 'train'] },
  { parts: ['I ate a juicy', null, 'for lunch.'], answer: 'apple', distractors: ['cloud', 'dance', 'world'] },
  { parts: ['We played on the', null, 'all day.'], answer: 'beach', distractors: ['house', 'juice', 'smile'] },
  { parts: ['She has a happy', null, 'on her face.'], answer: 'smile', distractors: ['mouse', 'bread', 'flame'] },
  { parts: ['The', null, 'fell from the sky.'], answer: 'rain', distractors: ['happy', 'green', 'piano'] },
  { parts: ['I heard music from a', null, '.'], answer: 'piano', distractors: ['water', 'fruit', 'light'] },
  { parts: ['We sat on a wooden', null, '.'], answer: 'chair', distractors: ['dream', 'grape', 'heart'] },
  { parts: ['The bright', null, 'shone at night.'], answer: 'moon', distractors: ['plant', 'dance', 'bread'] },
  { parts: ['I packed a', null, 'for the trip.'], answer: 'kite', distractors: ['mouse', 'cloud', 'juice'] },
  { parts: ['Fresh', null, 'smells so good.'], answer: 'bread', distractors: ['train', 'beach', 'world'] },
];

export const SENTENCE_CLUES_HARD = [
  { parts: ['The quick brown', null, 'jumped over the fence.'], answer: 'fox', distractors: ['cloud', 'piano', 'dream', 'juice'] },
  { parts: ['Reading a good', null, 'is my favorite hobby.'], answer: 'book', distractors: ['chair', 'beach', 'grape', 'flame'] },
  { parts: ['We watched the', null, 'set behind the hills.'], answer: 'sun', distractors: ['smile', 'bread', 'plant', 'kite'] },
  { parts: ['The astronaut explored a distant', null, '.'], answer: 'planet', distractors: ['happy', 'mouse', 'fruit', 'light'] },
  { parts: ['She wrote a letter with her favorite', null, '.'], answer: 'pen', distractors: ['water', 'dance', 'heart', 'world'] },
  { parts: ['The orchestra played a beautiful', null, '.'], answer: 'song', distractors: ['house', 'green', 'train', 'apple'] },
  { parts: ['After the storm we saw a bright', null, '.'], answer: 'rainbow', distractors: ['chair', 'beach', 'smile', 'bread'] },
  { parts: ['The scientist made an amazing', null, '.'], answer: 'discovery', distractors: ['juice', 'cloud', 'flame', 'kite'] },
];
