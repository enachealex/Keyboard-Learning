/**
 * The school kit — everything school-specific, bundled as one lazy chunk.
 *
 * The school build loads it at startup; the free web app only fetches it
 * when someone actually enters School mode, so the main web bundle ships
 * no school code.
 */
export { RosterStore } from '../app/RosterStore.js';
export { TeacherContentStore, customGameMeta } from '../app/TeacherContentStore.js';
export { validateSchoolCode, decodeTeacherId, decodeSchoolType } from './schoolCode.js';
export * as screens from './screens.js';
export * as music from './MusicStore.js';
