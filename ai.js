// ai.js
const OpenAI = require('openai');
const openai = new OpenAI(process.env.OH_MY_FIX);

async function reviewCode(code) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Review this code for bugs and improvements:' },
      { role: 'user', content: code },
    ],
  });
  return response.choices[0].message.content;
}

module.exports = { reviewCode };
