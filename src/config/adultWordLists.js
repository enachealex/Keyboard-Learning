/** Word and drill content for adult typing lessons and tests. */

export const ADULT_WORDS_EASY = [
  'the', 'and', 'for', 'you', 'work', 'email', 'type', 'file', 'home', 'help',
  'time', 'day', 'week', 'task', 'note', 'read', 'send', 'open', 'save', 'click',
];

export const ADULT_WORDS_MEDIUM = [
  'keyboard', 'computer', 'practice', 'document', 'meeting', 'schedule',
  'password', 'internet', 'browser', 'download', 'project', 'update',
  'message', 'folder', 'desktop', 'window', 'cursor', 'pointer', 'scroll',
];

export const ADULT_WORDS_HARD = [
  'please review the document',
  'schedule a meeting tomorrow',
  'update the project files',
  'send the weekly report',
  'check your email inbox',
  'save your work frequently',
  'use proper typing posture',
  'practice builds muscle memory',
];

export const ADULT_WORD_POOLS = {
  easy: ADULT_WORDS_EASY,
  medium: ADULT_WORDS_MEDIUM,
  hard: ADULT_WORDS_HARD,
};

export const HOME_ROW_SEQUENCES_EASY = [
  'asdf', 'jkl;', 'fff', 'jjj', 'aaa', 'lll', 'sss', 'ddd',
];

export const HOME_ROW_SEQUENCES_MEDIUM = [
  'asdf jkl;', 'fad fad', 'jkl jkl', 'sad lad', 'flak', 'ask fall',
  'all sad', 'dad lad', 'silk flask',
];

export const HOME_ROW_SEQUENCES_HARD = [
  'asdf jkl; asdf', 'flask sad lad', 'ask dad fall', 'all silk flask',
  'sad lad ask dad', 'fall flask all sad',
];

export const HOME_ROW_POOLS = {
  easy: HOME_ROW_SEQUENCES_EASY,
  medium: HOME_ROW_SEQUENCES_MEDIUM,
  hard: HOME_ROW_SEQUENCES_HARD,
};
