/** Per-resource caps for preview profile (command 1). */
export const SAMPLE_LIMITS = {
  posts: 5,
  pages: 3,
  categories: 10,
  tags: 5,
  media: 5,
  users: 2,
  customType: 3,
};

/** @returns {'preview'} */
export function profileFromArgv() {
  return 'preview';
}
