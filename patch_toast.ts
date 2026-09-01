import fs from 'fs';
const path = 'src/components/ui/toast.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-[var(--radius-md)] p-4 pr-8 shadow-[var(--shadow-md)] transition-all',
  'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-[var(--radius-md)] p-4 pr-8 shadow-[var(--shadow-md)] motion-safe:transition-all motion-reduce:transition-none'
);

content = content.replace(
  'role="status"',
  'role="status" aria-live="polite" aria-atomic="true"'
);

fs.writeFileSync(path, content);
console.log("Patched toast.tsx");
