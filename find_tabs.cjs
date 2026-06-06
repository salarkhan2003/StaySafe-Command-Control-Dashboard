const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const searchTabs = ['pg-applications', 'bookings', 'occupancy', 'verifications', 'audits', 'compliance', 'users'];
content.split('\n').forEach((line, idx) => {
  const lineNum = idx + 1;
  searchTabs.forEach(tab => {
    if (line.includes(`currentTab === '${tab}'`) || line.includes(`currentTab === "${tab}"`)) {
      console.log(`Line ${lineNum}: ${line.trim()}`);
    }
  });
});
