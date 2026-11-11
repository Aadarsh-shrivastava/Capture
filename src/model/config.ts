/**
 * Where the on-device model is downloaded from. Paste a public Google Drive share link
 * ("Anyone with the link") or any direct https URL to the .gguf file.
 */
export const MODEL_SOURCE = 'https://drive.google.com/file/d/1SKu5vj3-DtdsRtPpz5AL498yjVIvlDtm/view?usp=sharing';
export const MODEL_NAME = 'qwen-q4_k_m.gguf';
/** Shown before downloading so nobody pulls ~400 MB on mobile data by surprise. */
export const MODEL_SIZE_MB = 380;

/**
 * Drive share link → direct download URL. Large files normally hit Drive's "can't scan for
 * viruses" page; the usercontent host with confirm=t skips it. Other URLs pass through.
 */
export function directDownloadUrl(link: string): string {
  const id = link.match(/\/file\/d\/([\w-]+)/)?.[1] ?? link.match(/[?&]id=([\w-]+)/)?.[1];
  return id ? `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t` : link;
}
