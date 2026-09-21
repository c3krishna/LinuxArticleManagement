
function Kubernetes() {

    const commands = [

        {
            cmd: 'kubectl get pods',
            desc: 'List all pods'
        },

        {
            cmd: 'kubectl get nodes',
            desc: 'List cluster nodes'
        },

        {
            cmd: 'kubectl logs pod-name',
            desc: 'View pod logs'
        },

        {
            cmd: 'kubectl describe pod pod1',
            desc: 'Describe pod details'
        },

        {
            cmd: 'kubectl apply -f app.yaml',
            desc: 'Deploy application manifest'
        },

        {
            cmd: 'kubectl delete pod pod1',
            desc: 'Delete pod'
        }

    ];

    return (

        <div className='min-h-screen bg-slate-100'>


            <div className='max-w-7xl mx-auto px-6 py-16'>

                <h1 className='text-7xl font-extrabold mb-4'>
                    Kubernetes Documentation
                </h1>

                <p className='text-2xl text-slate-600 mb-10'>
                    Kubernetes cluster management and orchestration
                </p>

                <div className='grid lg:grid-cols-2 gap-8'>

                    {
                        commands.map((item, index) => (

                            <div
                                key={index}
                                className='
                                    bg-white
                                    rounded-3xl
                                    border
                                    p-8
                                    shadow-sm
                                '
                            >

                                <div
                                    className='
                                        font-mono
                                        text-blue-700
                                        text-2xl
                                        font-bold
                                        mb-4
                                    '
                                >
                                    {item.cmd}
                                </div>

                                <div className='text-xl text-slate-700'>
                                    {item.desc}
                                </div>

                            </div>
                        ))
                    }

                </div>

            </div>

        </div>
    );
}

export default Kubernetes;
