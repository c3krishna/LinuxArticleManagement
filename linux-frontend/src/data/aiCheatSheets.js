// Command reference for running AI/ML workloads on Linux. Same shape as the Linux sheets:
// { category, icon, commands: [{ cmd, desc }] }
const aiCheatSheets = [
    {
        category: 'NVIDIA GPU',
        icon: '🎛️',
        commands: [
            { cmd: 'nvidia-smi', desc: 'GPUs, driver/CUDA version, memory, utilisation and processes' },
            { cmd: 'watch -n1 nvidia-smi', desc: 'Refresh GPU status every second' },
            { cmd: 'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv', desc: 'Compact CSV of the numbers that matter' },
            { cmd: 'nvidia-smi -q -d PERFORMANCE', desc: 'Clock throttle reasons (thermal, power cap)' },
            { cmd: 'nvidia-smi topo -m', desc: 'GPU interconnect topology (NVLink vs PCIe)' },
            { cmd: 'nvcc --version', desc: 'Installed CUDA toolkit version' },
            { cmd: 'lspci | grep -i nvidia', desc: 'Is the card visible on the PCI bus at all?' },
            { cmd: 'dmesg -T | grep -i -E "nvrm|xid"', desc: 'Driver errors (Xid codes) from the kernel log' }
        ]
    },
    {
        category: 'Ollama (local LLMs)',
        icon: '🦙',
        commands: [
            { cmd: 'ollama pull llama3.1:8b', desc: 'Download a model' },
            { cmd: 'ollama run llama3.1:8b', desc: 'Chat with a model in the terminal' },
            { cmd: 'ollama list', desc: 'Models stored on disk' },
            { cmd: 'ollama ps', desc: 'Loaded models and their CPU/GPU split' },
            { cmd: 'ollama show llama3.1:8b', desc: 'Parameters, context length and quantisation' },
            { cmd: 'ollama rm llama3.1:8b', desc: 'Delete a model to free disk space' },
            { cmd: 'curl http://127.0.0.1:11434/api/generate -d \'{"model":"llama3.1:8b","prompt":"Hello"}\'', desc: 'Call the local REST API' },
            { cmd: 'journalctl -u ollama -f', desc: 'Follow the Ollama service log' }
        ]
    },
    {
        category: 'vLLM (model serving)',
        icon: '⚡',
        commands: [
            { cmd: 'vllm serve meta-llama/Llama-3.1-8B-Instruct', desc: 'Start an OpenAI-compatible server on port 8000' },
            { cmd: 'vllm serve MODEL --gpu-memory-utilization 0.90 --max-model-len 8192', desc: 'Cap GPU memory share and context length' },
            { cmd: 'vllm serve MODEL --tensor-parallel-size 2', desc: 'Split one model across two GPUs' },
            { cmd: 'vllm serve MODEL --api-key "$VLLM_API_KEY"', desc: 'Require a bearer key on every request' },
            { cmd: 'curl http://127.0.0.1:8000/v1/models', desc: 'Check the server is up and which model it serves' },
            { cmd: 'curl http://127.0.0.1:8000/metrics', desc: 'Prometheus metrics: queue length, tokens/s, KV-cache use' }
        ]
    },
    {
        category: 'PyTorch & CUDA',
        icon: '🔥',
        commands: [
            { cmd: 'python -c "import torch; print(torch.cuda.is_available(), torch.version.cuda)"', desc: 'Can PyTorch see the GPU, and which CUDA build is it?' },
            { cmd: 'python -c "import torch; print(torch.cuda.get_device_name(0))"', desc: 'Name of GPU 0 as PyTorch sees it' },
            { cmd: 'CUDA_VISIBLE_DEVICES=0 python train.py', desc: 'Pin a job to one GPU' },
            { cmd: 'PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True python train.py', desc: 'Reduce fragmentation-related out-of-memory errors' },
            { cmd: 'torch.cuda.memory_summary()', desc: 'Inside Python: what is holding GPU memory' },
            { cmd: 'pip install torch --index-url https://download.pytorch.org/whl/cu121', desc: 'Install a build that matches CUDA 12.1' }
        ]
    },
    {
        category: 'Hugging Face',
        icon: '🤗',
        commands: [
            { cmd: 'huggingface-cli login', desc: 'Store an access token for gated models' },
            { cmd: 'huggingface-cli download ORG/MODEL --local-dir ./model', desc: 'Download model files to a folder' },
            { cmd: 'export HF_HOME=/data/hf', desc: 'Move the model cache to a bigger disk' },
            { cmd: 'huggingface-cli scan-cache', desc: 'What is in the cache and how big it is' },
            { cmd: 'huggingface-cli delete-cache', desc: 'Interactively remove cached models' },
            { cmd: 'export HF_HUB_OFFLINE=1', desc: 'Use only cached files (air-gapped servers)' }
        ]
    },
    {
        category: 'GPU containers & Kubernetes',
        icon: '📦',
        commands: [
            { cmd: 'docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi', desc: 'Prove containers can reach the GPU' },
            { cmd: 'sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker', desc: 'Wire the NVIDIA Container Toolkit into Docker' },
            { cmd: 'kubectl describe node NODE | grep -i nvidia.com/gpu', desc: 'GPUs a Kubernetes node advertises' },
            { cmd: 'kubectl get pods -n gpu-operator', desc: 'Health of the NVIDIA GPU Operator' },
            { cmd: 'resources: { limits: { nvidia.com/gpu: 1 } }', desc: 'Request one GPU in a pod spec' }
        ]
    },
    {
        category: 'Python environments',
        icon: '🐍',
        commands: [
            { cmd: 'python3 -m venv .venv && source .venv/bin/activate', desc: 'Isolated environment per project' },
            { cmd: 'pip install -r requirements.txt', desc: 'Install pinned dependencies' },
            { cmd: 'pip freeze > requirements.txt', desc: 'Pin exactly what is installed' },
            { cmd: 'jupyter lab --no-browser --ip 127.0.0.1 --port 8888', desc: 'Notebook server bound to localhost only' },
            { cmd: 'ssh -L 8888:127.0.0.1:8888 user@gpu-host', desc: 'Reach that notebook safely through SSH' }
        ]
    },
    {
        category: 'Vector search (pgvector)',
        icon: '🧭',
        commands: [
            { cmd: 'CREATE EXTENSION IF NOT EXISTS vector;', desc: 'Enable pgvector in PostgreSQL' },
            { cmd: 'CREATE TABLE chunks (id bigserial PRIMARY KEY, tenant_id int, body text, embedding vector(768));', desc: 'Store text chunks with their embeddings' },
            { cmd: 'CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);', desc: 'Approximate nearest-neighbour index' },
            { cmd: 'SELECT body FROM chunks WHERE tenant_id = $1 ORDER BY embedding <=> $2 LIMIT 5;', desc: 'Top-5 similar chunks, filtered by tenant inside the query' }
        ]
    }
];

export default aiCheatSheets;
