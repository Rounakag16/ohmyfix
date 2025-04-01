# OhMyFix

A sleek CLI tool powered by AI to fix JavaScript code errors and resolve dependency conflicts with ease. Say goodbye to pesky typos and hello to clean code!

## Features
- `Code Error Fixes`: Detects and fixes syntax errors or typos (e.g., missing semicolons, `conole.log`) in `.js` files.
- `Dependency Conflict Checker`: Analyzes `package.json` for conflicts.
- `Interactive UI`: A polished terminal experience with prompts and spinners.

## Getting Started
Follow these steps to get OhMyFix up and running on your machine.

### Prerequisites
- `Node.js`: Version 18.x or higher (tested with 22.13.0).
- `npm`: Ensure it's updated (`npm install -g npm`).
- `Google Generative AI API Key`: Get one from Google Maker Suite.

### Installation
Install OhMyFix globally via npm:
```bash
npm install -g ohmyfix
```

### Setup
Configure your Google API key to enable AI-powered fixes:
```bash
ohmyfix setup
```
Enter your Google Generative AI API key when prompted (starts with `AI...`). The key will be saved to a `.env` file in your current directory.

> `Note`: Keep your `.env` file secure and never commit it to version control!

## Usage
Run OhMyFix in any directory with JavaScript files or a `package.json`.

### Interactive Mode
```bash
ohmyfix
```
Options:
- `Fix dependency conflicts`: Scans `package.json` for issues.
- `AI Code Review`: Finds and fixes errors in `.js` files.

### Direct AI Code Review
```bash
ohmyfix ai
```
Scans your codebase, identifies errors, and offers fixes interactively.

#### Example
For a file like `test.js`:
```javascript
console.log("Hello, world")
conole.log("Oops")
```
Run:
```bash
ohmyfix ai
```
Output:
- Detects error (`conole.log("Oops")`).
- Suggests fix: `console.log("Oops")`.
- Asks to apply the fix, updating only that line.

## Troubleshooting
- `"No Google API key found"`: Run `ohmyfix setup` to configure it.
- `No fixes applied`: Ensure your file has a `.js` extension and is in the current directory.
- `Installation errors`: Update Node.js/npm and retry.

## Contributing
Found a bug or want a new feature? Open an issue or PR on GitHub!

## License
MIT © thedvlprguy

## Publishing on npm
To include `README.md` in your npm package:

1. Ensure `README.md` is in your project directory.
2. Add to `package.json`:
```json
"readme": "README.md"
```
3. Include it in the `files` array:
```json
"files": [
  "cli.js",
  "depfix.js",
  "README.md"
]
```
4. Bump the version:
```json
"version": "1.0.3"
```
5. Publish:
```bash
npm publish
```

## (Optional) GitHub Setup
If using GitHub:
```bash
git add README.md
git commit -m "Add README for getting started"
git push origin main
```

This README is clear, concise, and structured for easy use!