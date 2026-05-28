const lazyImportOpenAI = () => import("@langchain/openai")

function isLLMConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

async function getLLM(options = {}) {
  const { ChatOpenAI } = await lazyImportOpenAI()
  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    temperature: 0,
    ...options,
  })
}

async function categorizeProduct(name) {
  if (!isLLMConfigured()) return 'Uncategorized'
  const llm = await getLLM({ temperature: 0 })
  const prompt = `Classify the product into a retail category (one of: Dairy, Snacks, Beverages, Personal Care, Household, Electronics, Produce, Bakery, Pantry, Pharmacy, Stationery, Other). Reply with category only.\nProduct: ${name}`
  try {
    const res = await llm.invoke(prompt)
    const text = (res.content || '').toString().trim()
    return text.split(/\W+/)[0] || 'Uncategorized'
  } catch (e) {
    return 'Uncategorized'
  }
}

async function summarizeSales(text) {
  if (!isLLMConfigured()) return 'LLM not configured.'
  const llm = await getLLM({ temperature: 0.2 })
  const prompt = `Summarize sales trends in 3 bullet points:\n${text}`
  try {
    const res = await llm.invoke(prompt)
    return (res.content || '').toString().trim()
  } catch (e) {
    return 'Summary unavailable.'
  }
}

module.exports = { isLLMConfigured, categorizeProduct, summarizeSales }
