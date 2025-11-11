// --- CONFIGURATION ---
// 1. Get your token from https://huggingface.co/settings/tokens
// 2. Paste it here (keep it private!)
const HF_API_KEY = "h-fase_api";

// 3. Updated Hugging Face inference endpoints (new router API)
// const SUMMARIZER_API_URL = "https://router.huggingface.co/hf-inference/models/Abhiee12/my-summarizer-model";
const SUMMARIZER_API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn";

const SENTIMENT_API_URL = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest";

// Public translation models
const TRANSLATION_MODEL_MAP = {
    "es": "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-es",
    "fr": "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-fr",
    "de": "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-de",
    "hi": "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-hi"
};
// --- END CONFIGURATION ---


// --- DOM ELEMENTS ---
const analyzeButton = document.getElementById('analyze-btn');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const languageSelect = document.getElementById('language');


// --- MAIN LOGIC ---
analyzeButton.addEventListener('click', async () => {
    loadingDiv.style.display = 'block';
    loadingDiv.querySelector('p').innerText = 'Getting article text...';
    resultsDiv.innerHTML = '';

    // 1️⃣ Get text from the active tab
    const articleText = await getArticleText();
    if (!articleText) {
        showError("Could not extract text from this page. Try a different site.");
        return;
    }

    // ✅ NEW CHANGE — Truncate text to prevent model overflow
    let truncatedText = articleText.slice(0, 3000);
    truncatedText = truncatedText.substring(0, truncatedText.lastIndexOf('.') + 1); // end at sentence

    // 2️⃣ Prepare payloads
    const summaryPayload = {
        inputs: "summarize: " + truncatedText, // use truncated text here
        parameters: { max_length: 150, min_length: 40, num_beams: 4 }
    };
    const sentimentPayload = {
        inputs: articleText.substring(0, 1000) // only short part for sentiment
    };

    try {
        loadingDiv.querySelector('p').innerText = 'Analyzing... Please wait.';

        // 3️⃣ Call Summarizer + Sentiment in parallel
        const [summaryResult, sentimentResult] = await Promise.all([
            callApi(SUMMARIZER_API_URL, summaryPayload),
            callApi(SENTIMENT_API_URL, sentimentPayload)
        ]);

        // 4️⃣ Process results
        const originalSummary = summaryResult[0].summary_text;
        const sentiments = sentimentResult[0];
        const topSentiment = sentiments.reduce((a, b) => (a.score > b.score ? a : b));

        let finalSummary = originalSummary;
        const targetLang = languageSelect.value;
        const targetLangName = languageSelect.options[languageSelect.selectedIndex].text;

        // 5️⃣ Translate summary if needed
        if (targetLang !== 'en') {
            loadingDiv.querySelector('p').innerText = `Translating to ${targetLangName}...`;
            const translationApiUrl = TRANSLATION_MODEL_MAP[targetLang];
            const translationPayload = { inputs: originalSummary };

            const translationResult = await callApi(translationApiUrl, translationPayload);
            finalSummary = translationResult[0].translation_text;
        }

        // 6️⃣ Display results
        loadingDiv.style.display = 'none';
        resultsDiv.innerHTML = `
            <h3>Sentiment: ${topSentiment.label} (${(topSentiment.score * 100).toFixed(1)}%)</h3>
            <p id="sentiment-details">Analyzed first 1000 characters of the article.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
            <h3>Summary ${targetLang !== 'en' ? `(Translated to ${targetLangName})` : ''}:</h3>
            <p>${finalSummary}</p>
        `;
    } catch (error) {
        showError(error.message);
    }
});


// --- HELPER FUNCTIONS ---

// Display errors
function showError(message) {
    loadingDiv.style.display = 'none';
    resultsDiv.innerHTML = `<p id="error">⚠️ ${message}</p>`;
}

// Call Hugging Face API
async function callApi(apiUrl, payload) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            // Handle common Hugging Face errors
            if (errorJson.error) {
                if (errorJson.error.includes("no longer supported")) {
                    throw new Error("This API endpoint is outdated. Please update to router.huggingface.co/hf-inference");
                }
                throw new Error(errorJson.error);
            }
        } catch (e) {
            throw new Error(`API Error (${response.status}): ${errorBody}`);
        }
    }

    return response.json();
}

// Extract article text from active tab
async function getArticleText() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error("No active tab found.");

        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const selectors = [
                    'article', 'main', 'div[role="main"]',
                    'div[class*="article-body"]', 'div[class*="post-body"]'
                ];
                let text = '';
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.innerText.length > 500) {
                        text = el.innerText;
                        break;
                    }
                }
                if (!text) text = document.body.innerText;
                return text.replace(/\s\s+/g, ' ').trim();
            }
        });

        if (injectionResults && injectionResults[0] && injectionResults[0].result)
            return injectionResults[0].result;
    } catch (e) {
        console.error("Scripting error:", e);
        return null;
    }
    return null;
}
