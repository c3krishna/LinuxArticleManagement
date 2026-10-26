// AI/ML production issues: { title, area, severity, symptoms, diagnose: [commands or checks], fix: [steps] }
const aiIssues = [
    {
        title: 'CUDA out of memory',
        area: 'GPU',
        severity: 'HIGH',
        symptoms: 'torch.OutOfMemoryError: CUDA out of memory, or vLLM/Ollama failing to load a model.',
        diagnose: [
            'nvidia-smi   # who else is using GPU memory?',
            'nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv',
            'python -c "import torch; print(torch.cuda.memory_summary())"'
        ],
        fix: [
            'Stop stray processes holding memory (old notebooks, zombie workers).',
            'Lower batch size or sequence length; use gradient accumulation to keep the effective batch.',
            'Use a quantised model (8-bit/4-bit) or a smaller one.',
            'Set PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True to reduce fragmentation.'
        ]
    },
    {
        title: 'GPU not visible to PyTorch or containers',
        area: 'GPU',
        severity: 'CRITICAL',
        symptoms: 'torch.cuda.is_available() is False, or "could not select device driver" in Docker.',
        diagnose: [
            'nvidia-smi   # works on the host?',
            'python -c "import torch; print(torch.version.cuda)"   # None means a CPU-only build',
            'docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi',
            'dmesg -T | grep -i -E "nvrm|xid"'
        ],
        fix: [
            'Install a CUDA build of PyTorch that matches the driver (pip index-url …/whl/cu121).',
            'Install the NVIDIA Container Toolkit and run: nvidia-ctk runtime configure --runtime=docker.',
            'On Kubernetes, check the GPU Operator / device plugin pods and the nvidia.com/gpu node capacity.',
            'After a kernel update, rebuild or reinstall the driver (DKMS) and reboot.'
        ]
    },
    {
        title: 'LLM running on CPU (very slow tokens)',
        area: 'Serving',
        severity: 'HIGH',
        symptoms: 'A few tokens per second, CPU at 100%, GPU idle.',
        diagnose: [
            'ollama ps   # PROCESSOR column shows CPU/GPU split',
            'journalctl -u ollama --since "10 min ago" | grep -i -E "gpu|cuda|offload"',
            'nvidia-smi   # is the model loaded on the GPU?'
        ],
        fix: [
            'Use a model or quantisation that fits fully in VRAM; partial offload is much slower.',
            'Unload other models (ollama stop MODEL) so the new one fits.',
            'Make sure the service user can access /dev/nvidia* and the driver loaded at boot.'
        ]
    },
    {
        title: 'vLLM fails at startup: not enough KV cache',
        area: 'Serving',
        severity: 'HIGH',
        symptoms: '"No available memory for the cache blocks" or "max_model_len is larger than the KV cache can hold".',
        diagnose: [
            'nvidia-smi   # memory already used before vLLM starts?',
            'Check --max-model-len, --gpu-memory-utilization and the model size against VRAM'
        ],
        fix: [
            'Reduce --max-model-len to what you actually need.',
            'Raise --gpu-memory-utilization (e.g. 0.90) if nothing else shares the GPU.',
            'Use --tensor-parallel-size across GPUs, or a quantised model.'
        ]
    },
    {
        title: 'Inference latency spikes',
        area: 'Serving',
        severity: 'MEDIUM',
        symptoms: 'p95 latency jumps under load; time-to-first-token grows.',
        diagnose: [
            'curl -s http://127.0.0.1:8000/metrics | grep -E "num_requests_waiting|gpu_cache_usage"',
            'nvidia-smi -q -d PERFORMANCE   # thermal or power throttling?',
            'Check prompt lengths in logs: long contexts cost more per request'
        ],
        fix: [
            'Add replicas or GPUs; enable autoscaling on queue length, not CPU.',
            'Cap max tokens per request and per-tenant rate limits.',
            'Cache repeated prompts/system prefixes; trim retrieved context.'
        ]
    },
    {
        title: 'Context length exceeded',
        area: 'Application',
        severity: 'MEDIUM',
        symptoms: '"This model\'s maximum context length is N tokens" or answers ignore the start of the conversation.',
        diagnose: [
            'Count tokens for system prompt + history + retrieved chunks + max output',
            'Log the token usage returned by the API for failing requests'
        ],
        fix: [
            'Summarise or truncate old conversation turns.',
            'Retrieve fewer, smaller chunks.',
            'Reserve room for the answer (max_tokens) inside the window.'
        ]
    },
    {
        title: 'RAG gives wrong or hallucinated answers',
        area: 'RAG',
        severity: 'HIGH',
        symptoms: 'Confident answers that are not in your documents, or "I don\'t know" when the answer exists.',
        diagnose: [
            'Log the retrieved chunks for a failing question: is the right passage there at all?',
            'Check the embedding model used for queries matches the one used for indexing',
            'Spot-check chunk sizes: too large dilutes meaning, too small loses context'
        ],
        fix: [
            'If retrieval is wrong: tune chunking, add hybrid keyword + vector search, add a re-ranker.',
            'If retrieval is right but the answer is wrong: instruct the model to answer only from context and cite sources.',
            'Build a small evaluation set of real questions and re-run it after every change.'
        ]
    },
    {
        title: 'Embedding dimension mismatch',
        area: 'RAG',
        severity: 'MEDIUM',
        symptoms: '"expected 768 dimensions, not 1024" when inserting or searching vectors.',
        diagnose: [
            'SELECT vector_dims(embedding) FROM chunks LIMIT 1;',
            'Check which embedding model the indexer and the query path use'
        ],
        fix: [
            'Use one embedding model for both indexing and queries.',
            'When you change models, create a new column/index and re-embed everything.'
        ]
    },
    {
        title: 'RAG returns another tenant\'s documents',
        area: 'Security',
        severity: 'CRITICAL',
        symptoms: 'A user sees content from a different customer in an AI answer.',
        diagnose: [
            'Inspect the retrieval query: is tenant_id filtered inside the vector search?',
            'Check that filtering is not done afterwards in application code or by the LLM'
        ],
        fix: [
            'Enforce tenant and permission filters inside the retrieval query (WHERE tenant_id = $1).',
            'Use separate indexes or row-level security per tenant for high-risk data.',
            'Add an automated test that queries as tenant A and asserts no tenant B chunks return.'
        ]
    },
    {
        title: 'Prompt injection',
        area: 'Security',
        severity: 'CRITICAL',
        symptoms: 'The assistant follows instructions hidden in emails, tickets or web pages; leaks data or calls tools unexpectedly.',
        diagnose: [
            'Review agent/tool-call logs for actions the user did not ask for',
            'Red-team with payloads such as "ignore previous instructions and …" inside documents'
        ],
        fix: [
            'Treat all model input, including tool output, as untrusted.',
            'Give the model reading external content no or read-only tools.',
            'Enforce permissions and approvals outside the LLM; require a human for destructive actions.'
        ]
    },
    {
        title: 'Training loss is NaN or exploding',
        area: 'Training',
        severity: 'HIGH',
        symptoms: 'Loss becomes nan/inf or jumps wildly after some steps.',
        diagnose: [
            'Log loss and gradient norm every step',
            'Check the input batch at the failing step for NaN/inf or empty labels',
            'Note whether it started after enabling fp16'
        ],
        fix: [
            'Lower the learning rate and add warm-up.',
            'Enable gradient clipping (e.g. max norm 1.0).',
            'Use bf16 instead of fp16 where the GPU supports it; clean bad samples.'
        ]
    },
    {
        title: 'Overfitting',
        area: 'Training',
        severity: 'MEDIUM',
        symptoms: 'Training loss keeps falling while validation loss rises; great offline scores, poor real-world results.',
        diagnose: [
            'Plot training vs validation loss per epoch',
            'Check for duplicates between training and test sets (data leakage)'
        ],
        fix: [
            'Stop early at the best validation score.',
            'Add more varied data or augmentation; add regularisation (dropout, weight decay).',
            'Use a smaller model or fewer epochs.'
        ]
    },
    {
        title: 'Model drift in production',
        area: 'Operations',
        severity: 'MEDIUM',
        symptoms: 'Accuracy slowly degrades; more complaints, more fallbacks to humans.',
        diagnose: [
            'Compare recent input distributions with the training data',
            'Track a labelled sample of production predictions over time'
        ],
        fix: [
            'Set alerts on quality metrics, not only latency.',
            'Retrain on recent data on a schedule; keep the previous model for quick rollback.'
        ]
    },
    {
        title: 'Disk full from model files',
        area: 'Operations',
        severity: 'HIGH',
        symptoms: 'Downloads fail mid-way; services crash with "No space left on device".',
        diagnose: [
            'df -h',
            'du -sh ~/.cache/huggingface ~/.ollama /usr/share/ollama 2>/dev/null',
            'huggingface-cli scan-cache'
        ],
        fix: [
            'Delete unused models (ollama rm, huggingface-cli delete-cache).',
            'Move caches to a large data disk with HF_HOME and OLLAMA_MODELS.',
            'Alert at 80% disk usage on inference hosts.'
        ]
    },
    {
        title: 'Inference endpoint exposed to the internet',
        area: 'Security',
        severity: 'CRITICAL',
        symptoms: 'Unknown traffic and GPU usage; surprise bills ("denial of wallet").',
        diagnose: [
            'ss -tulpn | grep -E "11434|8000|8888"   # Ollama, vLLM, Jupyter',
            'Check firewall/security-group rules for those ports'
        ],
        fix: [
            'Bind services to 127.0.0.1 and put an authenticated reverse proxy in front.',
            'Require API keys and per-client rate limits.',
            'Restrict egress from GPU hosts.'
        ]
    }
];

export default aiIssues;
