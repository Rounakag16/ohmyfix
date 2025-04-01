// setup.js
const { intro, outro, text } = require('@clack/prompts');
const fs = require('fs');
const path = require('path');

(async () => {
  intro('OhMyFix Setup');
  const apiKey = await text({
    message: 'Please enter your Google Generative AI API key (get it from https://makersuite.google.com/app/apikey):',
    placeholder: 'AI...',
    validate: value => {
      if (!value || !value.startsWith('AI')) return 'Please enter a valid Google API key starting with "AI"';
    }
  });

  const envContent = `GOOGLE_API_KEY=${apiKey}\n`;
  fs.writeFileSync(path.join(__dirname, '.env'), envContent, { flag: 'w' });
  outro('Setup complete! Your API key has been saved to .env');
})();