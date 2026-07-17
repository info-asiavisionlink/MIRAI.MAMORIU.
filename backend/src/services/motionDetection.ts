import sharp from 'sharp';

const THUMBNAIL_SIZE = 64;
const MOTION_THRESHOLD = 0.04; // 4% pixel change
const PIXEL_DIFF_THRESHOLD = 30;  // out of 255

export interface MotionResult {
  motionDetected: boolean;
  changeRatio: number;
}

export async function detectMotion(
  previousFrameBase64: string,
  currentFrameBase64: string
): Promise<MotionResult> {
  const [prevBuffer, currBuffer] = await Promise.all([
    sharp(Buffer.from(previousFrameBase64, 'base64'))
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer(),
    sharp(Buffer.from(currentFrameBase64, 'base64'))
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer(),
  ]);

  const totalPixels = THUMBNAIL_SIZE * THUMBNAIL_SIZE;
  let changedPixels = 0;

  for (let i = 0; i < totalPixels; i++) {
    if (Math.abs(prevBuffer[i] - currBuffer[i]) > PIXEL_DIFF_THRESHOLD) {
      changedPixels++;
    }
  }

  const changeRatio = changedPixels / totalPixels;
  return { motionDetected: changeRatio > MOTION_THRESHOLD, changeRatio };
}
