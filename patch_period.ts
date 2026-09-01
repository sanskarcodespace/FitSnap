import fs from 'fs';
const path = 'src/components/ui/period-selector.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'className="px-3 py-2 border border-[var(--color-neutral-300)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] w-full md:w-40"',
  'className="px-3 py-2 min-h-[44px] border border-[var(--color-neutral-300)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] w-full md:w-40"'
);

content = content.replace(
  /className="px-3 py-2 border border-\[var\(--color-neutral-300\)\] rounded-md text-sm w-full"/g,
  'className="px-3 py-2 min-h-[44px] border border-[var(--color-neutral-300)] rounded-md text-sm w-full"'
);

fs.writeFileSync(path, content);
console.log("Patched period-selector.tsx");
