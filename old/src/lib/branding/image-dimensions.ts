export type ImageDimensions = {
  width: number;
  height: number;
};

function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) |
      (bytes[offset + 1]! << 16) |
      (bytes[offset + 2]! << 8) |
      bytes[offset + 3]!) >>>
    0
  );
}

/** Dimensões a partir de bytes PNG ou JPEG (Node e browser). */
export function getImageDimensionsFromBytes(bytes: Uint8Array): ImageDimensions {
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return {
      width: readUInt32BE(bytes, 16),
      height: readUInt32BE(bytes, 20),
    };
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length - 8) {
      if (bytes[i] !== 0xff) break;
      const marker = bytes[i + 1]!;
      const len = (bytes[i + 2]! << 8) | bytes[i + 3]!;
      if (marker >= 0xc0 && marker <= 0xc3 && len >= 5) {
        return {
          height: (bytes[i + 5]! << 8) | bytes[i + 6]!,
          width: (bytes[i + 7]! << 8) | bytes[i + 8]!,
        };
      }
      i += 2 + len;
    }
  }

  return { width: 0, height: 0 };
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function getImageDimensionsFromDataUrl(dataUrl: string): ImageDimensions {
  return getImageDimensionsFromBytes(dataUrlToBytes(dataUrl));
}
