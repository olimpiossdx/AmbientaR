import fs from 'fs';

const files = process.argv.slice(2);
for (const p of files) {
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('motion')) continue;
  c = c.replaceAll('</motion>', '</motion>');
  c = c.replaceAll('<motion ', '<motion ');
  c = c.replaceAll('<motion>', '<motion>');
  fs.writeFileSync(p, c);
  console.log('fixed', p);
}
