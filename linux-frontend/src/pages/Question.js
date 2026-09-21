import { useEffect, useState } from 'react';

import axios from 'axios';

import { useParams } from 'react-router-dom';

function Question() {

    const { slug } = useParams();

    const [data, setData] = useState(null);

    const [answer, setAnswer] = useState('');

    useEffect(() => {

        axios
            .get(`/api/forum/question/${slug}`)
            .then((res) => {
                setData(res.data);
            })
            .catch(() => setData({ question: { title: 'Not found', content: '' }, answers: [] }));

    }, [slug]);

    if (!data) {

        return <div>Loading...</div>;
    }

    const submitAnswer = async () => {

        await axios.post(

            '/api/forum/answer',

            {
                question_id: data.question.id,
                answer,
                user_id: localStorage.getItem('user_id')
            }
        );

        window.location.reload();
    };

    return (

        <div className='max-w-5xl mx-auto py-10 px-6'>
            <div className='bg-hub-card border border-white/5 rounded-2xl p-8 mb-8'>
                <h1 className='text-4xl font-bold text-white mb-6'>
                    {data.question.title}
                </h1>
                <div
                    className="article-body"
                    dangerouslySetInnerHTML={{
                        __html: data.question.content
                    }}
                />
            </div>
            <div className='space-y-4 mb-8'>
                {
                    data.answers.map((a) => (
                        <div
                            key={a.id}
                            className='bg-hub-card border border-white/5 rounded-2xl p-6'
                        >
                            <div
                                className="article-body"
                                dangerouslySetInnerHTML={{
                                    __html: a.answer
                                }}
                            />
                            <p className='text-hub-muted mt-4 text-sm'>
                                Answered by {a.name}
                            </p>
                        </div>
                    ))
                }
            </div>
            <div className='bg-hub-card border border-white/5 rounded-2xl p-8'>
                <h2 className='text-2xl font-semibold text-white mb-6'>
                    Your Answer
                </h2>
                <textarea
                    rows='8'
                    className='w-full border border-white/10 bg-hub-bg text-white rounded-2xl p-5 mb-6'
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                />
                <button
                    onClick={submitAnswer}
                    className='bg-hub-accent hover:bg-[#6b4cf0] text-white px-6 py-3 rounded-xl font-semibold'
                >
                    Post Answer
                </button>
            </div>
        </div>
    );
}

export default Question;
