import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {

  constructor() { }

  async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 1,          // Tamaño máximo en MB
      maxWidthOrHeight: 800, // Tamaño máximo de ancho o alto en píxeles
      useWebWorker: true     // Utilizar Web Workers para mejorar el rendimiento
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      throw new Error('Error al comprimir la imagen');
    }
  }
}
