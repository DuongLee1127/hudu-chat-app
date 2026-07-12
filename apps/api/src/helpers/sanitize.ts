import sanitizeHtml from 'sanitize-html';

// Strips all HTML/script markup from user-supplied free text before it is
// stored and later rendered to other users (message content, bio, names...).
export const sanitizeText = <T extends string | undefined>(input: T): T => {
  if (!input) return input;
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim() as T;
};
