import fs from 'fs';
import path from 'path';

// 1. Move getThumbnailUrl to src/lib/utils.ts
let utilsContent = fs.readFileSync('src/lib/utils.ts', 'utf8');
if (!utilsContent.includes('getThumbnailUrl')) {
  utilsContent += `
export function getThumbnailUrl(originalUrl: string): string {
  if (!originalUrl) return ""
  if (originalUrl.endsWith("-thumb.jpg") || !originalUrl.endsWith(".jpg")) return originalUrl
  return originalUrl.replace(/\\.jpg$/, "-thumb.jpg")
}
`;
  fs.writeFileSync('src/lib/utils.ts', utilsContent);
}

// 2. Remove getThumbnailUrl from src/lib/upload.ts
let uploadContent = fs.readFileSync('src/lib/upload.ts', 'utf8');
uploadContent = uploadContent.replace(/export function getThumbnailUrl[\s\S]*?}\n/, '');
fs.writeFileSync('src/lib/upload.ts', uploadContent);

// 3. Fix imports in DailyFoodLogView.tsx and avatar.tsx
const replaceInFile = (file: string, search: string, replacement: string) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replacement);
  fs.writeFileSync(file, content);
};
replaceInFile('src/components/food/DailyFoodLogView.tsx', 'import { getThumbnailUrl } from "@/lib/upload"', 'import { getThumbnailUrl } from "@/lib/utils"');
replaceInFile('src/components/ui/avatar.tsx', 'import { getThumbnailUrl } from "@/lib/upload"', 'import { getThumbnailUrl } from "@/lib/utils"');

// 4. Fix syntax error in SettingsClient.tsx
let settingsContent = fs.readFileSync('src/app/(authenticated)/client/settings/SettingsClient.tsx', 'utf8');
settingsContent = settingsContent.replace(
  `import { \n  requestEmailChange, \n  updatePassword, \n  updateClientNotificationPreferences,\nimport { autoCaptureClientTimezone } from "../../settings/actions"`,
  `import { \n  requestEmailChange, \n  updatePassword, \n  updateClientNotificationPreferences,\n  autoCaptureClientTimezone\n} from "../../settings/actions"`
);
fs.writeFileSync('src/app/(authenticated)/client/settings/SettingsClient.tsx', settingsContent);

// 5. Fix syntax error in client-report.ts
let clientReportContent = fs.readFileSync('src/lib/data/client-report.ts', 'utf8');
clientReportContent = clientReportContent.replace(
  `  // 7. Progress Photos
  let photosSection = null;
  if (photoCountCurr > 0) {
  let photosSection = null;
  if (photoCountCurr > 0) {
    photosSection = { count: photoCountCurr };
  }`,
  `  // 7. Progress Photos
  let photosSection = null;
  if (photoCountCurr > 0) {
    photosSection = { count: photoCountCurr };
  }`
);
fs.writeFileSync('src/lib/data/client-report.ts', clientReportContent);

console.log("Fixed build errors.");
