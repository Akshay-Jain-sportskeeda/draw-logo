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

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          ctx.drawImage(logoImg, padding, padding, logoWidth, logoHeight);
          ctx.restore();

          ctx.save();
          ctx.font = 'bold 18px Arial, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          const textX = padding + logoWidth + textPadding;
          const textY = padding + logoHeight / 2 + 6;

          ctx.fillText(gameName, textX, textY);
          ctx.restore();
        } else {
          ctx.save();
          ctx.font = 'bold 20px Arial, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText(gameName, padding, padding + 24);
          ctx.restore();
        }

        ctx.save();
        ctx.font = '14px Arial, sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const usernameText = `by ${username}`;
        const usernameX = canvas.width - padding;
        const usernameY = canvas.height - padding;

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
