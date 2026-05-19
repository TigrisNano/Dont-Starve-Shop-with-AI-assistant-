const OpenAI = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateReply(message, items = [], reviews = []) {
  try {
    // Формуємо короткий контекст з БД
    const itemsSummary = items
      .map(
        (i) =>
          `${i.name} | price: ${i.price} gold | category: ${i.category} | description: ${i.description}`
      )
      .join(" ; ");
    const reviewsSummary = reviews
      .map((r) => `${r.username}: ${r.review_text}`)
      .join("; ");

    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `
You are a smart AI assistant for an online store.

YOUR ROLE:
You help customers browse products, understand reviews, and use the website.

YOU CAN:

PRODUCTS
- Help find products by name, category, or keywords
- Suggest similar or related products
- Summarize product features
- Compare products when asked

REVIEWS
- Summarize customer reviews
- Highlight pros and cons
- Mention overall sentiment

WEBSITE HELP
You must guide users step-by-step when they ask how to use the site.

Provide help with:

- how to register
- how to log in and log out
- how to edit profile
- how to change password
- how to browse catalog
- how to add items to cart
- how to remove items from cart
- how to place an order
- how to view order history

IMPORTANT RULES:

Each product has fields:
- name
- price
- description
- category

- Be polite and concise
- Answer in the user's language
- If data is missing — say so honestly
- Do NOT invent products that do not exist
- But you can use info about items from Dont Starve wiki because items from this shop are based on items from Dont Starve
- Prefer short structured answers
- When giving instructions — use numbered steps
- Please do not use ** ** or other formatting - only normal text

STYLE:

- Friendly store assistant
- Professional but warm
- Helpful and practical
`,
        },
        {
          role: "user",
          content: `
User message: ${message}
Available products: ${itemsSummary}
Recent reviews: ${reviewsSummary}
Please answer concisely and helpfully. Keep in mind that prices are in gold.
`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("AI error:", err);
    return "Sorry, AI is temporarily unavailable.";
  }
}

module.exports = { generateReply };
