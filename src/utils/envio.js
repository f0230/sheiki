export const calcularCostoEnvio = ({ tipoEntrega, departamento, total }) => {
    if (total >= 1800) return 0;
    if (!tipoEntrega) return 0;

    const tipo = tipoEntrega.toLowerCase();
    const dpto = departamento.trim().toLowerCase();

    if (tipo === 'retiro') return 0;
    if (tipo === 'agencia') return 180;

    if (tipo === 'domicilio') {
        if (dpto === 'paysandú') return 100;
        return 250;
    }

    return 0; // fallback de seguridad
};
  