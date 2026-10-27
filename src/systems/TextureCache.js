import * as THREE from 'three';

class TextureCache {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.cache = new Map();
  }

  load(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    const texture = this.loader.load(url);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(url, texture);
    return texture;
  }
}

export const textureCache = new TextureCache();
