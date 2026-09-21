import { Link } from 'react-router-dom';

import PageNavigation from './components/PageNavigation';

function Tutorials() {

    const tutorials = [

        {
            title: 'Ubuntu Installation',
            slug: 'ubuntu-installation'
        },

        {
            title: 'Linux History',
            slug: 'linux-history'
        }
    ];

    return (

        <div className="max-w-5xl mx-auto">

            <div className="mb-12">

                <h1
                    className="
                        text-6xl
                        font-extrabold
                        mb-4
                    "
                >

                    Linux Tutorials

                </h1>

                <p className="text-2xl text-slate-600">

                    Linux administration and server tutorials

                </p>

            </div>

            <div className="grid gap-8">

                {
                    tutorials.map(item => (

                        <Link
                            key={item.slug}
                            to={`/${item.slug}`}
                            className="
                                bg-white
                                rounded-3xl
                                p-10
                                border
                                shadow-sm
                                hover:shadow-xl
                                transition
                                block
                            "
                        >

                            <h2
                                className="
                                    text-4xl
                                    font-bold
                                "
                            >

                                {item.title}

                            </h2>

                        </Link>
                    ))
                }

            </div>

            <PageNavigation

                previous={{
                    title: 'Docker Documentation',
                    link: '/docker'
                }}

                next={{
                    title: 'Kubernetes Documentation',
                    link: '/kubernetes'
                }}

            />

        </div>
    );
}

export default Tutorials;
