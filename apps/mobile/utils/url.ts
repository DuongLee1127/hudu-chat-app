const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:5000/api';

/**
 * Build a full URL from an attachment's relative url field.
 * e.g. `/api/attachments/:id/download` → `http://host:5000/api/attachments/:id/download`
 */
export function buildAttachmentUrl(relativeOrFull: string | undefined): string | undefined {
  if (!relativeOrFull) return undefined;
  if (relativeOrFull.startsWith('http')) return relativeOrFull;

  // Relative path starts with /api/... → strip the /api prefix since baseURL includes /api
  const baseDomain = API_BASE.replace(/\/api$/, '');
  return `${baseDomain}${relativeOrFull}`;
}
