import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from?.pathname || '/admin/ordenes';

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError('Credenciales inválidas');
        } else {
            navigate(redirectTo, { replace: true });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
            <form
                onSubmit={handleLogin}
                className="bg-black/30 backdrop-blur-xl p-8 rounded-xl shadow-md w-full max-w-md border border-white/10"
            >
                <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full px-4 py-2 rounded bg-white/10 text-white placeholder-white/50 focus:outline-none"
                        placeholder="tucorreo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm mb-1">Contraseña</label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 rounded bg-white/10 text-white placeholder-white/50 focus:outline-none"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded transition"
                >
                    {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
            </form>
        </div>
    );
};

export default Login;
