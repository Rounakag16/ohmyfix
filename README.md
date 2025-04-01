# OhMyFix

A powerful, AI-driven CLI tool to enhance your coding experience. Fix JavaScript errors, generate code from comments, resolve dependency conflicts, and boost productivity with a customizable UI and oh-my-zsh-inspired shortcuts!

## Features

- `AI Code Review`: Automatically fixes errors in all JavaScript `.js` files in your project (`ohmyfix ai`).
- `Dependency Conflict Checker`: Scans `package.json` for version mismatches (`ohmyfix depfix`).
- `Interactive Theme Selection`: Choose from 4 themes (Dark, Pookie Pink, Nord, Solarized) on first run, saved to `ohmyfix.config.json`.
- `Code Snippets`: Suggests reusable JavaScript snippets based on your codebase (`ohmyfix snippets`).
- `Real-Time Linting`: Flags JavaScript-specific issues like uncommented `console.log` or missing semicolons (`ohmyfix lint`).
- `Debug Helper`: Provides AI-powered debugging steps for any error message (`ohmyfix debug`).
- `Shortcuts`: Manage oh-my-zsh-style aliases for JavaScript coding (`ohmyfix shortcuts`).
- `Snippet Fixer`: Fixes errors in pasted code snippets for any language (e.g., Python, Java) (`ohmyfix snippetfix`).
- `File-Specific Fix/Generate`: `ohmyfix <file> --shortcut` fixes JavaScript errors or generates code based on a top comment, overwriting the file.
- `Customizable UI`: Toggle between compact or detailed prompts and switch themes via `ohmyfix.config.json`.

## Getting Started

### Prerequisites

- `Node.js`: 18.x or higher (tested with 22.13.0).
- `npm`: Latest version (`npm install -g npm`).
- `Google Generative AI API Key`: Obtain from [Google Maker Suite](https://makersuite.google.com/app/apikey).

### Installation

Install globally via npm:

```bash
npm install -g ohmyfix
```

### Initial Setup

Run OhMyFix:

```bash
ohmyfix
```

On first run, select a theme (e.g., Dark, Pookie Pink). This is saved to `ohmyfix.config.json`.

Set Up API Key:

```bash
ohmyfix setup
```

Enter your Google Generative AI API key (starts with AI). Saved to `.env`.

## Usage

### Interactive Mode

Run without arguments to access the main menu:

```bash
ohmyfix
```

Choose from options like "Fix dependency conflicts" or "Fix Selected Snippet".

### File-Specific Fix/Generate

Fix errors or generate code in a specific file:

```bash
ohmyfix hello.js --shortcut
```

- If `hello.js` contains valid JavaScript, it fixes syntax errors.
- If not, or if it lacks a comment, it adds `// Generate code based on this comment` and generates code accordingly.
- Overwrites `hello.js` with the result.

## Commands

- `ohmyfix ai`: AI-powered review and fix for all `.js` files.
- `ohmyfix setup`: Configure your Google API key.
- `ohmyfix snippets`: Suggest reusable code snippets.
- `ohmyfix lint`: Lint your JavaScript codebase.
- `ohmyfix debug`: Get debugging suggestions.
- `ohmyfix shortcuts`: Manage productivity shortcuts.
- `ohmyfix snippetfix`: Fix a pasted code snippet in any language.

## Examples

### Example 1: Generate Code from Comment

`hello.js (before):`
```js
// Generate a simple webpage
<!DOCTYPE html>
```

`Run:`
```bash
ohmyfix hello.js --shortcut
```

`Output:`
```js
// Generate a simple webpage
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Simple Webpage</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
```
✓ `hello.js` has been updated with generated code!

### Example 2: Fix JavaScript Errors

`hello.js (before):`
```js
// Log a greeting
conole.log("Hi"
```

`Run:`
```bash
ohmyfix hello.js --shortcut
```

`Output:`
```js
// Log a greeting
console.log("Hi");
```
✓ `hello.js` has been updated with generated code!

### Example 3: Empty File

`hello.js (before):`
(empty)

`Run:`
```bash
ohmyfix hello.js --shortcut
```

`Output:`
```js
// Generate code based on this comment
console.log("Generated code based on comment");
```
✓ `hello.js` has been updated with generated code!

## Customization

Edit `ohmyfix.config.json` to customize:

```json
{
  "theme": "pookiepink",
  "promptStyle": "compact",
  "shortcuts": {
    "log": "console.log"
  }
}
```

- `theme`: `dark`, `pookiepink`, `nord`, or `solarized`.
- `promptStyle`: `detailed` (default) or `compact`.
- `shortcuts`: Add custom aliases.

## Troubleshooting

- `"theme.gray is not a function"`: Ensure you’re using version 1.0.8 or higher (`npm install -g ohmyfix`).
- `"No Google API key"`: Run `ohmyfix setup` and provide a valid key.
- `"File not found"`: Verify the file exists in the current directory.
- `Unexpected output`: Add a clear comment (e.g., `// Generate a calculator app`) to guide the AI.

## Contributing

1. Fork the repository: [github.com/thedvlprguy/ohmyfix](https://github.com/thedvlprguy/ohmyfix).
2. Create a feature branch (`git checkout -b feature/new-thing`).
3. Commit changes (`git commit -m "Add new thing"`).
4. Push to the branch (`git push origin feature/new-thing`).
5. Open a Pull Request.

## License

MIT © [thedvlprguy](https://github.com/thedvlprguy) [tejsvapandey](https://github.com/tejsvapandey1) [keertikayo](https://github.com/keetikayo)

## Acknowledgments

- Powered by Google Generative AI.
- Built with Node.js, Chalk, and Clack Prompts.

