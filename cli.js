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

  // Load or initialize config
  const configPath = path.join(process.cwd(), 'ohmyfix.config.json');
  let config = { theme: null, promptStyle: 'detailed', shortcuts: {} };
  try {
    const configFile = await fs.readFile(configPath, 'utf8');
    config = { ...config, ...JSON.parse(configFile) };
  } catch (err) {}

  // Define four themes with gray added
  const themes = {
    dark: { 
      primary: chalk.white, 
      accent: chalk.cyan, 
      error: chalk.red, 
      success: chalk.green, 
      warn: chalk.yellow, 
      gray: chalk.gray 
    },
    pookiepink: { 
      primary: chalk.hex('#ff69b4'), 
      accent: chalk.hex('#ffb6c1'), 
      error: chalk.red, 
      success: chalk.hex('#98fb98'), 
      warn: chalk.hex('#ffa500'), 
      gray: chalk.hex('#a9a9a9') 
    },
    nord: { 
      primary: chalk.hex('#d8dee9'), 
      accent: chalk.hex('#88c0d0'), 
      error: chalk.hex('#bf616a'), 
      success: chalk.hex('#a3be8c'), 
      warn: chalk.hex('#ebcb8b'), 
      gray: chalk.hex('#4c566a') 
    },
    solarized: { 
      primary: chalk.hex('#839496'), 
      accent: chalk.hex('#2aa198'), 
      error: chalk.hex('#dc322f'), 
      success: chalk.hex('#859900'), 
      warn: chalk.hex('#b58900'), 
      gray: chalk.hex('#657b83') 
    }
  };

  let theme = config.theme ? themes[config.theme] : null;
  if (!theme) {
    intro(chalk.bold('Welcome to OhMyFix! Let’s get you started...'));
    const selectedTheme = await select({
      message: 'Choose your theme:',
      options: [
        { value: 'dark', label: 'Dark (White text, cyan accents)' },
        { value: 'pookiepink', label: 'Pookie Pink (Playful pink vibes)' },
        { value: 'nord', label: 'Nord (Cool, muted tones)' },
        { value: 'solarized', label: 'Solarized (Warm, balanced colors)' }
      ]
    });
    config.theme = selectedTheme;
    theme = themes[selectedTheme];
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    note(theme.success('✓ Theme set and saved to ohmyfix.config.json!'), 'Setup');
  }

  console.log(theme.primary(figlet.textSync('OhMyFix', { horizontalLayout: 'full' })));

  const program = new Command();
  program
    .version('1.0.8')
    .description('OhMyFix CLI Tool - AI-powered coding assistant with customizable UI and shortcuts')
    .argument('[file]', 'File to fix (e.g., hello.js)')
    .option('--shortcut', 'Fix errors or generate code in the specified file and overwrite it')
    .action(async (file, options) => {
      if (file && options.shortcut) {
        await fixSpecificFile(file, theme, config);
      } else {
        await main(theme, config);
      }
    });

  program.command('ai').description('Perform an AI-powered code review with error fixes').action(async () => await aiCodeReview(theme, config));
  program.command('setup').description('Set up your Google Generative AI API key').action(async () => await setupApiKey(theme));
  program.command('snippets').description('Suggest reusable code snippets').action(async () => await suggestSnippets(theme, config));
  program.command('lint').description('Run real-time linting on codebase').action(async () => await lintCodebase(theme, config));
  program.command('debug').description('Get debug suggestions for common errors').action(async () => await debugHelper(theme, config));
  program.command('shortcuts').description('Manage coding shortcuts like oh-my-zsh aliases').action(async () => await manageShortcuts(theme, config));
  program.command('snippetfix').description('Fix errors in a selected code snippet (any language)').action(async () => await snippetFix(theme, config));

  await program.parseAsync(process.argv);
})().catch(console.error);

async function main(theme, config) {
  if (!process.env.GOOGLE_API_KEY) {
    console.log(theme.warn('⚠ No Google API key found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const action = await select({
    message: 'What do you need help with?',
    options: [
      { value: 'depfix', label: '🔧 Fix dependency conflicts' },
      { value: 'review', label: '🤖 AI Code Review' },
      { value: 'snippets', label: '📜 Suggest Code Snippets' },
      { value: 'lint', label: '✅ Lint Codebase' },
      { value: 'debug', label: '🐞 Debug Helper' },
      { value: 'shortcuts', label: '⚡ Manage Shortcuts' },
      { value: 'snippetfix', label: '✂️ Fix Selected Snippet (Any Language)' }
    ],
    compact: config.promptStyle === 'compact'
  });

  if (action === 'depfix') {
    const s = spinner();
    s.start('Analyzing package.json');
    const conflicts = getConflicts();
    s.stop(conflicts.length > 0 ? `Found ${conflicts.length} conflicts!` : 'No conflicts found!');
    console.log(conflicts.join('\n'));
  } else if (action === 'review') {
    await aiCodeReview(theme, config);
  } else if (action === 'snippets') {
    await suggestSnippets(theme, config);
  } else if (action === 'lint') {
    await lintCodebase(theme, config);
  } else if (action === 'debug') {
    await debugHelper(theme, config);
  } else if (action === 'shortcuts') {
    await manageShortcuts(theme, config);
  } else if (action === 'snippetfix') {
    await snippetFix(theme, config);
  }

  outro(theme.success("You're all set! 🎉"));
}

async function aiCodeReview(theme, config) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(theme.error('Error: Google API key not found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const s = spinner();
  s.start('Scanning codebase for errors...');

  const codeFiles = await scanCodebase(process.cwd());
  if (codeFiles.length === 0) {
    s.stop(theme.error('Error: No .js files found in the current directory'));
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
        - The exact line of code containing the error, without extra quotes or formatting beyond what's in the original code.
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
        note(theme.success(`✓ ${file}: No errors found`), 'Code Check', { compact: config.promptStyle === 'compact' });
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
          `${theme.error('✗ Error:')} ${error.erroneousLine}\n\n${theme.accent('Solution:')}\n${error.solution}`,
          `File: ${file}`,
          { compact: config.promptStyle === 'compact' }
        );

        const applyFix = await confirm({
          message: 'Apply this fix?',
          initialValue: true,
          compact: config.promptStyle === 'compact'
        });

        if (applyFix) {
          const fileLines = content.split('\n');
          let foundMatch = false;

          const normalizedErroneousLine = error.erroneousLine.replace(/^["']|["']$/g, '').trim();

          const updatedLines = fileLines.map(line => {
            const normalizedLine = line.replace(/^["']|["']$/g, '').trim();
            if (normalizedLine === normalizedErroneousLine) {
              foundMatch = true;
              return error.solution;
            }
            return line;
          });

          if (!foundMatch) {
            for (let i = 0; i < fileLines.length; i++) {
              const normalizedLine = fileLines[i].replace(/^["']|["']$/g, '').trim();
              if (normalizedLine.includes(normalizedErroneousLine)) {
                updatedLines[i] = error.solution;
                foundMatch = true;
                break;
              }
            }
          }

          if (foundMatch) {
            const updatedContent = updatedLines.join('\n');
            await fs.writeFile(path.join(process.cwd(), file), updatedContent);
            note(theme.success('✓ Fix applied successfully!'), `File: ${file}`, { compact: config.promptStyle === 'compact' });
          } else {
            note(theme.warn('⚠ Could not apply fix: Line not found'), `File: ${file}`, { compact: config.promptStyle === 'compact' });
            console.log(theme.gray(`Debug - Original: "${error.erroneousLine}", Normalized: "${normalizedErroneousLine}", File content:\n${content}`));
          }
        } else {
          note(theme.warn('⚠ Fix skipped'), `File: ${file}`, { compact: config.promptStyle === 'compact' });
        }
      }
    } catch (err) {
      console.error(theme.error(`Error analyzing ${file}: ${err.message}`));
    }
  }

  outro(theme.success('Code review complete!'));
}

async function setupApiKey(theme) {
  intro(theme.primary('OhMyFix Setup'));
  const apiKey = await text({
    message: 'Please enter your Google Generative AI API key (get it from https://makersuite.google.com/app/apikey):',
    placeholder: 'AI...',
    validate: value => {
      if (!value || !value.startsWith('AI')) return 'Please enter a valid Google API key starting with "AI"';
    }
  });

  const envContent = `GOOGLE_API_KEY=${apiKey}\n`;
  await fs.writeFile(path.join(process.cwd(), '.env'), envContent, { flag: 'w' });
  outro(theme.success('Setup complete! Your API key has been saved to .env'));
}

async function suggestSnippets(theme, config) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(theme.error('Error: Google API key not found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const s = spinner();
  s.start('Scanning codebase for snippet opportunities...');

  const codeFiles = await scanCodebase(process.cwd());
  const codeContent = await Promise.all(
    codeFiles.map(async file => await fs.readFile(file, 'utf8'))
  );

  const prompt = `
    Analyze this JavaScript codebase:
    \`\`\`javascript
    ${codeContent.join('\n\n')}
    \`\`\`
    - Suggest 3 reusable code snippets (e.g., functions, utilities) based on patterns or repetitive code.
    - Format each snippet as:
      Snippet: \`\`\`javascript
      <code>
      \`\`\`
      Description: <description>
  `;

  const result = await model.generateContent(prompt);
  const snippets = result.response.text().trim().split('\n\n');

  s.stop('Snippets generated!');
  for (const snippet of snippets) {
    const [snippetLine, ...descLines] = snippet.split('\n');
    const code = snippetLine.match(/```javascript\n([\s\S]*?)```/)?.[1] || '';
    const desc = descLines.join('\n').replace('Description: ', '');
    note(
      `${theme.accent('Snippet:')}\n${code}\n\n${theme.primary('Description:')}\n${desc}`,
      'Code Snippet',
      { compact: config.promptStyle === 'compact' }
    );
  }
}

async function lintCodebase(theme, config) {
  const s = spinner();
  s.start('Linting codebase...');
  const codeFiles = await scanCodebase(process.cwd());

  const issues = [];
  for (const file of codeFiles) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('console.log') && !line.includes('// debug')) {
        issues.push({ file: path.relative(process.cwd(), file), line: index + 1, issue: 'Uncommented console.log' });
      }
      if (!line.trim().endsWith(';') && line.trim() && !line.includes('function') && !line.includes('{') && !line.includes('}')) {
        issues.push({ file: path.relative(process.cwd(), file), line: index + 1, issue: 'Missing semicolon' });
      }
    });
  }

  s.stop(issues.length > 0 ? 'Linting issues found!' : 'Codebase looks clean!');
  issues.forEach(issue => {
    note(
      `${theme.error('✗ Issue:')} ${issue.issue}\n${theme.primary('File:')} ${issue.file}:${issue.line}`,
      'Lint Check',
      { compact: config.promptStyle === 'compact' }
    );
  });
}

async function debugHelper(theme, config) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(theme.error('Error: Google API key not found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const errorMsg = await text({
    message: 'Enter the error message or issue you’re facing:',
    placeholder: 'e.g., "ReferenceError: foo is not defined"'
  });

  const prompt = `
    Given this error: "${errorMsg}"
    - Suggest 3 debugging steps or solutions.
    - Format each as:
      Step: <step description>
  `;

  const result = await model.generateContent(prompt);
  const steps = result.response.text().trim().split('\n\n');

  for (const step of steps) {
    note(theme.accent(step), 'Debug Suggestion', { compact: config.promptStyle === 'compact' });
  }
}

async function manageShortcuts(theme, config) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(theme.error('Error: Google API key not found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const s = spinner();
  s.start('Generating shortcut suggestions...');

  const codeFiles = await scanCodebase(process.cwd());
  const codeContent = codeFiles.length > 0 ? await Promise.all(codeFiles.map(async file => await fs.readFile(file, 'utf8'))) : [''];

  const prompt = `
    Based on this JavaScript codebase (or general coding patterns if empty):
    \`\`\`javascript
    ${codeContent.join('\n\n')}
    \`\`\`
    - Suggest 3 productivity shortcuts (e.g., aliases like "log" for "console.log").
    - Format each as:
      Shortcut: <shortcut name>
      Code: \`\`\`javascript
      <code it expands to>
      \`\`\`
  `;

  const result = await model.generateContent(prompt);
  const shortcuts = result.response.text().trim().split('\n\n');

  s.stop('Shortcuts ready!');
  const newShortcuts = {};

  for (const shortcut of shortcuts) {
    const [shortcutLine, ...codeLines] = shortcut.split('\n');
    const name = shortcutLine.replace('Shortcut: ', '').trim();
    const code = codeLines.join('\n').match(/```javascript\n([\s\S]*?)```/)?.[1] || '';
    note(
      `${theme.accent('Shortcut:')} ${name}\n\n${theme.primary('Code:')}\n${code}`,
      'Suggested Shortcut',
      { compact: config.promptStyle === 'compact' }
    );

    const saveShortcut = await confirm({
      message: `Save "${name}" to config?`,
      initialValue: false,
      compact: config.promptStyle === 'compact'
    });

    if (saveShortcut) {
      newShortcuts[name] = code;
    }
  }

  if (Object.keys(newShortcuts).length > 0) {
    config.shortcuts = { ...config.shortcuts, ...newShortcuts };
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    note(theme.success('✓ Shortcuts saved to ohmyfix.config.json!'), 'Config Update', { compact: config.promptStyle === 'compact' });
  }
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

async function snippetFix(theme, config) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(theme.error('Error: Google API key not found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  intro(theme.primary('Snippet Fixer (Any Language)'));
  const language = await text({
    message: 'Enter the programming language of your snippet (e.g., Python, Java, JavaScript):',
    placeholder: 'JavaScript',
    validate: value => {
      if (!value.trim()) return 'Please specify a language!';
    }
  });

  const snippet = await text({
    message: `Paste your ${language} code snippet to fix:`,
    placeholder: `e.g., print("Hello"  # Python`,
    validate: value => {
      if (!value.trim()) return 'Please enter a code snippet!';
    }
  });

  const prompt = `
    Analyze this ${language} code snippet:
    \`\`\`${language.toLowerCase()}
    ${snippet}
    \`\`\`
    - List only syntax errors or typos specific to ${language} (e.g., missing punctuation, incorrect keywords).
    - For each error, provide:
      - The exact line of code containing the error, without extra quotes or formatting beyond what's in the original code.
      - The corrected line of code as the solution.
    - If no errors, return "No errors found".
    - Format each error and solution as:
      Error: <exact erroneous line>
      Solution: \`\`\`${language.toLowerCase()}
      <corrected line>
      \`\`\`
  `;

  const s = spinner();
  s.start(`Analyzing ${language} snippet...`);

  try {
    const result = await model.generateContent(prompt);
    const review = result.response.text().trim();
    s.stop('Analysis complete!');

    if (review === 'No errors found') {
      note(theme.success(`✓ No errors found in your ${language} snippet!`), 'Snippet Check');
      note(theme.primary(`Your snippet:\n${snippet}`), 'Result');
      return;
    }

    const lines = review.split('\n');
    const errors = [];
    let currentError = null;

    for (const line of lines) {
      if (line.startsWith('Error:')) {
        currentError = { erroneousLine: line.replace('Error: ', '').trim() };
      } else if (line.startsWith(`Solution: \`\`\`${language.toLowerCase()}`)) {
        const solutionLines = [];
        for (let i = lines.indexOf(line) + 1; i < lines.length && !lines[i].startsWith('```'); i++) {
          solutionLines.push(lines[i]);
        }
        currentError.solution = solutionLines.join('\n').trim();
        errors.push(currentError);
        currentError = null;
      }
    }

    let fixedSnippet = snippet;
    for (const error of errors) {
      note(
        `${theme.error('✗ Error:')} ${error.erroneousLine}\n\n${theme.accent('Solution:')}\n${error.solution}`,
        'Snippet Fix',
        { compact: config.promptStyle === 'compact' }
      );

      const applyFix = await confirm({
        message: 'Apply this fix to the snippet?',
        initialValue: true,
        compact: config.promptStyle === 'compact'
      });

      if (applyFix) {
        const snippetLines = fixedSnippet.split('\n');
        const normalizedErroneousLine = error.erroneousLine.replace(/^["']|["']$/g, '').trim();

        const updatedLines = snippetLines.map(line => {
          const normalizedLine = line.replace(/^["']|["']$/g, '').trim();
          return normalizedLine === normalizedErroneousLine ? error.solution : line;
        });

        fixedSnippet = updatedLines.join('\n');
        note(theme.success('✓ Fix applied to snippet!'), 'Snippet Update');
      }
    }

    note(theme.primary(`Fixed ${language} snippet:\n${fixedSnippet}`), 'Final Result');

    const saveToFile = await confirm({
      message: 'Save the fixed snippet to a file?',
      initialValue: false,
      compact: config.promptStyle === 'compact'
    });

    if (saveToFile) {
      const fileName = await text({
        message: 'Enter the file name (e.g., fixed.py):',
        placeholder: `fixed.${language.toLowerCase() === 'javascript' ? 'js' : language.toLowerCase()}`,
        validate: value => {
          if (!value.trim()) return 'Please enter a file name!';
        }
      });
      await fs.writeFile(path.join(process.cwd(), fileName), fixedSnippet);
      note(theme.success(`✓ Saved to ${fileName}!`), 'File Saved');
    }
  } catch (err) {
    s.stop(theme.error(`Error analyzing ${language} snippet: ${err.message}`));
  }
}

async function fixSpecificFile(file, theme, config) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(theme.error('Error: Google API key not found. Please run `ohmyfix setup` to configure it.'));
    return;
  }

  const filePath = path.join(process.cwd(), file);
  let content;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error(theme.error(`Error: Could not read file "${file}" - ${err.message}`));
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const s = spinner();
  s.start(`Analyzing ${file}...`);

  // Check if the file starts with a comment and extract it
  const lines = content.split('\n');
  let instructionComment = lines[0].trim().startsWith('//') ? lines[0].replace('//', '').trim() : null;
  
  // If no comment exists or file is empty/not JS, prepend a default comment
  const isJavaScript = content.trim().startsWith('function') || content.includes('console.log') || file.endsWith('.js');
  if (!instructionComment || !isJavaScript) {
    instructionComment = 'Generate code based on this comment';
    content = `// ${instructionComment}\n${content}`;  // Prepend comment if not present
    console.log(theme.warn(`⚠ No valid JS or instruction found in ${file}. Adding default comment: "// ${instructionComment}"`));
  }

  const prompt = `
    Given this file content with an instruction comment at the top:
    \`\`\`
    ${content}
    \`\`\`
    - Analyze the instruction in the first comment (e.g., "${instructionComment}").
    - If the content below the comment is not valid JavaScript or doesn’t match the instruction:
      - Generate new code based solely on the instruction comment.
      - Return the full code including the comment at the top.
    - If the content is valid JavaScript:
      - Fix any syntax errors or typos (e.g., missing semicolons, wrong method names).
      - Return the fixed code with the original comment preserved.
    - Format the result as:
      \`\`\`javascript
      <generated or fixed code>
      \`\`\`
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    s.stop('Analysis complete!');

    // Extract the generated/fixed code from the response
    const generatedCodeMatch = response.match(/```javascript\n([\s\S]*?)```/);
    if (!generatedCodeMatch) {
      console.error(theme.error('Error: AI response did not contain valid code.'));
      return;
    }
    const generatedCode = generatedCodeMatch[1].trim();

    // Show what’s being replaced
    console.log(theme.accent(`Original content of ${file}:`));
    console.log(theme.gray(content));
    console.log(theme.accent(`Generated/fixed content:`));
    console.log(theme.primary(generatedCode));

    // Write the new content back to the original file
    await fs.writeFile(filePath, generatedCode);
    console.log(theme.success(`✓ ${file} has been updated with generated code!`));
  } catch (err) {
    s.stop(theme.error(`Error processing ${file}: ${err.message}`));
  }
}