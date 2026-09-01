import fs from 'fs';
const path = 'src/app/globals.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '--color-accent: #f59e0b; /* Amber */',
  '--color-accent: #b45309; /* Amber 700 for WCAG AA */'
);

content = content.replace(
  '--color-macro-calories: #3b82f6;',
  '--color-macro-calories: #1d4ed8; /* Blue 700 */'
);
content = content.replace(
  '--color-macro-protein: #ef4444;',
  '--color-macro-protein: #b91c1c; /* Red 700 */'
);
content = content.replace(
  '--color-macro-carbs: #10b981;',
  '--color-macro-carbs: #047857; /* Emerald 700 */'
);
content = content.replace(
  '--color-macro-fat: #f59e0b;',
  '--color-macro-fat: #b45309; /* Amber 700 */'
);
content = content.replace(
  '--color-macro-water: #0ea5e9;',
  '--color-macro-water: #0369a1; /* Sky 700 */'
);

fs.writeFileSync(path, content);
console.log("Patched globals.css");
