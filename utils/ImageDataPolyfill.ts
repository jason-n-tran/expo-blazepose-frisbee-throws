/**
 * ImageData Polyfill for React Native
 * 
 * Provides a basic ImageData implementation for React Native environments
 * where the browser ImageData API is not available.
 */

// Check if ImageData exists globally (web environment)
if (typeof global.ImageData === 'undefined') {
  // Create a simple ImageData polyfill for React Native
  class ImageDataPolyfill {
    public width: number;
    public height: number;
    public data: Uint8ClampedArray;

    constructor(width: number, height: number);
    constructor(data: Uint8ClampedArray, width: number, height?: number);
    constructor(
      dataOrWidth: Uint8ClampedArray | number,
      widthOrHeight: number,
      height?: number
    ) {
      if (typeof dataOrWidth === 'number') {
        // Constructor: new ImageData(width, height)
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        // Constructor: new ImageData(data, width, height?)
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = height || Math.floor(dataOrWidth.length / (widthOrHeight * 4));
      }
    }
  }

  // Assign to global
  (global as any).ImageData = ImageDataPolyfill;
  console.log('[ImageDataPolyfill] ImageData polyfill installed');
}

export {};
