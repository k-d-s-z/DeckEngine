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
