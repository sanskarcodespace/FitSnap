import fs from 'fs';
const path = 'src/components/ui/avatar.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'alt={alt || "Avatar"}',
  'alt={alt || "Profile photo"}'
);

fs.writeFileSync(path, content);
console.log("Patched avatar.tsx");
