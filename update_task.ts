import fs from 'fs';
const path = '/Users/sanskar/.gemini/antigravity-ide/brain/c168217c-b899-4458-9696-73083fe285a3/task.md';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '- `[/]` Fix missing `alt` text on user avatars (`avatar.tsx`) and progress photos (`src/app/(authenticated)/client/progress/BodyMeasurementsTab.tsx` or wherever they render in `client/progress`).',
  '- `[x]` Fix missing `alt` text on user avatars (`avatar.tsx`) and progress photos (`src/app/(authenticated)/client/progress/BodyMeasurementsTab.tsx` or wherever they render in `client/progress`).'
);
content = content.replace(
  '- `[ ]` Add a screen-reader-only `<table>` alongside the SVG in `trend-chart.tsx` and hide the SVG itself (`aria-hidden="true"`).',
  '- `[x]` Add a screen-reader-only `<table>` alongside the SVG in `trend-chart.tsx` and hide the SVG itself (`aria-hidden="true"`).'
);
content = content.replace(
  '- `[ ]` Review semantic colors in `globals.css` (specifically `--color-accent` and `--color-macro-*` variables) to ensure >= 4.5:1 ratio against white/light backgrounds. Update to `-600` or `-700` shades as necessary.',
  '- `[x]` Review semantic colors in `globals.css` (specifically `--color-accent` and `--color-macro-*` variables) to ensure >= 4.5:1 ratio against white/light backgrounds. Update to `-600` or `-700` shades as necessary.'
);
content = content.replace(
  '- `[ ]` Audit high-frequency tiny touch targets (e.g., period selector toggles, quick-add water buttons) to enforce 44x44px minimum sizing (`min-h-[44px]`).',
  '- `[x]` Audit high-frequency tiny touch targets (e.g., period selector toggles, quick-add water buttons) to enforce 44x44px minimum sizing (`min-h-[44px]`).'
);
content = content.replace(
  '- `[ ]` Verify `prefers-reduced-motion` compliance in globally animated elements (or inject a global CSS override).',
  '- `[x]` Verify `prefers-reduced-motion` compliance in globally animated elements (or inject a global CSS override).'
);
content = content.replace(
  '- `[ ]` Final regression pass across 375px, 768px, and 1024px to ensure no layouts broke during hardening.',
  '- `[x]` Final regression pass across 375px, 768px, and 1024px to ensure no layouts broke during hardening.'
);
content = content.replace(
  '- `[ ]` Compile final `ACCESSIBILITY_AUDIT.md` outlining the standard, the methodology, the specific fixes implemented across components/css, and a conclusion.',
  '- `[x]` Compile final `ACCESSIBILITY_AUDIT.md` outlining the standard, the methodology, the specific fixes implemented across components/css, and a conclusion.'
);

fs.writeFileSync(path, content);
console.log("Updated task.md");
