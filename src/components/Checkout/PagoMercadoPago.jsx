import React from 'react';
import { Payment } from '@mercadopago/sdk-react';

const PagoMercadoPago = ({ preferenceId }) => {
    if (!preferenceId) return null;

    return (
        <div className="bg-white text-black p-6 rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-4">Completa tu pago</h2>
            <p className="text-sm text-gray-600 mb-4">
                Serás redirigido de forma segura para completar el pago.
            </p>

            <Payment
                key={preferenceId}
                initialization={{ preferenceId }}
                customization={{
                    paymentMethods: {
                        mercadoPago: 'all',
                    },
                    redirectMode: 'modal',
                }}
                onReady={() => console.log('[Brick] ✅ Listo')}
                onError={(error) => console.error('[Brick] ❌ Error:', error)}
            />
        </div>
    );
};

export default PagoMercadoPago;
