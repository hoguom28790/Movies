
const fs = require('fs');
const content = fs.readFileSync('src/app/(phim)/xem/[...slug]/page.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 135; i < 155; i++) {
    console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}
