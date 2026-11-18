/**
 * Converts a display name into a clean, URL-safe lowercase slug.
 * Example: "Electronics & Audio!" -> "electronics-audio"
 */
export default function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
