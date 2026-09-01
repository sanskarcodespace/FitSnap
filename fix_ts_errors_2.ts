import fs from 'fs';

const fixFile = (path: string) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    'const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip")',
    'const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined'
  );
  content = content.replace(
    'let ipAddressPartial = ipAddress',
    'let ipAddressPartial: string | undefined = ipAddress'
  );
  fs.writeFileSync(path, content);
};

fixFile('src/app/(public)/login/actions.ts');
fixFile('src/app/(public)/signup/actions.ts');
