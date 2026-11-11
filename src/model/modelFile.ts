import RNFS from 'react-native-fs';

import {vaultPaths} from '@/vault';

import {directDownloadUrl, MODEL_NAME, MODEL_SOURCE} from './config';

export const modelPath = () => `${vaultPaths().models}/${MODEL_NAME}`;

/**
 * A real model is hundreds of MB; Drive's HTML error page is a few KB. (Not RNFS.read: its iOS
 * signature takes NSInteger pointers, which the new architecture can't convert, so it always throws.)
 */
async function looksLikeModel(path: string): Promise<boolean> {
  return Number((await RNFS.stat(path)).size) > 50 * 1024 * 1024;
}

export async function isModelDownloaded(): Promise<boolean> {
  return RNFS.exists(modelPath());
}

/** Download to a temp file, check it's really a model, then move into the vault. */
export async function downloadModel(onProgress: (pct: number) => void): Promise<void> {
  const dest = modelPath();
  const temp = `${dest}.part`;
  await RNFS.mkdir(vaultPaths().models);
  if (await RNFS.exists(temp)) await RNFS.unlink(temp);
  const {promise} = RNFS.downloadFile({
    fromUrl: directDownloadUrl(MODEL_SOURCE),
    toFile: temp,
    progressInterval: 500,
    progress: p => p.contentLength > 0 && onProgress(Math.round((p.bytesWritten / p.contentLength) * 100)),
  });
  const result = await promise;
  if (result.statusCode !== 200 || !(await looksLikeModel(temp))) {
    await RNFS.unlink(temp).catch(() => {});
    throw new Error(
      result.statusCode !== 200
        ? `Download failed (${result.statusCode})`
        : 'That link did not return a model file. Is the Drive file shared with "Anyone with the link"?',
    );
  }
  await RNFS.moveFile(temp, dest);
}

export async function deleteModel(): Promise<void> {
  if (await isModelDownloaded()) await RNFS.unlink(modelPath());
}
