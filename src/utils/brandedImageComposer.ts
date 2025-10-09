const HEADER_IMAGE_URL = '/hedaing.png';

let cachedHeaderImage: HTMLImageElement | null = null;
let headerLoadPromise: Promise<HTMLImageElement> | null = null;

export async function preloadHeader(): Promise<HTMLImageElement> {
  if (cachedHeaderImage) {
    return cachedHeaderImage;
  }

  if (headerLoadPromise) {
    return headerLoadPromise;
  }

  headerLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      cachedHeaderImage = img;
      headerLoadPromise = null;
      resolve(img);
    };

    img.onerror = (error) => {
      headerLoadPromise = null;
      reject(new Error('Failed to load header image'));
    };

    img.src = HEADER_IMAGE_URL;
  });

  return headerLoadPromise;
}

interface BrandingOptions {
  imageDataUrl: string;
  username: string;
  gameName?: string;
}

export async function generateBrandedImage(options: BrandingOptions): Promise<string> {
  const { imageDataUrl, username, gameName = 'NFL Draw Logo' } = options;

  return new Promise((resolve, reject) => {
    const sourceImg = new Image();
    sourceImg.crossOrigin = 'anonymous';

    sourceImg.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = sourceImg.width;
        canvas.height = sourceImg.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(sourceImg, 0, 0);

        let headerImg: HTMLImageElement | null = null;
        try {
          headerImg = await preloadHeader();
        } catch (error) {
          console.warn('Header image failed to load, continuing without header:', error);
        }

        if (headerImg) {
          const headerAspectRatio = headerImg.width / headerImg.height;
          const headerWidth = canvas.width;
          const headerHeight = headerWidth / headerAspectRatio;

          ctx.save();
          ctx.drawImage(headerImg, 0, 0, headerWidth, headerHeight);
          ctx.restore();
        }

        const padding = 16;
        ctx.save();
        ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        const usernameText = `by ${username}`;
        const usernameMetrics = ctx.measureText(usernameText);
        const usernameTextWidth = usernameMetrics.width;

        const userContainerPadding = 8;
        const userContainerWidth = usernameTextWidth + (userContainerPadding * 2);
        const userContainerHeight = 28;
        const userContainerX = canvas.width - padding - usernameTextWidth - userContainerPadding;
        const userContainerY = canvas.height - padding - userContainerHeight;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        const userBorderRadius = 8;
        ctx.beginPath();
        ctx.moveTo(userContainerX + userBorderRadius, userContainerY);
        ctx.lineTo(userContainerX + userContainerWidth - userBorderRadius, userContainerY);
        ctx.quadraticCurveTo(userContainerX + userContainerWidth, userContainerY, userContainerX + userContainerWidth, userContainerY + userBorderRadius);
        ctx.lineTo(userContainerX + userContainerWidth, userContainerY + userContainerHeight - userBorderRadius);
        ctx.quadraticCurveTo(userContainerX + userContainerWidth, userContainerY + userContainerHeight, userContainerX + userContainerWidth - userBorderRadius, userContainerY + userContainerHeight);
        ctx.lineTo(userContainerX + userBorderRadius, userContainerY + userContainerHeight);
        ctx.quadraticCurveTo(userContainerX, userContainerY + userContainerHeight, userContainerX, userContainerY + userContainerHeight - userBorderRadius);
        ctx.lineTo(userContainerX, userContainerY + userBorderRadius);
        ctx.quadraticCurveTo(userContainerX, userContainerY, userContainerX + userBorderRadius, userContainerY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#34495e';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const usernameX = canvas.width - padding;
        const usernameY = canvas.height - padding - userContainerHeight / 2;

        ctx.fillText(usernameText, usernameX, usernameY);
        ctx.restore();

        const brandedDataUrl = canvas.toDataURL('image/png');
        resolve(brandedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    sourceImg.onerror = () => {
      reject(new Error('Failed to load source image'));
    };

    sourceImg.src = imageDataUrl;
  });
}
