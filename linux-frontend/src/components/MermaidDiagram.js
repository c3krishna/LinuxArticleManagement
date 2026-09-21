import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

function MermaidDiagram({ chart }) {

    const ref = useRef(null);

    useEffect(() => {

        mermaid.initialize({

            startOnLoad: true
        });

        mermaid.contentLoaded();

    }, []);

    return (

        <div
            ref={ref}
            className='mermaid'
        >

            {chart}

        </div>
    );
}

export default MermaidDiagram;
