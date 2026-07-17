import Jimp from 'jimp';

const THUMBNAIL_SIZE = 64;
const MOTION_THRESHOLD = 0.04;
const PIXEL_DIFF_THRESHOLD = 30;

export interface MotionResult {
  motionDetected: boolean;
  changeRatio: number;
}

export async function detectMotion(
  previousFrameBase64: string,
  currentFrameBase64: string
): Promise<MotionResult> {
  const [prev, curr] = await Promise.all([
    Jimp.read(Buffer.from(previousFrameBase64, 'base64')),
    Jimp.read(Buffer.from(currentFrameBase64, 'base64')),
  ]);

  prev.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE).greyscale();
  curr.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE).greyscale();

  const totalPixels = THUMBNAIL_SIZE * THUMBNAIL_SIZE;
  let changedPixels = 0;

  for (let y = 0; y < THUMBNAIL_SIZE; y++) {
    for (let x = 0; x < THUMBNAIL_SIZE; x++) {
      const p1 = Jimp.intToRGBA(prev.getPixelColor(x, y));
      const p2 = Jimp.intToRGBA(curr.getPixelColor(x, y));
      if (Math.abs(p1.r - p2.r) > PIXEL_DIFF_THRESHOLD) changedPixels++;
    }
  }

  const changeRatio = changedPixels / totalPixels;
  return { motionDetected: changeRatio > MOTION_THRESHOLD, changeRatio };
}
