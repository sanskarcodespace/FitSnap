import fs from 'fs';
const path = 'src/app/(authenticated)/client/messages/ClientMessages.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the messages area container with role="log"
content = content.replace(
  '<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-neutral-50)]">',
  '<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-neutral-50)]" role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions">'
);

// Add visually hidden prefix to message bubbles
content = content.replace(
  '<p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{msg.body}</p>',
  '<p className="whitespace-pre-wrap text-sm leading-relaxed break-words">\n                          <span className="sr-only">{isMine ? "You: " : `Coach: `}</span>\n                          {msg.body}\n                        </p>'
);

fs.writeFileSync(path, content);
console.log("Patched ClientMessages.tsx");
