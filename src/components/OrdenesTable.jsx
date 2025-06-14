const OrdenesTable = ({ ordenes, onProcesar, procesandoId }) => {
    return (
        <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full bg-white text-sm text-gray-900 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                    <tr>
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Nombre</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Teléfono</th>
                        <th className="px-4 py-2">Departamento</th>
                        <th className="px-4 py-2">Dirección</th>
                        <th className="px-4 py-2">Entrega</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2">Estado</th>
                        <th className="px-4 py-2">Fecha</th>
                        <th className="px-4 py-2">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {ordenes.map((orden) => (
                        <tr key={orden.id} className="border-t border-gray-200">
                            <td className="px-4 py-2">{orden.id}</td>
                            <td className="px-4 py-2">{orden.nombre}</td>
                            <td className="px-4 py-2">{orden.email_cliente}</td>
                            <td className="px-4 py-2">{orden.telefono}</td>
                            <td className="px-4 py-2">{orden.departamento}</td>
                            <td className="px-4 py-2">{orden.direccion}</td>
                            <td className="px-4 py-2 capitalize">{orden.tipo_entrega}</td>
                            <td className="px-4 py-2">${orden.total}</td>
                            <td className="px-4 py-2">{orden.estado_pago}</td>
                            <td className="px-4 py-2">{orden.fecha ? new Date(orden.fecha).toLocaleDateString() : '—'}</td>
                            <td className="px-4 py-2">
                                {orden.estado_pago === 'pending_transferencia' ? (
                                    <button
                                        onClick={() => onProcesar(orden.external_reference)}
                                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
                                        disabled={procesandoId === orden.external_reference}
                                    >
                                        {procesandoId === orden.external_reference ? 'Procesando...' : 'Aprobar'}
                                    </button>
                                ) : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrdenesTable;
  