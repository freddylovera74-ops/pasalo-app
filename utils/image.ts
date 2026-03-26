import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Sube una imagen (data URL base64) a Firebase Storage y devuelve la URL pública.
 * Path: listings/{listingId}/{timestamp}-{random}.jpg  o  users/{userId}/{timestamp}.jpg
 */
export const uploadImageToStorage = async (
  dataUrl: string,
  path: string
): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
  return await getDownloadURL(snapshot.ref);
};

/**
 * Sube múltiples imágenes para un listing y devuelve sus URLs públicas.
 */
export const uploadListingImages = async (
  dataUrls: string[],
  listingId: string
): Promise<string[]> => {
  const uploads = dataUrls.map((dataUrl, idx) => {
    const path = `listings/${listingId}/${Date.now()}-${idx}.jpg`;
    return uploadImageToStorage(dataUrl, path);
  });
  return Promise.all(uploads);
};

/**
 * Utilidad de compresión agresiva para PASALO.app
 * Optimizada para conexiones 3G/4G inestables.
 */
export const compressImage = (file: File, maxWidth = 1200, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionamiento proporcional
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No se pudo obtener el contexto del canvas');

        // Dibujar y comprimir
        ctx.drawImage(img, 0, 0, width, height);
        
        // Exportar como JPEG con calidad reducida para máximo ahorro de datos
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Genera una miniatura ultra pequeña para el placeholder blur
 */
export const generateBlurPlaceholder = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 20;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, 20, 20);
      resolve(canvas.toDataURL('image/jpeg', 0.1));
    };
  });
};
