import { Payment } from '@mercadopago/sdk-react';

const CheckoutPage = () => {
    const [preferenceId, setPreferenceId] = useState(null);
    const { items } = useCart();

    useEffect(() => {
        const getPreference = async () => {
            const res = await fetch('/api/create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            const data = await res.json();
            setPreferenceId(data.preference.id);
        };

        if (items.length > 0) getPreference();
    }, [items]);

    return (
        <div>
            {preferenceId && (
                <Payment
                    initialization={{ amount: 1200, preferenceId }}
                    onSubmit={async (param) => {
                        console.log('Datos del formulario:', param);
                    }}
                    onError={(error) => console.error('Error en el pago:', error)}
                />
            )}
        </div>
    );
};
