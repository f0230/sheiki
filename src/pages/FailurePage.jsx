import React, { useEffect, useState } from 'react';
import { StatusScreen } from '@mercadopago/sdk-react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react'; // Asegurate de tener lucide-react instalado

const getRejectionMessage = (statusDetail) => {
    switch (statusDetail) {
        case 'cc_rejected_bad_filled_card_number':
        case 'cc_rejected_bad_filled_security_code':
        case 'cc_rejected_bad_filled_date':
        case 'cc_rejected_bad_filled_other':
            return 'Los datos de tu tarjeta parecen incorrectos. Verificalos e intentá de nuevo.';
        case 'cc_rejected_call_for_authorize':
            return 'Debés autorizar esta transacción con tu banco. Llamalos y volvé a intentar.';
        case 'cc_rejected_card_disabled':
            return 'Tu tarjeta está inactiva. Activala o intentá con otra.';
        case 'cc_rejected_card_error':
            return 'No pudimos procesar tu tarjeta. Probá nuevamente o usá otro medio.';
        case 'cc_rejected_duplicated_payment':
            return 'Ya hiciste un pago por este mismo monto. Verificá si fue aprobado.';
        case 'cc_rejected_high_risk':
            return 'Tu pago fue rechazado por políticas antifraude. Usá otro método o contactá a tu banco.';
        case 'cc_rejected_insufficient_amount':
            return 'Fondos insuficientes. Probá con otra tarjeta o cargá saldo.';
        case 'cc_rejected_invalid_installments':
            return 'Tu tarjeta no permite esa cantidad de cuotas. Elegí otra opción.';
        case 'cc_rejected_max_attempts':
            return 'Alcanzaste el máximo de intentos permitidos. Intentá más tarde.';
        case 'cc_rejected_other_reason':
        default:
            return 'Tu pago fue rechazado. Intenta nuevamente o usá otro medio.';
    }
};

const FailurePage = () => {
    const [statusDetail, setStatusDetail] = useState(null);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('sheikiPaymentStatus', 'failure');

        const detail = localStorage.getItem('status_detail');
        setStatusDetail(detail);
        setMessage(getRejectionMessage(detail));

        return () => {
            if (window.statusScreenBrickController) {
                window.statusScreenBrickController.unmount();
                console.log('[FailurePage] 🧹 Brick desmontado');
            }
        };
    }, []);

    const initialization = {
        paymentId: localStorage.getItem('payment_id'),
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
    const onError = (error) => console.error('[FailurePage] ❌ Error en StatusScreen:', error);

    return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-xl mb-6">
                <StatusScreen
                    initialization={initialization}
                    customization={customization}
                    onReady={onReady}
                    onError={onError}
                />
            </div>

            <div className="bg-white border border-red-300 shadow-md rounded-xl max-w-xl w-full p-6 text-left mb-4">
                <div className="flex items-center gap-3 text-red-600">
                    <XCircle className="w-7 h-7 animate-pulse" />
                    <h2 className="text-xl font-bold">Hubo un problema con tu pago</h2>
                </div>

                {message && (
                    <p className="text-sm text-gray-700 mt-3">
                        {message}
                    </p>
                )}

                <div className="mt-4 text-sm text-gray-500">
                    Si creés que esto es un error, podés probar otro método de pago o contactarnos por WhatsApp.
                </div>
            </div>

            <button
                onClick={() => navigate('/pago')}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 flex items-center gap-2"
            >
                <XCircle className="w-5 h-5" />
                Volver a intentar el pago
            </button>
        </div>
    );
};

export default FailurePage;
