import fs from 'fs';
const path = 'src/components/layout/client-layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert skip link
content = content.replace(
  '<div className="flex flex-col min-h-screen w-full bg-[var(--background)]">',
  '<div className="flex flex-col min-h-screen w-full bg-[var(--background)]">\n      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-[var(--background)] focus:text-[var(--foreground)] focus:font-medium">\n        Skip to main content\n      </a>'
);

// Add id="main-content" and tabIndex={-1}
content = content.replace(
  '<main className="flex-1 max-w-7xl mx-auto w-full pt-16 px-4 pb-24 md:pb-8">',
  '<main id="main-content" className="flex-1 max-w-7xl mx-auto w-full pt-16 px-4 pb-24 md:pb-8" tabIndex={-1}>'
);

fs.writeFileSync(path, content);
console.log("Patched client-layout.tsx");
