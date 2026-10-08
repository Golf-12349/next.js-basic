/**
 * Utility function to compress and resize avatar image to a crisp square (~20-35 KB)
 * Prevents QuotaExceededError in localStorage/sessionStorage and HTTP 413 Payload Too Large on the backend.
 */
export function compressAndResizeAvatar(
  file: File,
  maxDimension = 320,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ (PNG, JPG, WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ບໍ່ສາມາດອ່ານໄຟລ໌ຮູບພາບໄດ້'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ບໍ່ສາມາດປະມວນຜົນຮູບພາບໄດ້'));
      img.onload = () => {
        const { width, height } = img;
        if (width === 0 || height === 0) {
          resolve(typeof reader.result === 'string' ? reader.result : '');
          return;
        }

        // Center-crop to a square avatar
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        const targetDim = Math.min(maxDimension, size);
        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof reader.result === 'string' ? reader.result : '');
          return;
        }

        // High quality smooth downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetDim, targetDim);

        // Export as JPEG (small file size, high quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  });
}
