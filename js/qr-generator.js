(function () {
  'use strict';

  // ========== Galois Field GF(2^8) ==========
  const GF_EXP = new Int32Array(512);
  const GF_LOG = new Int32Array(256);

  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x >= 256) x ^= 0x11D;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();

  function gfMul(a, b) {
    return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  // ========== Reed-Solomon ==========
  function rsGeneratorPoly(n) {
    let gen = [1];
    for (let i = 0; i < n; i++) {
      const ng = new Array(gen.length + 1).fill(0);
      for (let j = 0; j < gen.length; j++) {
        ng[j] ^= gen[j];
        ng[j + 1] ^= gfMul(gen[j], GF_EXP[i]);
      }
      gen = ng;
    }
    return gen;
  }

  function rsEncode(data, numEC) {
    const gen = rsGeneratorPoly(numEC);
    const reg = new Array(numEC).fill(0);
    for (let i = 0; i < data.length; i++) {
      const fb = data[i] ^ reg[0];
      for (let j = 0; j < numEC - 1; j++) {
        reg[j] = reg[j + 1] ^ gfMul(gen[j + 1], fb);
      }
      reg[numEC - 1] = gfMul(gen[numEC], fb);
    }
    return reg;
  }

  // ========== QR Tables (M-level ECC) ==========
  const ECC_TABLE = {
    1:  [26,  10, [[1, 16]]],
    2:  [44,  16, [[1, 28]]],
    3:  [70,  26, [[1, 44]]],
    4:  [100, 18, [[2, 32]]],
    5:  [134, 24, [[2, 43]]],
    6:  [172, 16, [[4, 27]]],
    7:  [196, 18, [[4, 31]]],
    8:  [242, 22, [[2, 38], [2, 39]]],
    9:  [292, 22, [[3, 36], [2, 37]]],
    10: [346, 26, [[4, 43], [1, 44]]],
  };

  const MAX_CHARS = [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213];

  const ALIGN_POS = {
    2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30], 6: [6,34],
    7: [6,22,38], 8: [6,24,42], 9: [6,26,46], 10: [6,28,50],
  };

  const REMAINDER = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0];

  // ========== Data Encoding ==========
  function determineVersion(len) {
    for (let v = 1; v <= 10; v++) {
      if (len <= MAX_CHARS[v]) return v;
    }
    return -1;
  }

  function encodeData(text, version) {
    const info = ECC_TABLE[version];
    const totalDataCW = info[2].reduce((s, g) => s + g[0] * g[1], 0);
    const bytes = new TextEncoder().encode(text);

    const bits = [];
    const push = (val, count) => {
      for (let i = count - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };

    push(0b0100, 4);
    push(bytes.length, version <= 9 ? 8 : 16);
    for (const b of bytes) push(b, 8);

    const capacity = totalDataCW * 8;
    const termLen = Math.min(4, capacity - bits.length);
    for (let i = 0; i < termLen; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const dataCW = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      dataCW.push(byte);
    }

    const pads = [0xEC, 0x11];
    let pi = 0;
    while (dataCW.length < totalDataCW) {
      dataCW.push(pads[pi]);
      pi ^= 1;
    }

    return dataCW;
  }

  // ========== ECC & Interleaving ==========
  function generateBlocks(dataCW, version) {
    const info = ECC_TABLE[version];
    const ecPerBlock = info[1];
    const groups = info[2];

    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;

    for (const [numBlocks, dataPer] of groups) {
      for (let b = 0; b < numBlocks; b++) {
        const block = dataCW.slice(offset, offset + dataPer);
        offset += dataPer;
        dataBlocks.push(block);
        ecBlocks.push(rsEncode(block, ecPerBlock));
      }
    }

    return { dataBlocks, ecBlocks };
  }

  function interleave(blocks) {
    const maxLen = Math.max(...blocks.map(b => b.length));
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      for (const block of blocks) {
        if (i < block.length) result.push(block[i]);
      }
    }
    return result;
  }

  function buildCodewords(text, version) {
    const dataCW = encodeData(text, version);
    const { dataBlocks, ecBlocks } = generateBlocks(dataCW, version);
    return interleave(dataBlocks).concat(interleave(ecBlocks));
  }

  // ========== Matrix Construction ==========
  function createMatrix(version) {
    const size = 4 * version + 17;
    const matrix = Array.from({ length: size }, () => new Array(size).fill(false));
    const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
    return { matrix, reserved, size };
  }

  function placeFinderPattern(matrix, reserved, row, col) {
    const pattern = [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1],
    ];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const mr = row + r, mc = col + c;
        if (mr >= 0 && mr < matrix.length && mc >= 0 && mc < matrix.length) {
          matrix[mr][mc] = !!pattern[r][c];
          reserved[mr][mc] = true;
        }
      }
    }
  }

  function placeSeparators(reserved, size) {
    for (let i = 0; i <= 7; i++) {
      reserved[7][i] = true;
      reserved[i][7] = true;
    }
    for (let i = 0; i <= 7; i++) {
      reserved[7][size - 8 + i] = true;
      reserved[i][size - 8] = true;
    }
    for (let i = 0; i <= 7; i++) {
      reserved[size - 8][i] = true;
      reserved[size - 8 + i][7] = true;
    }
  }

  function placeAlignmentPatterns(matrix, reserved, version) {
    const positions = ALIGN_POS[version];
    if (!positions) return;

    const pattern = [
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ];

    for (const row of positions) {
      for (const col of positions) {
        if (row <= 8 && col <= 8) continue;
        if (row <= 8 && col >= matrix.length - 8) continue;
        if (row >= matrix.length - 8 && col <= 8) continue;

        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            matrix[row + r][col + c] = !!pattern[r + 2][c + 2];
            reserved[row + r][col + c] = true;
          }
        }
      }
    }
  }

  function placeTimingPatterns(matrix, reserved, size) {
    for (let i = 8; i < size - 8; i++) {
      const dark = i % 2 === 0;
      if (!reserved[6][i]) { matrix[6][i] = dark; reserved[6][i] = true; }
      if (!reserved[i][6]) { matrix[i][6] = dark; reserved[i][6] = true; }
    }
  }

  function placeDarkModule(matrix, reserved, version) {
    const row = 4 * version + 9;
    matrix[row][8] = true;
    reserved[row][8] = true;
  }

  function reserveFormatAreas(reserved, size) {
    for (let i = 0; i <= 8; i++) { reserved[8][i] = true; reserved[i][8] = true; }
    for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; }
    for (let i = 0; i < 7; i++) { reserved[size - 1 - i][8] = true; }
  }

  function reserveVersionAreas(reserved, size, version) {
    if (version < 7) return;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true;
        reserved[size - 11 + j][i] = true;
      }
    }
  }

  function initMatrix(version) {
    const { matrix, reserved, size } = createMatrix(version);
    placeFinderPattern(matrix, reserved, 0, 0);
    placeFinderPattern(matrix, reserved, 0, size - 7);
    placeFinderPattern(matrix, reserved, size - 7, 0);
    placeSeparators(reserved, size);
    placeAlignmentPatterns(matrix, reserved, version);
    placeTimingPatterns(matrix, reserved, size);
    placeDarkModule(matrix, reserved, version);
    reserveFormatAreas(reserved, size);
    reserveVersionAreas(reserved, size, version);
    return { matrix, reserved, size };
  }

  // ========== Data Placement ==========
  function placeData(matrix, reserved, codewords, version) {
    const size = matrix.length;
    const bits = [];
    for (const cw of codewords) {
      for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
    }
    for (let i = 0; i < REMAINDER[version]; i++) bits.push(0);

    let bitIdx = 0;
    let right = size - 1;
    let pairCount = 0;

    while (right >= 1) {
      if (right === 6) right = 5;
      const left = right - 1;
      const goingUp = pairCount % 2 === 0;

      for (let i = 0; i < size; i++) {
        const row = goingUp ? (size - 1 - i) : i;
        for (const col of [right, left]) {
          if (col < 0) continue;
          if (!reserved[row][col] && bitIdx < bits.length) {
            matrix[row][col] = !!bits[bitIdx];
            bitIdx++;
          }
        }
      }
      right -= 2;
      pairCount++;
    }
  }

  // ========== Masking ==========
  const MASK_FNS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];

  function applyMask(matrix, reserved, maskIdx) {
    const size = matrix.length;
    const masked = matrix.map(row => [...row]);
    const fn = MASK_FNS[maskIdx];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c] && fn(r, c)) masked[r][c] = !masked[r][c];
      }
    }
    return masked;
  }

  function penaltyScore(matrix) {
    const size = matrix.length;
    let score = 0;

    for (let r = 0; r < size; r++) {
      let count = 1;
      for (let c = 1; c < size; c++) {
        if (matrix[r][c] === matrix[r][c - 1]) { count++; }
        else { if (count >= 5) score += 3 + (count - 5); count = 1; }
      }
      if (count >= 5) score += 3 + (count - 5);
    }
    for (let c = 0; c < size; c++) {
      let count = 1;
      for (let r = 1; r < size; r++) {
        if (matrix[r][c] === matrix[r - 1][c]) { count++; }
        else { if (count >= 5) score += 3 + (count - 5); count = 1; }
      }
      if (count >= 5) score += 3 + (count - 5);
    }

    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = matrix[r][c];
        if (v === matrix[r][c + 1] && v === matrix[r + 1][c] && v === matrix[r + 1][c + 1]) score += 3;
      }
    }

    const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - 11; c++) {
        let m1 = true, m2 = true;
        for (let k = 0; k < 11; k++) {
          const v = matrix[r][c + k] ? 1 : 0;
          if (v !== pat1[k]) m1 = false;
          if (v !== pat2[k]) m2 = false;
          if (!m1 && !m2) break;
        }
        if (m1 || m2) score += 40;
      }
    }
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - 11; r++) {
        let m1 = true, m2 = true;
        for (let k = 0; k < 11; k++) {
          const v = matrix[r + k][c] ? 1 : 0;
          if (v !== pat1[k]) m1 = false;
          if (v !== pat2[k]) m2 = false;
          if (!m1 && !m2) break;
        }
        if (m1 || m2) score += 40;
      }
    }

    let dark = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) { if (matrix[r][c]) dark++; }
    }
    const pct = (dark * 100) / (size * size);
    const prev5 = Math.floor(pct / 5) * 5;
    const next5 = prev5 + 5;
    score += Math.min(Math.abs(prev5 - 50) / 5, Math.abs(next5 - 50) / 5) * 10;

    return score;
  }

  // ========== Format & Version Info ==========
  function computeFormatBits(maskIdx) {
    const data = (0b00 << 3) | maskIdx;
    let bits = data << 10;
    let tmp = bits;
    for (let i = 14; i >= 10; i--) {
      if (tmp & (1 << i)) tmp ^= 0x537 << (i - 10);
    }
    return (bits | tmp) ^ 0x5412;
  }

  function writeFormatInfo(matrix, size, maskIdx) {
    const fmt = computeFormatBits(maskIdx);
    const pos1 = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
    ];
    const pos2 = [];
    for (let i = 0; i < 7; i++) pos2.push([size - 1 - i, 8]);
    for (let i = 0; i < 8; i++) pos2.push([8, size - 8 + i]);

    for (let i = 0; i < 15; i++) {
      const bit = !!((fmt >> i) & 1);
      matrix[pos1[i][0]][pos1[i][1]] = bit;
      matrix[pos2[i][0]][pos2[i][1]] = bit;
    }
  }

  function computeVersionBits(version) {
    let bits = version << 12;
    let tmp = bits;
    for (let i = 17; i >= 12; i--) {
      if (tmp & (1 << i)) tmp ^= 0x1F25 << (i - 12);
    }
    return bits | tmp;
  }

  function writeVersionInfo(matrix, size, version) {
    if (version < 7) return;
    const vInfo = computeVersionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = !!((vInfo >> i) & 1);
      const row = Math.floor(i / 3);
      const col = i % 3;
      matrix[row][size - 11 + col] = bit;
      matrix[size - 11 + col][row] = bit;
    }
  }

  // ========== Main QR Generation ==========
  function generateQR(text) {
    if (!text) return null;
    const bytes = new TextEncoder().encode(text);
    const version = determineVersion(bytes.length);
    if (version < 0) return null;

    const codewords = buildCodewords(text, version);
    const { matrix, reserved, size } = initMatrix(version);
    placeData(matrix, reserved, codewords, version);

    let bestMask = 0;
    let bestScore = Infinity;
    for (let m = 0; m < 8; m++) {
      const masked = applyMask(matrix, reserved, m);
      writeFormatInfo(masked, size, m);
      writeVersionInfo(masked, size, version);
      const s = penaltyScore(masked);
      if (s < bestScore) { bestScore = s; bestMask = m; }
    }

    const final = applyMask(matrix, reserved, bestMask);
    writeFormatInfo(final, size, bestMask);
    writeVersionInfo(final, size, version);
    return final;
  }

  // ========== Canvas Rendering ==========
  function renderQR(matrix, canvas, options) {
    const color = options.color || '#000000';
    const moduleSize = options.moduleSize || 10;
    const qz = options.quietZone || 0;
    const label = (options.label || '').trim();

    const size = matrix.length;
    const totalModules = size + qz * 2;
    const qrPx = totalModules * moduleSize;

    var labelHeight = 0;
    var labelGap = 0;
    const labelScale = options.labelScale || 1;
    const fontSize = Math.max(16, moduleSize * size * 0.09) * labelScale;
    const pillPadX = fontSize * 1.5;
    const pillPadY = fontSize * 0.6;
    const pillRadius = fontSize * 1.1;

    if (label) {
      labelGap = moduleSize * qz || moduleSize;
      labelHeight = pillPadY * 2 + fontSize + labelGap;
    }

    canvas.width = qrPx;
    canvas.height = qrPx + labelHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color;
    const offset = qz * moduleSize;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(offset + c * moduleSize, offset + r * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    if (label) {
      ctx.font = 'bold ' + fontSize + 'px Manrope, system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const pillW = textWidth + pillPadX * 2;
      const pillH = fontSize + pillPadY * 2;
      const pillX = (qrPx - pillW) / 2;
      const pillY = qrPx + labelGap;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
      ctx.fill();

      const rv = parseInt(color.slice(1, 3), 16);
      const gv = parseInt(color.slice(3, 5), 16);
      const bv = parseInt(color.slice(5, 7), 16);
      const lum = (0.299 * rv + 0.587 * gv + 0.114 * bv) / 255;
      ctx.fillStyle = lum > 0.5 ? '#000000' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, qrPx / 2, pillY + pillH / 2);
    }
  }

  // ========== UI Logic ==========
  const input = document.getElementById('input');
  const canvas = document.getElementById('canvas');
  const placeholder = document.getElementById('placeholder');
  const charCountEl = document.getElementById('charCount');
  const dlBtn = document.getElementById('dlBtn');
  const copyBtn = document.getElementById('copyBtn');
  const fgColor = document.getElementById('fgColor');
  const modSize = document.getElementById('modSize');
  const quietZone = document.getElementById('quietZone');
  const labelInput = document.getElementById('labelText');
  const labelSize = document.getElementById('labelSize');
  const toast = document.getElementById('toast');

  let currentMatrix = null;
  let debounceTimer = null;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  function update() {
    const text = input.value;
    const bytes = new TextEncoder().encode(text);
    const len = bytes.length;
    charCountEl.textContent = len + ' / 213';
    charCountEl.classList.toggle('warn', len > 213);

    if (!text) {
      canvas.classList.add('hidden');
      placeholder.classList.remove('hidden');
      placeholder.className = 'qr-placeholder';
      placeholder.textContent = 'Type something to generate a QR code';
      dlBtn.disabled = true;
      copyBtn.disabled = true;
      currentMatrix = null;
      return;
    }

    const matrix = generateQR(text);

    if (!matrix) {
      canvas.classList.add('hidden');
      placeholder.classList.remove('hidden');
      placeholder.className = 'qr-error';
      placeholder.textContent = 'Text too long (max 213 bytes for M-level ECC)';
      dlBtn.disabled = true;
      copyBtn.disabled = true;
      currentMatrix = null;
      return;
    }

    currentMatrix = matrix;
    placeholder.classList.add('hidden');
    canvas.classList.remove('hidden');

    renderQR(matrix, canvas, {
      color: fgColor.value,
      moduleSize: parseInt(modSize.value),
      quietZone: parseInt(quietZone.value),
      label: labelInput.value,
      labelScale: parseFloat(labelSize.value) / 100,
    });

    dlBtn.disabled = false;
    copyBtn.disabled = false;
  }

  function debouncedUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(update, 150);
  }

  input.addEventListener('input', debouncedUpdate);
  labelInput.addEventListener('input', update);
  fgColor.addEventListener('input', update);
  modSize.addEventListener('input', update);
  quietZone.addEventListener('input', update);
  labelSize.addEventListener('input', update);

  dlBtn.addEventListener('click', function () {
    if (!currentMatrix) return;
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.png';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded!');
    });
  });

  copyBtn.addEventListener('click', function () {
    if (!currentMatrix) return;
    canvas.toBlob(function (blob) {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(
        function () { showToast('Copied to clipboard!'); },
        function () { showToast('Copy failed — try downloading instead'); }
      );
    });
  });
})();
