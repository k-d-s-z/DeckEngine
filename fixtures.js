// Pliki testowe generowane w locie – repozytorium nie zawiera cudzych materiałów.
const zlib = require("node:zlib");

// Poprawny PNG o zadanym rozmiarze i kolorze (RGB).
function png(w = 60, h = 84, rgb = [120, 80, 60]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Jednostronicowy PDF A4 z siatką 3x3 ciemnych "kart" na białym tle.
function gridPdf() {
  const W = 595,
    H = 842,
    cw = 150,
    ch = 210,
    gap = 12;
  const x0 = (W - (3 * cw + 2 * gap)) / 2,
    y0 = (H - (3 * ch + 2 * gap)) / 2;
  let ops = "";
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const x = x0 + c * (cw + gap),
        y = y0 + r * (ch + gap);
      ops += `0.35 0.25 0.2 rg ${x} ${y} ${cw} ${ch} re f\n0.9 0.85 0.8 rg ${x + 15} ${y + 15} ${cw - 30} ${ch - 30} re f\n`;
    }
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources << >> >>`,
    `<< /Length ${ops.length} >>\nstream\n${ops}endstream`,
  ];
  let out = "%PDF-1.4\n";
  const offs = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offs.forEach((o) => (out += String(o).padStart(10, "0") + " 00000 n \n"));
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

module.exports = { png, gridPdf };

// ---------------------------------------------------------------- ZIP (z możliwością psucia)
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

// entries: { name, data: Buffer, method = 8|0, crc, usize, csize, flags, raw: Buffer (gotowe skompresowane dane), offset }
function zip(entries, { cdCount } = {}) {
  const parts = [];
  const cd = [];
  let pos = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8");
    const method = e.method ?? 8;
    const comp = e.raw ?? (method === 8 ? zlib.deflateRawSync(e.data) : e.data);
    const crc = e.crc ?? crc32(e.data);
    const usize = e.usize ?? e.data.length;
    const csize = e.csize ?? comp.length;
    const flags = e.flags ?? 0;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(flags, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(csize, 18);
    lh.writeUInt32LE(usize, 22);
    lh.writeUInt16LE(name.length, 26);
    const off = e.offset ?? pos;
    parts.push(lh, name, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(flags, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(csize, 20);
    ch.writeUInt32LE(usize, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(off, 42);
    cd.push(ch, name);
    pos += 30 + name.length + comp.length;
  }
  const cdBuf = Buffer.concat(cd);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  const n = cdCount ?? entries.length;
  eocd.writeUInt16LE(n, 8);
  eocd.writeUInt16LE(n, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(pos, 16);
  return Buffer.concat([...parts, cdBuf, eocd]);
}

// PDF z n stronami (współdzielona treść: siatka 3x3), do testów dużych dokumentów.
function multiPagePdf(n) {
  const W = 595, H = 842, cw = 150, ch = 210, gap = 12;
  const x0 = (W - (3 * cw + 2 * gap)) / 2, y0 = (H - (3 * ch + 2 * gap)) / 2;
  let ops = "";
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const x = x0 + c * (cw + gap), y = y0 + r * (ch + gap);
      ops += `0.35 0.25 0.2 rg ${x} ${y} ${cw} ${ch} re f\n0.9 0.85 0.8 rg ${x + 15} ${y + 15} ${cw - 30} ${ch - 30} re f\n`;
    }
  const contentId = n + 3;
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${Array.from({ length: n }, (_, i) => `${i + 3} 0 R`).join(" ")}] /Count ${n} >>`];
  for (let i = 0; i < n; i++) objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${contentId} 0 R /Resources << >> >>`);
  objs.push(`<< /Length ${ops.length} >>\nstream\n${ops}endstream`);
  let out = "%PDF-1.4\n";
  const offs = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offs.forEach((o) => (out += String(o).padStart(10, "0") + " 00000 n \n"));
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

module.exports.zip = zip;
module.exports.crc32 = crc32;
module.exports.multiPagePdf = multiPagePdf;
