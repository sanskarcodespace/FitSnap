import fs from 'fs';
const path = 'src/app/(authenticated)/client/habits/ClientHabitsView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<button\n                            disabled={isPending}\n                            onClick={() => handleToggle(item.id, isChecked)}\n                            className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${',
  '<button\n                            role="checkbox"\n                            aria-checked={isChecked}\n                            aria-label={`Mark ${item.name} as ${isChecked ? "incomplete" : "complete"}`}\n                            disabled={isPending}\n                            onClick={() => handleToggle(item.id, isChecked)}\n                            className={`mt-0.5 relative after:absolute after:-inset-3 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${'
);

// We should also patch the "Add Note" button to have a bigger touch target.
content = content.replace(
  'className="text-[var(--color-primary-700)] font-semibold hover:underline flex items-center gap-1"\n                                onClick={() => handleStartEditNote(item.id, comp.note)}',
  'className="text-[var(--color-primary-700)] font-semibold hover:underline flex items-center gap-1 p-2 -ml-2"\n                                onClick={() => handleStartEditNote(item.id, comp.note)}'
);

fs.writeFileSync(path, content);
console.log("Patched ClientHabitsView.tsx");
