// src/components/AdminSidebarDesktop.jsx
import { Link, useLocation } from 'react-router-dom';
import { FaClipboardList, FaBoxOpen } from 'react-icons/fa';

const AdminSidebarDesktop = () => {
    const { pathname } = useLocation();

    const links = [
        { to: '/admin/ordenes', label: 'Órdenes', icon: FaClipboardList },
        { to: '/admin/productos', label: 'Productos', icon: FaBoxOpen },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-black/50 backdrop-blur-xl border-r border-white/10">
            <div className="p-6 text-lg font-bold">Panel Admin</div>
            <nav className="flex-1 px-4 space-y-2">
                {links.map(({ to, label, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg ${pathname === to ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'
                            }`}
                    >
                        <Icon />
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default AdminSidebarDesktop;
