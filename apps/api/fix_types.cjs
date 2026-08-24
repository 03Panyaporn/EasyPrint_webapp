const fs = require('fs');

const files = [
  'src/auth/routes.ts',
  'src/cron.ts',
  'src/routes/admin.ts',
  'src/routes/messages.ts',
  'src/routes/orders.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/typeId:\s*(\d+),/g, (match, p1) => {
    const category = parseInt(p1) === 3 ? '"chat"' : '"general"';
    return `typeId: ${p1},\n      category: ${category},`;
  });
  fs.writeFileSync(file, content);
}
console.log('Fixed types!');
