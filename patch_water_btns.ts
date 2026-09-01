import fs from 'fs';
const path = 'src/components/food/DailyFoodLogView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '              variant="secondary" \n              className="flex-1 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)]"',
  '              variant="secondary" \n              className="flex-1 min-h-[44px] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)]"'
);

content = content.replace(
  '              variant="secondary" \n              className="flex-1 bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] text-[var(--color-neutral-700)]"',
  '              variant="secondary" \n              className="flex-1 min-h-[44px] bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] text-[var(--color-neutral-700)]"'
);

fs.writeFileSync(path, content);
console.log("Patched DailyFoodLogView.tsx");
