import { Link } from 'react-router-dom';

function PageNavigation({

    previous,
    next

}) {

    return (

        <div className="mt-12">

            {/* BACK */}

            <div className="mb-6">

                <Link
                    to="/"
                    className="
                        inline-flex
                        items-center
                        gap-2
                        text-blue-600
                        font-medium
                        hover:text-blue-800
                    "
                >

                    ← Back to Home

                </Link>

            </div>

            {/* PREVIOUS / NEXT */}

            <div
                className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-6
                "
            >

                {/* PREVIOUS */}

                <div>

                    {
                        previous && (

                            <Link
                                to={previous.link}
                                className="
                                    block
                                    bg-white
                                    border
                                    rounded-2xl
                                    p-6
                                    hover:shadow-lg
                                    transition
                                "
                            >

                                <p className="text-slate-500 mb-2">

                                    ← Previous

                                </p>

                                <h3 className="text-2xl font-bold">

                                    {previous.title}

                                </h3>

                            </Link>
                        )
                    }

                </div>

                {/* NEXT */}

                <div>

                    {
                        next && (

                            <Link
                                to={next.link}
                                className="
                                    block
                                    bg-white
                                    border
                                    rounded-2xl
                                    p-6
                                    hover:shadow-lg
                                    transition
                                    text-right
                                "
                            >

                                <p className="text-slate-500 mb-2">

                                    Next →

                                </p>

                                <h3 className="text-2xl font-bold">

                                    {next.title}

                                </h3>

                            </Link>
                        )
                    }

                </div>

            </div>

        </div>
    );
}

export default PageNavigation;
