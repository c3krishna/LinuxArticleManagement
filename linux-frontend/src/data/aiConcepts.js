// "How AI & ML work" explainer used on the Cheat sheets page.

export const aiLayers = [
    { name: 'Artificial Intelligence', text: 'Any technique that makes computers do tasks that normally need human judgement.' },
    { name: 'Machine Learning', text: 'AI that learns patterns from data instead of following hand-written rules.' },
    { name: 'Deep Learning', text: 'ML using many-layered neural networks; powers vision, speech and language.' },
    { name: 'Generative AI', text: 'Deep learning models that create new text, images, audio or code.' }
];

export const mlPipeline = [
    { step: 'Collect data', text: 'Logs, tickets, images, documents. Quality and coverage matter more than volume.' },
    { step: 'Clean & label', text: 'Remove duplicates and errors, add the correct answers (labels) for supervised learning.' },
    { step: 'Prepare features', text: 'Turn raw data into numbers: features, normalised values, or tokens for text.' },
    { step: 'Train', text: 'The model predicts, a loss function scores the error, and gradient descent adjusts the weights. Repeat for many epochs.' },
    { step: 'Evaluate', text: 'Measure on held-out validation and test data the model never trained on: accuracy, precision/recall, F1.' },
    { step: 'Deploy', text: 'Serve the model behind an API (inference) with batching, autoscaling and auth.' },
    { step: 'Monitor', text: 'Watch latency, cost, error rates and data drift; retrain when the real world changes.' }
];

export const learningTypes = [
    { name: 'Supervised', text: 'Learns from labelled examples. Spam or not spam, predict disk failure.' },
    { name: 'Unsupervised', text: 'Finds structure without labels. Clustering similar alerts, anomaly detection.' },
    { name: 'Self-supervised', text: 'Creates its own labels from raw data, e.g. predict the next word. How LLMs are pre-trained.' },
    { name: 'Reinforcement', text: 'Learns by trial, error and reward. Used to align chat models with human feedback (RLHF).' }
];

export const llmSteps = [
    { step: 'Tokenise', text: 'Text is split into tokens (word pieces). ~1 token ≈ 4 characters of English.' },
    { step: 'Embed', text: 'Each token becomes a vector of numbers that captures its meaning.' },
    { step: 'Attend', text: 'Transformer layers use attention so every token can weigh every other token in the context window.' },
    { step: 'Predict', text: 'The model outputs a probability for every possible next token.' },
    { step: 'Sample', text: 'One token is picked (temperature and top-p control randomness), appended, and the loop repeats.' }
];

export const ragSteps = [
    { step: 'Chunk', text: 'Split your documents into passages of a few hundred tokens.' },
    { step: 'Embed & store', text: 'Convert each chunk to an embedding and store it in a vector database.' },
    { step: 'Retrieve', text: 'Embed the user question and fetch the most similar chunks, filtered by tenant and permissions.' },
    { step: 'Augment', text: 'Put the retrieved chunks into the prompt as context.' },
    { step: 'Generate', text: 'The LLM answers from that context and can cite its sources.' }
];

export const approaches = [
    { name: 'Prompting', when: 'Start here. Clear instructions and examples solve most tasks with no training.', cost: 'Lowest' },
    { name: 'RAG', when: 'The model needs your private or frequently changing knowledge.', cost: 'Low to medium' },
    { name: 'Fine-tuning (LoRA)', when: 'You need a consistent style, format or narrow skill that prompting cannot reach.', cost: 'Medium' },
    { name: 'Training from scratch', when: 'Almost never. Needs huge datasets and GPU budgets.', cost: 'Very high' }
];

export const agentLoop = [
    { step: 'Goal', text: 'A user asks for an outcome, not a single answer.' },
    { step: 'Plan', text: 'The LLM decides which tool to call next.' },
    { step: 'Act', text: 'A tool runs: search, SQL query, API call, shell command.' },
    { step: 'Observe', text: 'The result goes back into the context.' },
    { step: 'Repeat or finish', text: 'Loop until done. Guardrails: least-privilege tools, approvals for risky actions, step limits.' }
];

export const glossary = [
    { term: 'Parameters / weights', text: 'The numbers a model learns. "8B" means eight billion of them.' },
    { term: 'Inference', text: 'Using a trained model to make predictions; what runs in production.' },
    { term: 'Epoch', text: 'One full pass of training over the dataset.' },
    { term: 'Loss', text: 'A score of how wrong the predictions are; training tries to minimise it.' },
    { term: 'Overfitting', text: 'Memorising training data: great training score, poor results on new data.' },
    { term: 'Embedding', text: 'A vector that represents meaning; similar meanings sit close together.' },
    { term: 'Context window', text: 'The maximum tokens (prompt + answer) a model can consider at once.' },
    { term: 'Hallucination', text: 'A confident answer that is not supported by facts or the provided context.' },
    { term: 'Quantisation', text: 'Storing weights in fewer bits (8-bit, 4-bit) to cut memory at a small quality cost.' },
    { term: 'KV cache', text: 'Memory that stores attention state so long generations stay fast; often the GPU-memory bottleneck.' },
    { term: 'Temperature', text: 'Randomness of sampling. 0 = deterministic, higher = more creative.' },
    { term: 'LoRA', text: 'Fine-tuning a small set of added weights instead of the whole model.' }
];
