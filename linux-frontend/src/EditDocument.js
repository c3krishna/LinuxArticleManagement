import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function EditDocument() {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        navigate(`/admin?edit=${id}`, { replace: true });
    }, [id, navigate]);

    return <div className="px-6 py-10 text-slate-500">Opening editor...</div>;
}

export default EditDocument;
