Multilingual News Article Summarizer & Analyzer Extension

This Chrome extension analyzes any news article you are reading. It uses a custom-trained T5 model (hosted on Hugging Face) for summarization, a public sentiment model for analysis, and public translation models to provide a multilingual experience.

Features

One-Click Analysis: Get a summary and sentiment analysis of any news article.

Custom T5 Model: Uses a fine-tuned T5 model for high-quality summarization.

Sentiment Analysis: Understands the tone of the article (e.g., positive, negative, neutral).

Multilingual Support: Can process and translate content into various languages.

Prerequisites

Before you begin, you will need:

A Hugging Face account.

A Hugging Face Access Token. You can generate one from your settings:

Go to https://huggingface.co/settings/tokens

Create a new token (a "read" permission token should be sufficient).

Copy this token securely.

Installation and Setup

Follow these steps to install and configure the extension.

1. Configure Your Credentials

This is a critical step. The extension will not work until you add your Hugging Face details.

Open the popup.js file in a text editor.

Find Line 5 and replace "hf_YOUR_API_TOKEN_HERE" with your actual Hugging Face token.

Find Line 8 and replace "YOUR-HF-USERNAME" with your Hugging Face username.

Before:

// popup.js (Example)
...
const HF_TOKEN = "hf_YOUR_API_TOKEN_HERE";
...
const HF_USERNAME = "YOUR-HF-USERNAME";
...


After:

// popup.js (Example)
...
const HF_TOKEN = "hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456";
...
const HF_USERNAME = "datasciencelover22";
...


2. Load the Extension in Chrome

Open the Google Chrome browser.

Navigate to the URL chrome://extensions.

Enable "Developer mode" using the toggle switch in the top-right corner.

Click the "Load unpacked" button that appears on the top-left.

Select the entire folder where these project files (including popup.js, manifest.json, etc.) are located.

The extension should now appear in your list.

How to Use

Pin the Extension: Click the puzzle piece icon in your Chrome toolbar and "pin" the AI Analyzer Extension to make it easily accessible.

Navigate to an Article: Go to any news article webpage.

Run Analysis:

Click the extension's icon in your toolbar.

Choose your desired language from the dropdown menu.

Click the "Analyze this Article" button.

View Results: The extension popup will display the summary and sentiment analysis.



