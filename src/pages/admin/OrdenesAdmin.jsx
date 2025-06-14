import { useEffect, useState } from 'react';
import { obtenerOrdenes, procesarTransferencia } from '../../api/admin';
import OrdenesTable from '../../components/OrdenesTable';

const OrdenesAdmin = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [procesandoId, setProcesandoId] = useState(null);

    const cargarOrdenes = async () => {
        setLoading(true);
        const data = await obtenerOrdenes();
        setOrdenes(data);
        setLoading(false);
    };

    useEffect(() => {
        cargarOrdenes();
    }, []);

    const handleProcesarTransferencia = async (externalRef) => {
        setProcesandoId(externalRef);
        const ok = await procesarTransferencia(externalRef);
        if (ok) await cargarOrdenes();
        setProcesandoId(null);
    };

    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-4">Órdenes</h1>

            {loading ? (
                <p className="text-gray-400">Cargando órdenes...</p>
            ) : ordenes.length === 0 ? (
                <div className="space-y-4">
                    <p className="text-gray-400">No hay órdenes registradas.</p>
                    <pre className="bg-black/20 text-xs p-4 rounded max-h-[300px] overflow-auto">
                        Debug: {JSON.stringify(ordenes, null, 2)}
                    </pre>
                </div>
            ) : (
                <OrdenesTable
                    ordenes={ordenes}
                    onProcesar={handleProcesarTransferencia}
                    procesandoId={procesandoId}
                />
            )}
        </div>
    );
};

export default OrdenesAdmin;
