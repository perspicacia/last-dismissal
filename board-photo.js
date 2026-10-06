const agedPhotos = new WeakMap();

// Print wear is fixed per image and never consumes the game's random sequence.
export function agedBoardPhoto(image) {
  if (!image || image.complete === false || !image.naturalWidth || !image.naturalHeight) return null;
  if (agedPhotos.has(image)) return agedPhotos.get(image);
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 512;
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  let seed = 190719;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  c.save(); c.beginPath();
  c.moveTo(9, 6); c.lineTo(250, 3); c.lineTo(496, 6); c.lineTo(w - 16, 4);
  c.lineTo(w - 5, 16); c.lineTo(w - 4, h * .53); c.lineTo(w - 8, h - 10);
  c.lineTo(w - 21, h - 4); c.lineTo(w * .45, h - 7); c.lineTo(8, h - 4);
  c.lineTo(4, h - 19); c.lineTo(7, h * .51); c.closePath(); c.clip();
  c.fillStyle = '#b9a37b'; c.fillRect(0, 0, w, h);
  // Equal proportional margins retain the entire original 3:2 composition.
  c.filter = 'grayscale(.48) sepia(.48) saturate(.65) contrast(.91) brightness(.91)';
  c.drawImage(image, w * .035, h * .035, w * .93, h * .93); c.filter = 'none';
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = '#cfb68538'; c.fillRect(0, 0, w, h);
  for (const [x, y, r] of [[12, 14, 150], [w - 10, h - 12, 178], [w * .7, 0, 100], [0, h * .72, 112]]) {
    const stain = c.createRadialGradient(x, y, 0, x, y, r);
    stain.addColorStop(0, '#6b4a2875'); stain.addColorStop(.45, '#88634035'); stain.addColorStop(1, '#8b694000');
    c.fillStyle = stain; c.fillRect(0, 0, w, h);
  }
  c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 1800; i++) {
    c.fillStyle = i % 3 ? '#efe0b514' : '#4b351816';
    c.fillRect(random() * w, random() * h, .6 + random() * 1.7, .6 + random() * 1.4);
  }
  // Thin abrasions and two faded creases, rather than covering the black faces.
  for (let i = 0; i < 32; i++) {
    const x = random() * w, y = random() * h;
    c.strokeStyle = '#e9d9b127'; c.lineWidth = .5 + random() * .7;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 5 + random() * 27, y + random() * 3); c.stroke();
  }
  for (const [x1, y1, x2, y2] of [[w * .73, 0, w * .67, h], [0, h * .83, w * .2, h]]) {
    c.lineWidth = 2; c.strokeStyle = '#31261720'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.lineWidth = .8; c.strokeStyle = '#f1e3bb35'; c.beginPath(); c.moveTo(x1 + 2, y1); c.lineTo(x2 + 2, y2); c.stroke();
  }
  c.strokeStyle = '#49342155'; c.lineWidth = 2; c.strokeRect(9, 8, w - 18, h - 16);
  c.restore(); agedPhotos.set(image, canvas); return canvas;
}

export function boardPhotoFor(source) {
  const exploration = Boolean(source.exploration);
  const photo = exploration ? agedBoardPhoto(source.boardPhotoErased)
    : source.anomaly === 'board' ? source.boardPhotoErased : source.boardPhoto;
  const ready = Boolean(photo && (photo.getContext || (photo.complete !== false && photo.naturalWidth)));
  if (source.canvas?.dataset) {
    source.canvas.dataset.boardPhotoVariant = exploration ? 'erased-aged' : source.anomaly === 'board' ? 'erased' : 'original';
    source.canvas.dataset.boardPhotoStatus = ready ? 'ready' : 'loading';
  }
  return ready ? photo : null;
}
