import React, { useEffect } from 'react';
import { StatusScreen } from '@mercadopago/sdk-react';

const FailurePage = () => {
    useEffect(() => {
        localStorage.setItem('sheikiPaymentStatus', 'failure');

        return () => {
            if (window.statusScreenBrickController) {
                window.statusScreenBrickController.unmount();
                console.log('[FailurePage] 🧹 Brick desmontado');
            }
        };
    }, []);

    const initialization = {
        paymentId: localStorage.getItem('payment_id'), // Debe estar guardado en el checkout
    };

    const customization = {
        backUrls: {
            return: 'https://www.sheiki.uy',
            error: 'https://www.sheiki.uy/failure',
        },
        texts: {
            ctaGeneralErrorLabel: 'Reintentar el pago',
            ctaReturnLabel: 'Volver a la tienda',
        },
    };

    const onReady = () => console.log('[FailurePage] ✅ Brick listo');
    const onError = (error) => console.error('[FailurePage] ❌ Error:', error);

    return (
        <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
            <div id="statusScreenBrick_container" className="w-full max-w-xl">
                <StatusScreen
                    initialization={initialization}
                    customization={customization}
                    onReady={onReady}
                    onError={onError}
                />
            </div>
        </div>
    );
};

export default FailurePage;
