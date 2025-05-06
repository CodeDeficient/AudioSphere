// .github/scripts/update-roadmap-checkbox.js
const fs = require('fs');
const path = require('path');

const overviewPath = path.join(process.cwd(), 'PROJECT_OVERVIEW.md');
const issueNumber = process.env.GITHUB_EVENT_ISSUE_NUMBER || process.env.INPUT_ISSUE_NUMBER || process.env.ISSUE_NUMBER || (process.env.GITHUB_EVENT_PATH && require(process.env.GITHUB_EVENT_PATH).issue.number);

if (!issueNumber) {
  console.error('No issue number found in environment.');
  process.exit(1);
}

let content = fs.readFileSync(overviewPath, 'utf8');
const regex = new RegExp(`- \[ \]([^\n]*\(#${issueNumber}\)[^\n]*)`, 'g');
let changed = false;

content = content.replace(regex, (match, p1) => {
  changed = true;
  return `- [x]${p1}`;
});

if (changed) {
  fs.writeFileSync(overviewPath, content, 'utf8');
  console.log(`Checked off roadmap item for issue #${issueNumber}`);
  process.exit(0);
} else {
  console.log(`No matching unchecked roadmap item found for issue #${issueNumber}`);
  process.exit(0);
} 