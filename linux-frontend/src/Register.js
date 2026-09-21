import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const register = async () => {
        try {
            await axios.post('/api/register', { name, email, phone, password });
            alert('Registration successful');
            navigate('/login');
        } catch (err) {
            alert('Registration failed');
        }
    };

    const field = 'w-full border border-slate-300 rounded-md p-3 text-[14px] bg-white text-ink';

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
            <div className="bg-white border border-slate-200 p-8 rounded-lg w-full max-w-md">
                <h1 className="text-[24px] font-semibold text-navy mb-6">Create account</h1>
                <div className="grid gap-3">
                    <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                    <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                    <button onClick={register} className="w-full bg-blue-600 text-white py-2.5 rounded-md text-[14px] font-medium">
                        Register
                    </button>
                    <p className="text-center text-[13px] text-slate-500">
                        Already have an account? <Link to="/login" className="text-blue-700">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
