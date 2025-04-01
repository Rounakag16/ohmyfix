// depfix.js
const fs = require('fs').promises;
const path = require('path');

async function getConflicts() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  try {
    const pkgContent = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);

    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};
    const conflicts = [];

    for (const dep in deps) {
      if (devDeps[dep] && deps[dep] !== devDeps[dep]) {
        conflicts.push(
          `Conflict: "${dep}" - dependencies: "${deps[dep]}", devDependencies: "${devDeps[dep]}"`
        );
      }
    }

    // Optional: Check for empty or missing sections
    if (Object.keys(deps).length === 0 && Object.keys(devDeps).length === 0) {
      return ['No dependencies to check'];
    }

    return conflicts;
  } catch (err) {
    return [`Error: Could not process package.json - ${err.message}`];
  }
}

module.exports = { getConflicts };