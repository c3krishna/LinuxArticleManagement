
function Docker() {

    const dockerCommands = [

        {
            cmd: 'docker ps',
            desc: 'List running containers'
        },

        {
            cmd: 'docker images',
            desc: 'List docker images'
        },

        {
            cmd: 'docker logs container',
            desc: 'View container logs'
        },

        {
            cmd: 'docker exec -it container bash',
            desc: 'Access container shell'
        },

        {
            cmd: 'docker-compose up -d',
            desc: 'Start compose services'
        }

    ];

    return (

        <div className='min-h-screen bg-slate-100'>


            <div className='max-w-7xl mx-auto px-6 py-16'>

                <h1 className='text-7xl font-extrabold mb-4'>
                    Docker Documentation
                </h1>

                <p className='text-2xl text-slate-600 mb-10'>
                    Docker containers and DevOps management
                </p>

                <div className='grid lg:grid-cols-2 gap-8'>

                    {
                        dockerCommands.map((item, index) => (

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

export default Docker;
