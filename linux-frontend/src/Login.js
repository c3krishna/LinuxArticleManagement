import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const login = async () => {
        try {
            const res = await axios.post('/api/login', { email, password });
            localStorage.setItem('user_id', res.data.user.id);
            localStorage.setItem('name', res.data.user.name);
            localStorage.setItem('email', res.data.user.email);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate(res.data.user.role === 'admin' ? '/admin' : '/');
        } catch (err) {
            alert('Invalid credentials');
        }
    };

    const googleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);
            localStorage.setItem('user', JSON.stringify({
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture
            }));
            localStorage.setItem('token', credentialResponse.credential);
            navigate('/');
        } catch (err) {
            console.log(err);
        }
    };

    const field = 'w-full border border-slate-300 rounded-md p-3 text-[14px] bg-white text-ink focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
            <div className="bg-white border border-slate-200 p-8 rounded-lg w-full max-w-md">
                <h1 className="text-[24px] font-semibold text-navy">Admin login</h1>
                <p className="text-[14px] text-slate-500 mt-1 mb-6">Sign in to create and edit documents</p>
                <div className="grid gap-3">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                    <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-[14px] font-medium">
                        Sign in
                    </button>
                    <div className="flex justify-center pt-2">
                        <GoogleLogin onSuccess={googleSuccess} onError={() => console.log('Login Failed')} />
                    </div>
                    <p className="text-center text-[13px] text-slate-500">
                        No account? <Link to="/register" className="text-blue-700">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
