#!/usr/bin/env node
// cli.js
const { intro, select, spinner, outro, note, confirm, text } = require('@clack/prompts');
const figlet = require('figlet');
const { getConflicts } = require('./depfix');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Dynamic import for chalk
let chalk;
(async () => {
  chalk = (await import('chalk')).default;

  console.log(
    chalk.blue(
      figlet.textSync('OhMyFix', { horizontalLayout: 'full' })
    )
  );

  const program = new Command();
  program
    .version('1.0.2')  // Update to 1.0.2 after testing
    .description('OhMyFix CLI Tool');

  program
    .action(async () => {
      await main();
    });

  program
    .command('ai')
    .description('Perform an AI-powered code review with error fixes')
    .action(async () => {
      await aiCodeReview();
    });

  program
    .command('setup')
    .description('Set up your Google Generative AI API key')
    .action(async () => {
      await setupApiKey();
    });

  await program.parseAsync(process.argv);
})().catch(console.error);

async function main() {
  if (!process.env.GOOGLE_API_KEY) {
    console.log(chalk.yellow('⚠ No Google API key found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const action = await select({
    message: 'What do you need help with?',
    options: [
      { value: 'depfix', label: '🔧 Fix dependency conflicts' },
      { value: 'review', label: '🤖 AI Code Review' },
    ],
  });

  if (action === 'depfix') {
    const s = spinner();
    s.start('Analyzing package.json');
    const conflicts = getConflicts();
    s.stop(conflicts.length > 0 
      ? `Found ${conflicts.length} conflicts!` 
      : 'No conflicts found!'
    );
    console.log(conflicts.join('\n'));
  } else if (action === 'review') {
    await aiCodeReview();
  }

  outro("You're all set! 🎉");
}

async function aiCodeReview() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('Error: Google API key not found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const s = spinner();
  s.start('Scanning codebase for errors...');

  const codeFiles = await scanCodebase(process.cwd());
  if (codeFiles.length === 0) {
    s.stop(chalk.red('Error: No .js files found in the current directory'));
    return;
  }

  const codeContent = await Promise.all(
    codeFiles.map(async file => {
      const content = await fs.readFile(file, 'utf8');
      return { file: path.relative(process.cwd(), file), content };
    })
  );

  s.stop('Codebase scanned! Analyzing errors...');

  for (const { file, content } of codeContent) {
    const prompt = `
      Analyze this JavaScript code from file "${file}":
      \`\`\`javascript
      ${content}
      \`\`\`
      - List only syntax errors or typos (e.g., missing semicolons, undefined variables, wrong method names).
      - For each error, provide:
        - The exact line of code containing the error (as it appears in the original code).
        - The corrected line of code as the solution.
      - If no errors, return "No errors found".
      - Format each error and solution as:
        Error: <exact erroneous line>
        Solution: \`\`\`javascript
        <corrected line>
        \`\`\`
    `;

    try {
      const result = await model.generateContent(prompt);
      const review = result.response.text().trim();

      if (review === 'No errors found') {
        note(chalk.green(`✓ ${file}: No errors found`), 'Code Check');
        continue;
      }

      const lines = review.split('\n');
      const errors = [];
      let currentError = null;

      for (const line of lines) {
        if (line.startsWith('Error:')) {
          currentError = { erroneousLine: line.replace('Error: ', '').trim() };
        } else if (line.startsWith('Solution: ```javascript')) {
          const solutionLines = [];
          for (let i = lines.indexOf(line) + 1; i < lines.length && !lines[i].startsWith('```'); i++) {
            solutionLines.push(lines[i]);
          }
          currentError.solution = solutionLines.join('\n').trim();
          errors.push(currentError);
          currentError = null;
        }
      }

      for (const error of errors) {
        note(
          `${chalk.red('✗ Error:')} ${error.erroneousLine}\n\n${chalk.cyan('Solution:')}\n${error.solution}`,
          `File: ${file}`
        );

        const applyFix = await confirm({
          message: 'Apply this fix?',
          initialValue: true,
        });

        if (applyFix) {
          const fileLines = content.split('\n');
          let foundMatch = false;

          // Try exact match first, then relaxed match (ignoring whitespace)
          const updatedLines = fileLines.map(line => {
            if (line.trim() === error.erroneousLine.trim()) {
              foundMatch = true;
              return error.solution;
            }
            return line;
          });

          if (!foundMatch) {
            // Fallback: Look for a line containing the erroneous snippet
            for (let i = 0; i < fileLines.length; i++) {
              if (fileLines[i].includes(error.erroneousLine.trim())) {
                updatedLines[i] = error.solution;
                foundMatch = true;
                break;
              }
            }
          }

          if (foundMatch) {
            const updatedContent = updatedLines.join('\n');
            await fs.writeFile(path.join(process.cwd(), file), updatedContent);
            note(chalk.green('✓ Fix applied successfully!'), `File: ${file}`);
          } else {
            note(chalk.yellow('⚠ Could not apply fix: Line not found in file'), `File: ${file}`);
            console.log(chalk.gray(`Debug - Original: "${error.erroneousLine}", File content:\n${content}`));
          }
        } else {
          note(chalk.yellow('⚠ Fix skipped'), `File: ${file}`);
        }
      }
    } catch (err) {
      console.error(chalk.red(`Error analyzing ${file}: ${err.message}`));
    }
  }

  outro('Code review complete!');
}

async function setupApiKey() {
  intro('OhMyFix Setup');
  const apiKey = await text({
    message: 'Please enter your Google Generative AI API key (get it from https://makersuite.google.com/app/apikey):',
    placeholder: 'AI...',
    validate: value => {
      if (!value || !value.startsWith('AI')) return 'Please enter a valid Google API key starting with "AI"';
    }
  });

  const envContent = `GOOGLE_API_KEY=${apiKey}\n`;
  await fs.writeFile(path.join(process.cwd(), '.env'), envContent, { flag: 'w' });
  outro('Setup complete! Your API key has been saved to .env');
}

async function scanCodebase(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const jsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && file.name !== 'node_modules') {
      jsFiles.push(...await scanCodebase(fullPath));
    } else if (file.isFile() && fullPath.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }
  return jsFiles;
}