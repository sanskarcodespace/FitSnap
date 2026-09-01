import fs from 'fs';

const fixFormDataGet = (file: string) => {
  let content = fs.readFileSync(file, 'utf8');
  // Simple fix: append ' || undefined' to formData.get calls if they are causing issues
  // But let's check the files exactly
};

// 1. Fix upload.ts
let uploadContent = fs.readFileSync('src/lib/upload.ts', 'utf8');
uploadContent = uploadContent.replace('.withMetadata(false) // explicitly strip EXIF/ICC metadata', '');
fs.writeFileSync('src/lib/upload.ts', uploadContent);

