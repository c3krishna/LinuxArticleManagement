import React, { useState } from 'react';

function GPU() {

    const [search, setSearch] = useState('');

    const gpuSections = [

        {
            title: 'GPU Monitoring',
            icon: '🖥️',
            commands: [
                {
                    cmd: 'nvidia-smi',
                    desc: 'Show GPU utilization, memory usage, temperature and running processes'
                },
                {
                    cmd: 'watch -n 1 nvidia-smi',
                    desc: 'Live GPU monitoring every 1 second'
                },
                {
                    cmd: 'nvidia-smi pmon',
                    desc: 'GPU process utilization monitor'
                },
                {
                    cmd: 'nvidia-smi dmon',
                    desc: 'GPU device monitoring'
                },
                {
                    cmd: 'gpustat',
                    desc: 'Compact GPU monitoring utility'
                },
                {
                    cmd: 'nvtop',
                    desc: 'Interactive NVIDIA GPU process viewer'
                }
            ]
        },

        {
            title: 'CUDA Commands',
            icon: '⚡',
            commands: [
                {
                    cmd: 'nvcc --version',
                    desc: 'Check CUDA compiler version'
                },
                {
                    cmd: 'which nvcc',
                    desc: 'Locate CUDA compiler'
                },
                {
                    cmd: 'echo $CUDA_HOME',
                    desc: 'Check CUDA environment variable'
                },
                {
                    cmd: 'ls /usr/local/cuda',
                    desc: 'Verify CUDA installation path'
                },
                {
                    cmd: 'cat /usr/local/cuda/version.txt',
                    desc: 'Show installed CUDA version'
                },
                {
                    cmd: 'ldconfig -p | grep cuda',
                    desc: 'Verify CUDA libraries'
                }
            ]
        },

        {
            title: 'Driver Management',
            icon: '🔧',
            commands: [
                {
                    cmd: 'modinfo nvidia',
                    desc: 'Check NVIDIA driver information'
                },
                {
                    cmd: 'lsmod | grep nvidia',
                    desc: 'Verify NVIDIA kernel module loaded'
                },
                {
                    cmd: 'ubuntu-drivers devices',
                    desc: 'Detect recommended NVIDIA drivers'
                },
                {
                    cmd: 'sudo apt install nvidia-driver-550',
                    desc: 'Install NVIDIA driver'
                },
                {
                    cmd: 'sudo systemctl restart gdm',
                    desc: 'Restart display manager'
                },
                {
                    cmd: 'sudo reboot',
                    desc: 'Reboot system after driver installation'
                }
            ]
        },

        {
            title: 'GPU Troubleshooting',
            icon: '🚨',
            commands: [
                {
                    cmd: 'dmesg | grep -i nvidia',
                    desc: 'Check NVIDIA kernel errors'
                },
                {
                    cmd: 'journalctl -xe | grep -i gpu',
                    desc: 'Search GPU-related logs'
                },
                {
                    cmd: 'nvidia-smi -r',
                    desc: 'Reset GPU'
                },
                {
                    cmd: 'fuser -v /dev/nvidia*',
                    desc: 'Find GPU processes'
                },
                {
                    cmd: 'kill -9 PID',
                    desc: 'Kill GPU hanging process'
                },
                {
                    cmd: 'systemctl status nvidia-persistenced',
                    desc: 'Check NVIDIA persistence daemon'
                }
            ]
        },

        {
            title: 'GPU Performance',
            icon: '📊',
            commands: [
                {
                    cmd: 'nvidia-smi --query-gpu=utilization.gpu --format=csv',
                    desc: 'GPU utilization report'
                },
                {
                    cmd: 'nvidia-smi --query-gpu=memory.used,memory.total --format=csv',
                    desc: 'GPU memory statistics'
                },
                {
                    cmd: 'nvidia-smi --query-gpu=temperature.gpu --format=csv',
                    desc: 'GPU temperature monitoring'
                },
                {
                    cmd: 'nvidia-smi topo -m',
                    desc: 'GPU topology matrix'
                },
                {
                    cmd: 'nvidia-smi -q',
                    desc: 'Detailed GPU information'
                }
            ]
        },

        {
            title: 'PyTorch GPU',
            icon: '🔥',
            commands: [
                {
                    cmd: 'python -c "import torch; print(torch.cuda.is_available())"',
                    desc: 'Verify CUDA availability in PyTorch'
                },
                {
                    cmd: 'python -c "import torch; print(torch.cuda.device_count())"',
                    desc: 'Check number of GPUs'
                },
                {
                    cmd: 'python -c "import torch; print(torch.cuda.get_device_name(0))"',
                    desc: 'Get GPU model name'
                },
                {
                    cmd: 'torch.cuda.empty_cache()',
                    desc: 'Clear GPU cache'
                }
            ]
        },

        {
            title: 'TensorFlow GPU',
            icon: '🧠',
            commands: [
                {
                    cmd: 'python -c "import tensorflow as tf; print(tf.config.list_physical_devices(\'GPU\'))"',
                    desc: 'Check TensorFlow GPU detection'
                },
                {
                    cmd: 'nvidia-smi | grep python',
                    desc: 'Identify TensorFlow GPU processes'
                },
                {
                    cmd: 'export CUDA_VISIBLE_DEVICES=0',
                    desc: 'Assign specific GPU'
                }
            ]
        },

        {
            title: 'Multi GPU Management',
            icon: '🚀',
            commands: [
                {
                    cmd: 'nvidia-smi topo -m',
                    desc: 'Multi-GPU topology'
                },
                {
                    cmd: 'CUDA_VISIBLE_DEVICES=0,1 python app.py',
                    desc: 'Assign multiple GPUs'
                },
                {
                    cmd: 'nvidia-smi mig -lgi',
                    desc: 'List MIG GPU instances'
                },
                {
                    cmd: 'nvidia-smi mig -cgi',
                    desc: 'Create GPU instances'
                }
            ]
        }

    ];

    const filteredSections = gpuSections.filter(section =>
        section.title.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <div className='min-h-screen bg-slate-100'>

            {/* HEADER */}

            <div className='bg-white border-b'>

                <div className='max-w-7xl mx-auto px-6 py-10'>

                    <h1 className='text-6xl font-extrabold text-slate-900 mb-4'>
                        Linux GPU CheatSheet
                    </h1>

                    <p className='text-2xl text-slate-600'>
                        NVIDIA • CUDA • PyTorch • TensorFlow • Multi GPU • AI Infrastructure
                    </p>

                </div>

            </div>

            {/* SEARCH */}

            <div className='max-w-7xl mx-auto px-6 py-8'>

                <input
                    type='text'
                    placeholder='Search GPU Commands...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='
                        w-full
                        bg-white
                        border
                        rounded-2xl
                        px-6
                        py-5
                        text-xl
                        outline-none
                    '
                />

            </div>

            {/* CONTENT */}

            <div className='max-w-7xl mx-auto px-6 pb-20'>

                <div className='grid lg:grid-cols-2 gap-8'>

                    {
                        filteredSections.map((section, index) => (

                            <div
                                key={index}
                                className='
                                    bg-white
                                    rounded-3xl
                                    shadow-sm
                                    border
                                    overflow-hidden
                                '
                            >

                                {/* TITLE */}

                                <div
                                    className='
                                        border-b
                                        px-8
                                        py-6
                                        flex
                                        items-center
                                        gap-4
                                    '
                                >

                                    <span className='text-4xl'>
                                        {section.icon}
                                    </span>

                                    <h2 className='text-3xl font-bold'>
                                        {section.title}
                                    </h2>

                                </div>

                                {/* COMMANDS */}

                                <div className='p-8 space-y-4'>

                                    {
                                        section.commands.map((item, idx) => (

                                            <div
                                                key={idx}
                                                className='
                                                    bg-slate-100
                                                    rounded-2xl
                                                    p-5
                                                    hover:bg-slate-200
                                                    transition
                                                '
                                            >

                                                <div
                                                    className='
                                                        font-mono
                                                        text-green-700
                                                        font-bold
                                                        text-lg
                                                        mb-2
                                                        break-all
                                                    '
                                                >
                                                    {item.cmd}
                                                </div>

                                                <div className='text-slate-700 text-lg'>
                                                    {item.desc}
                                                </div>

                                            </div>
                                        ))
                                    }

                                </div>

                            </div>
                        ))
                    }

                </div>

            </div>

        </div>
    );
}

export default GPU;
