const PFSN_LOGO_URL = 'https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg';

let cachedLogoImage: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement> | null = null;

export async function preloadLogo(): Promise<HTMLImageElement> {
  if (cachedLogoImage) {
    return cachedLogoImage;
  }

  if (logoLoadPromise) {
    return logoLoadPromise;
  }

  logoLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      cachedLogoImage = img;
      logoLoadPromise = null;
      resolve(img);
    };

    img.onerror = (error) => {
      logoLoadPromise = null;
      reject(new Error('Failed to load PFSN logo'));
    };

    img.src = PFSN_LOGO_URL;
  });

  return logoLoadPromise;
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

        let logoImg: HTMLImageElement | null = null;
        try {
          logoImg = await preloadLogo();
        } catch (error) {
          console.warn('Logo failed to load, continuing without logo:', error);
        }

        const padding = 16;
        const logoHeight = 32;
        const textPadding = 8;

        if (logoImg) {
          const logoAspectRatio = logoImg.width / logoImg.height;
          const logoWidth = logoHeight * logoAspectRatio;

          ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
          const textMetrics = ctx.measureText(gameName);
          const textWidth = textMetrics.width;

          const containerPadding = 10;
          const containerWidth = textWidth + (containerPadding * 2);
          const containerHeight = logoHeight;
          const containerX = padding + logoWidth + textPadding - containerPadding;
          const containerY = padding;

          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          const borderRadius = 8;
          ctx.beginPath();
          ctx.moveTo(containerX + borderRadius, containerY);
          ctx.lineTo(containerX + containerWidth - borderRadius, containerY);
          ctx.quadraticCurveTo(containerX + containerWidth, containerY, containerX + containerWidth, containerY + borderRadius);
          ctx.lineTo(containerX + containerWidth, containerY + containerHeight - borderRadius);
          ctx.quadraticCurveTo(containerX + containerWidth, containerY + containerHeight, containerX + containerWidth - borderRadius, containerY + containerHeight);
          ctx.lineTo(containerX + borderRadius, containerY + containerHeight);
          ctx.quadraticCurveTo(containerX, containerY + containerHeight, containerX, containerY + containerHeight - borderRadius);
          ctx.lineTo(containerX, containerY + borderRadius);
          ctx.quadraticCurveTo(containerX, containerY, containerX + borderRadius, containerY);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.drawImage(logoImg, padding, padding, logoWidth, logoHeight);
          ctx.restore();

          ctx.save();
          ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
          ctx.fillStyle = '#2c3e50';

          const textX = padding + logoWidth + textPadding;
          const textY = padding + logoHeight / 2 + 7;

          ctx.fillText(gameName, textX, textY);
          ctx.restore();
        } else {
          ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
          const textMetrics = ctx.measureText(gameName);
          const textWidth = textMetrics.width;

          const containerPadding = 10;
          const containerWidth = textWidth + (containerPadding * 2);
          const containerHeight = 32 + (containerPadding * 2);
          const containerX = padding - containerPadding;
          const containerY = padding - containerPadding;

          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          const borderRadius = 8;
          ctx.beginPath();
          ctx.moveTo(containerX + borderRadius, containerY);
          ctx.lineTo(containerX + containerWidth - borderRadius, containerY);
          ctx.quadraticCurveTo(containerX + containerWidth, containerY, containerX + containerWidth, containerY + borderRadius);
          ctx.lineTo(containerX + containerWidth, containerY + containerHeight - borderRadius);
          ctx.quadraticCurveTo(containerX + containerWidth, containerY + containerHeight, containerX + containerWidth - borderRadius, containerY + containerHeight);
          ctx.lineTo(containerX + borderRadius, containerY + containerHeight);
          ctx.quadraticCurveTo(containerX, containerY + containerHeight, containerX, containerY + containerHeight - borderRadius);
          ctx.lineTo(containerX, containerY + borderRadius);
          ctx.quadraticCurveTo(containerX, containerY, containerX + borderRadius, containerY);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
          ctx.fillStyle = '#2c3e50';
          ctx.fillText(gameName, padding, padding + 24);
          ctx.restore();
        }

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
