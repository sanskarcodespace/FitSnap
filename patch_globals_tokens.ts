import fs from 'fs';
const path = 'src/app/globals.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('--radius-md: 0.375rem;', '--radius-md: 0.5rem;');
content = content.replace('--radius-lg: 0.5rem;', '--radius-lg: 0.75rem;');

content = content.replace(
  '--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);',
  '--shadow-sm: 0 2px 4px 0 rgb(0 0 0 / 0.05);'
);
content = content.replace(
  '--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);',
  '--shadow-md: 0 4px 12px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04);'
);
content = content.replace(
  '--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);',
  '--shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);'
);

fs.writeFileSync(path, content);
console.log("Patched globals.css");
