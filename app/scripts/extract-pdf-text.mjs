import fs from 'fs';
import { PDFParse } from 'pdf-parse';

const file = process.argv[2];
const buffer = fs.readFileSync(file);
const parser = new PDFParse({ data: buffer });
try {
  const { text } = await parser.getText();
  const out = process.argv[3] || file.replace(/\.pdf$/i, '.txt');
  fs.writeFileSync(out, text);
  console.log('chars', text.length, '->', out);
} finally {
  await parser.destroy();
}
