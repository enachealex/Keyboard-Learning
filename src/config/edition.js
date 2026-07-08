/**
 * Build-time edition flag — one codebase, two apps.
 *
 * Web (default): the free version for parents and kids at home.
 * School (`vite --mode school`, via .env.school): adds class rosters,
 * student sign-in, teacher management, and grade-band progression.
 */
export const EDITION = import.meta.env?.VITE_EDITION === 'school' ? 'school' : 'web';

export const IS_SCHOOL = EDITION === 'school';
