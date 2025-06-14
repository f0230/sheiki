// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuth] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const verifyRole = async () => {
            // 1. sesión
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setAuth(false);
                setLoading(false);
                return;
            }

            // 2. perfil/rol
            const { data: perfil, error } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!error && perfil?.rol === 'admin') {
                setAuth(true);
            }

            setLoading(false);
        };

        verifyRole();

        // 3. Actualiza si el usuario cambia de estado
        const { data: listener } = supabase.auth.onAuthStateChange(() => verifyRole());

        return () => listener.subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white">
                Verificando credenciales…
            </div>
        );
    }

    if (!authorized) {
        // Redirige y guarda de dónde venía
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
};

export default ProtectedRoute;
