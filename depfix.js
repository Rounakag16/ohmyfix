// depfix.js
const { execSync } = require('child_process');

function getConflicts() {
  try {
    const output = execSync('npm ls --json', { stdio: 'pipe' });
    const tree = JSON.parse(output);
    const conflicts = [];
    if (tree.problems) {
      conflicts.push(...tree.problems);
    }
    return conflicts;
  } catch (err) {
    return [err.message];
  }
}

module.exports = { getConflicts };