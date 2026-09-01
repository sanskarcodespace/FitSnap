import fs from 'fs';
const path = 'src/components/layout/marketing-layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert skip link at the top, right inside the main container div
content = content.replace(
  '<div className="flex min-h-screen flex-col bg-[var(--background)]">',
  '<div className="flex min-h-screen flex-col bg-[var(--background)]">\n      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-[var(--background)] focus:text-[var(--foreground)] focus:font-medium">\n        Skip to main content\n      </a>'
);

// Add id="main-content" to the main element
content = content.replace(
  '<main className="flex-1">',
  '<main id="main-content" className="flex-1" tabIndex={-1}>'
);

fs.writeFileSync(path, content);
console.log("Patched marketing-layout.tsx");
