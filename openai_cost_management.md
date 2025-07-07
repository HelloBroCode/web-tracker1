# OpenAI Cost Management in the Expense Tracker

This document outlines how the Expense Tracker application is designed to minimize OpenAI API costs while still providing AI features when needed.

## Current Configuration

The application uses the following cost-saving measures:

1. **Economical Model Selection**
   - Uses `gpt-3.5-turbo` instead of GPT-4 models (approximately 10-20x cheaper)
   - Cost: ~$0.0015 per 1K tokens vs $0.03-0.06 for GPT-4

2. **Token Minimization**
   - Limited maximum response tokens (150 tokens default, 50 for budget tips)
   - Concise system prompts (saving input tokens)
   - Specific user prompts designed to get short responses
   - Approximately saving 50-70% compared to unrestricted token usage

3. **Usage Control**
   - AI features are opt-in rather than default
   - Static responses used for most interactions
   - Budget tips default to pre-defined static content rather than AI-generated

4. **Request Efficiency**
   - Consolidates data before making API calls
   - Only essential data sent in prompts
   - Single round-trip conversations (no back-and-forth with the AI)

## Estimated Cost Per Month

Based on current configuration with a $5 credit:

| Feature              | Est. Monthly Usage | Tokens per Request | Monthly Cost |
|----------------------|--------------------|-------------------|--------------|
| Budget Tips          | 10 requests        | ~250 tokens       | $0.004       |
| Financial Advice     | 5 requests         | ~300 tokens       | $0.002       |
| **Total**            |                    |                   | **$0.006**   |

At this usage rate, the $5 credit would last for approximately **69 years**.

## Best Practices for Users

To ensure your OpenAI credit lasts as long as possible:

1. **Use pre-defined tips** - The application defaults to non-AI tips, which is recommended for most users.

2. **Limit AI-generated advice** - Only enable AI-generated advice when you need personalized insights.

3. **Add sufficient expense data** - When using AI features, having more expense data helps the AI give better advice with fewer tokens.

4. **Monitor usage** - If you do enable AI features, check your OpenAI account periodically to monitor usage.

## How to Enable/Disable AI Features

By default, all AI features are disabled to conserve your OpenAI credit. If you want to enable AI-generated budget tips:

1. In `static/js/script.js`, locate the `getBudgetTips` and `getSpecificBudgetTips` functions
2. Change `const useAI = false;` to `const useAI = true;` in both functions
3. Save the file and restart the application

Remember that enabling AI features will consume your OpenAI credit, albeit very slowly with the current optimization.

## Technical Implementation

The main cost-saving implementations are in:

- `openai_integration.py`: Configures economical model settings
- `app.py`: Provides both AI and non-AI paths for budget tips
- `static/js/script.js`: Defaults to non-AI options

## Extending the Application

If you want to add more AI features:

1. Follow the pattern in `openai_integration.py` for creating minimal, focused prompts
2. Always set reasonable token limits (50-150 tokens for most responses)
3. Add both AI and non-AI paths for any new features
4. Default to the non-AI path unless explicitly requested

With these measures, your $5 OpenAI credit should last effectively forever for normal usage patterns. 