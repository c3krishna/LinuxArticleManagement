import ReactMarkdown from 'react-markdown';

function MarkdownRenderer({ content }) {

    return (

        <div className='prose max-w-none'>

            <ReactMarkdown>

                {content}

            </ReactMarkdown>

        </div>
    );
}

export default MarkdownRenderer;
