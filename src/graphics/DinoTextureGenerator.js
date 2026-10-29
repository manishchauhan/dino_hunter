import * as THREE from 'three';

/**
 * Procedural Texture Generator for Ultra-Authentic AAA Dinosaur Scales & Materials
 * Replaces flat monochrome colors with organic reptilian scutes, normal maps,
 * counter-shading, keratin bone grain, and dynamic specular highlights.
 */
export class DinoTextureGenerator {
  static skinTextureCache = new Map();
  static bumpMapCache = null;
  static boneTextureCache = null;

  /**
   * Generates a rich reptilian scale diffuse map with species-specific patterns
   */
  static getSkinTexture(type, baseColorHex, accentColorHex, isUnderbelly = false) {
    const cacheKey = `${type}_${baseColorHex}_${accentColorHex}_${isUnderbelly}`;
    if (this.skinTextureCache.has(cacheKey)) {
      return this.skinTextureCache.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseColor = new THREE.Color(baseColorHex);
    const accentColor = new THREE.Color(accentColorHex);

    // 1. Base gradient foundation with natural depth
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    if (isUnderbelly) {
      grad.addColorStop(0, baseColor.clone().offsetHSL(0, -0.1, 0.22).getStyle());
      grad.addColorStop(0.5, baseColor.clone().offsetHSL(0, -0.08, 0.14).getStyle());
      grad.addColorStop(1, baseColor.clone().offsetHSL(0, -0.15, 0.06).getStyle());
    } else {
      grad.addColorStop(0, baseColor.clone().offsetHSL(0, 0.05, 0.12).getStyle());
      grad.addColorStop(0.4, baseColor.getStyle());
      grad.addColorStop(1, baseColor.clone().offsetHSL(0, -0.05, -0.16).getStyle());
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. High-density reptilian pebble scales
    const numRows = isUnderbelly ? 26 : 40;
    const numCols = isUnderbelly ? 20 : 40;
    const cellW = 512 / numCols;
    const cellH = 512 / numRows;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const cx = (c + 0.5 + (r % 2 === 0 ? 0.25 : -0.25)) * cellW + (Math.sin(r * 4.3 + c) * cellW * 0.15);
        const cy = (r + 0.5) * cellH + (Math.cos(c * 3.1 + r) * cellH * 0.15);
        const radiusX = (cellW * 0.44) * (0.85 + Math.sin(r + c * 2) * 0.15);
        const radiusY = (cellH * 0.44) * (0.85 + Math.cos(r * 2 + c) * 0.15);

        // Scale drop shadow (ambient occlusion crevice)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(cx + 1.2, cy + 1.2, radiusX + 0.8, radiusY + 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scale dome highlight
        const scaleGrad = ctx.createRadialGradient(
          cx - radiusX * 0.3, cy - radiusY * 0.3, radiusX * 0.1,
          cx, cy, radiusX
        );

        if (isUnderbelly) {
          scaleGrad.addColorStop(0, 'rgba(255, 248, 230, 0.42)');
          scaleGrad.addColorStop(0.7, 'rgba(230, 215, 190, 0.16)');
          scaleGrad.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
        } else {
          scaleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
          scaleGrad.addColorStop(0.6, accentColor.clone().offsetHSL(0, 0, 0.08).getStyle());
          scaleGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        }

        ctx.fillStyle = scaleGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radiusX, radiusY, (r + c) * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Scale rim specular
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // 3. Species-specific predatory markings & camouflage
    if (!isUnderbelly) {
      if (['trex', 'allosaurus', 'giganotosaurus', 'ceratosaurus'].includes(type)) {
        // Apex predator vertical tiger camouflage stripes
        ctx.fillStyle = 'rgba(15, 22, 12, 0.50)';
        for (let i = 0; i < 11; i++) {
          const sx = 30 + i * 45;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.bezierCurveTo(sx + 24, 150, sx - 28, 300, sx + 18, 512);
          ctx.bezierCurveTo(sx - 8, 320, sx + 38, 160, sx + 25, 0);
          ctx.fill();
        }
      } else if (['spinosaurus', 'baryonyx', 'suchomimus'].includes(type)) {
        // Swamp camouflage dapples & riverbed spots
        ctx.fillStyle = 'rgba(190, 80, 45, 0.42)';
        for (let i = 0; i < 38; i++) {
          const x = (i * 73) % 512;
          const y = (i * 97) % 512;
          ctx.beginPath();
          ctx.arc(x, y, 16 + (i % 6) * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (['triceratops', 'styracosaurus', 'pachyrhinosaurus'].includes(type)) {
        // Keratin stress lines & earthy armor blotches
        ctx.fillStyle = 'rgba(75, 45, 25, 0.38)';
        for (let i = 0; i < 16; i++) {
          ctx.beginPath();
          ctx.ellipse(35 + i * 32, 256 + (i % 3) * 65, 48, 20, (i % 2) * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (['ankylosaurus', 'stegosaurus', 'kentrosaurus'].includes(type)) {
        // Hexagonal osteoderm bone scute clusters
        ctx.fillStyle = 'rgba(25, 18, 12, 0.58)';
        ctx.strokeStyle = 'rgba(215, 175, 100, 0.3)';
        ctx.lineWidth = 2.5;
        for (let x = 32; x < 512; x += 64) {
          for (let y = 32; y < 512; y += 64) {
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
              const ang = (a / 6) * Math.PI * 2;
              const px = x + Math.cos(ang) * 22;
              const py = y + Math.sin(ang) * 22;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      } else if (['velociraptor', 'deinonychus'].includes(type)) {
        // High-velocity raptor aerodynamic quill chevrons
        ctx.fillStyle = 'rgba(180, 100, 30, 0.48)';
        for (let y = 30; y < 512; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(256, y + 35);
          ctx.lineTo(512, y);
          ctx.lineTo(512, y + 20);
          ctx.lineTo(256, y + 55);
          ctx.lineTo(0, y + 20);
          ctx.closePath();
          ctx.fill();
        }
      } else if (['carnotaurus'].includes(type)) {
        // Red volcanic sprint demon stripes
        ctx.fillStyle = 'rgba(220, 50, 20, 0.45)';
        for (let i = 0; i < 14; i++) {
          ctx.fillRect(i * 38, 0, 16, 512);
        }
      } else if (['therizinosaurus'].includes(type)) {
        // Scythe reaper plumage feather barbs
        ctx.fillStyle = 'rgba(200, 70, 40, 0.45)';
        for (let i = 0; i < 40; i++) {
          const x = (i * 37) % 512;
          const y = (i * 59) % 512;
          ctx.beginPath();
          ctx.ellipse(x, y, 32, 10, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (['pachycephalosaurus', 'parasaurolophus', 'iguanodon'].includes(type)) {
        // Bone crest concentric waves & ripple bands
        ctx.strokeStyle = 'rgba(220, 180, 90, 0.35)';
        ctx.lineWidth = 4;
        for (let rad = 40; rad < 480; rad += 45) {
          ctx.beginPath();
          ctx.arc(256, 256, rad, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (['brachiosaurus'].includes(type)) {
        // Colossal elephantine leather fissures & ancient moss
        ctx.strokeStyle = 'rgba(20, 35, 20, 0.4)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 24; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * 22);
          ctx.bezierCurveTo(150, i * 22 + 15, 350, i * 22 - 15, 512, i * 22);
          ctx.stroke();
        }
      }
    }

    // 4. Fine skin grain noise for micro-surface relief
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.5, 1.5);

    this.skinTextureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates bump/normal heightmap texture to give tactile 3D scale relief
   */
  static getBumpMap() {
    if (this.bumpMapCache) return this.bumpMapCache;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 36;
    const cols = 36;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) * cellW;
        const cy = (r + 0.5) * cellH;
        const rad = cellW * 0.45;

        const g = ctx.createRadialGradient(cx, cy, rad * 0.1, cx, cy, rad);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.7, '#909090');
        g.addColorStop(1, '#181818');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.5, 2.5);
    this.bumpMapCache = tex;
    return tex;
  }

  /**
   * Weathered horn & bone texture for teeth, brow horns, and clubs
   */
  static getBoneTexture() {
    if (this.boneTextureCache) return this.boneTextureCache;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Bone ivory base
    ctx.fillStyle = '#f0ebd8';
    ctx.fillRect(0, 0, 256, 256);

    // Weathered keratin ridges
    ctx.strokeStyle = 'rgba(110, 85, 55, 0.32)';
    ctx.lineWidth = 1.4;
    for (let y = 0; y < 256; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 2);
      ctx.lineTo(256, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }

    // Tip darkening / wear gradient
    const wearGrad = ctx.createLinearGradient(0, 0, 0, 256);
    wearGrad.addColorStop(0, 'rgba(75, 45, 20, 0.52)');
    wearGrad.addColorStop(0.5, 'rgba(140, 110, 70, 0.20)');
    wearGrad.addColorStop(1, 'rgba(255, 255, 240, 0.05)');
    ctx.fillStyle = wearGrad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.boneTextureCache = tex;
    return tex;
  }

  /**
   * Spinosaurus Sail Membrane Texture with vivid warning colors and blood vessels
   */
  static getSailTexture(sailColorHex = 0xba5533) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 512, 0, 0);
    grad.addColorStop(0, '#2a1a12');
    grad.addColorStop(0.3, '#8b2510');
    grad.addColorStop(0.7, '#d4501a');
    grad.addColorStop(0.95, '#f5a020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Neural spine web veining
    ctx.strokeStyle = 'rgba(255, 210, 120, 0.45)';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 9; i++) {
      const x = 30 + i * 55;
      ctx.beginPath();
      ctx.moveTo(x, 512);
      ctx.quadraticCurveTo(x + (i % 2 === 0 ? 30 : -30), 256, x, 0);
      ctx.stroke();

      // Branch veins
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(240, 150, 50, 0.3)';
      for (let y = 100; y < 450; y += 45) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (i % 2 === 0 ? 35 : -35), y - 25);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }
}
