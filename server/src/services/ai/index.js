import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export async function generateContent(prompt, options = {}) {
  const provider = config.ai.defaultProvider;
  
  try {
    if (provider === 'openai') {
      return await generateWithOpenAI(prompt, options);
    } else if (provider === 'anthropic') {
      return await generateWithAnthropic(prompt, options);
    }
    
    throw new Error(`Unknown AI provider: ${provider}`);
  } catch (error) {
    logger.error(`AI generation failed (${provider}):`, error);
    throw error;
  }
}

async function generateWithOpenAI(prompt, options = {}) {
  const apiKey = config.ai.openai.apiKey;
  const baseUrl = config.ai.openai.baseUrl;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || config.ai.openai.model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a professional blog content writer. Write engaging, well-structured content in HTML format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || config.ai.openai.maxTokens,
      temperature: options.temperature || 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function generateWithAnthropic(prompt, options = {}) {
  const apiKey = config.ai.anthropic.apiKey;
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || config.ai.anthropic.model,
      max_tokens: options.maxTokens || config.ai.anthropic.maxTokens,
      system: 'You are a professional blog content writer. Write engaging, well-structured content in HTML format.',
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

export async function summarizeContent(content, maxLength = 200) {
  const prompt = `Summarize the following content in ${maxLength} characters or less. Keep the most important points:\n\n${content}`;
  
  const summary = await generateContent(prompt, { maxTokens: 500 });
  
  return summary.substring(0, maxLength);
}

export async function repurposeContent(content, targetPlatform) {
  const platformInstructions = {
    wordpress: 'Format for WordPress blog with SEO-friendly HTML structure. Include proper heading hierarchy.',
    ghost: 'Format for Ghost CMS using HTML with clean, minimal styling.',
    medium: 'Format for Medium with engaging paragraphs. Medium uses its own formatting.',
    twitter: 'Condense into a thread-ready format with multiple short tweets.',
    linkedin: 'Format for LinkedIn professional audience with industry insights.',
    newsletter: 'Format for email newsletter with engaging introduction and clear call-to-action.'
  };

  const instruction = platformInstructions[targetPlatform] || 'Repurpose for the target platform';
  
  const prompt = `${instruction}:\n\n${content}`;
  
  return await generateContent(prompt, { maxTokens: 2000 });
}
