const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['src', 'public'];
const HOVER_PATTERNS = [
  /:hover/g,
  /hover:/g,
  /group-hover:/g,
  /transition(-[a-zA-Z0-9-]*)?/g,
  /duration-\d+/g,
  /ease-[a-zA-Z0-9-]+/g
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove hover/transition/tailwind classes in JS/TSX/CSS files
  HOVER_PATTERNS.forEach(pattern => {
    content = content.replace(pattern, '');
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (
      /\.(js|jsx|ts|tsx|css|scss|mjs)$/.test(file)
    ) {
      processFile(fullPath);
    }
  });
}

TARGET_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) walk(dir);
});

// Optionally, add a global CSS rule to forcibly disable transitions on hover
const globalCSS = path.join('src', 'app', 'globals.css');
if (fs.existsSync(globalCSS)) {
  fs.appendFileSync(
    globalCSS,
    '\n* { transition: none !important; animation: none !important; }\n'
  );
  console.log('Appended global transition/animation override to globals.css');
} 