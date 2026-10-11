export const supportAttachmentLimit = 3 * 1024 * 1024;
export const supportAttachmentBucket = 'support-attachments';
export function attachmentType(bytes: Buffer): { mime: string; extension: string } | null {
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mime: 'image/png', extension: 'png' };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mime: 'image/jpeg', extension: 'jpg' };
  if (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') return { mime: 'image/webp', extension: 'webp' };
  if (bytes.toString('ascii',0,5) === '%PDF-') return { mime: 'application/pdf', extension: 'pdf' };
  return null;
}
export function attachmentName(name: string) {
  return name.split(/[\\/]/).at(-1)!.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,150) || 'attachment';
}
