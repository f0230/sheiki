// /api/process-card-payment.js
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN, // THIS IS THE CRUCIAL CREDENTIAL
    options: { timeout: 5000 }
});
const paymentClient = new Payment(client);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const {
        token,
        issuer_id,
        payment_method_id,
        transaction_amount,
        installments,
        payer,
        external_reference,
        order_items,
        shipping_cost,
        shipping_data
    } = req.body;

    // --- SERVER-SIDE AMOUNT VALIDATION ---
    let serverCalculatedAmount = 0;
    if (order_items && Array.isArray(order_items)) {
        serverCalculatedAmount = order_items.reduce((sum, item) => {
            return sum + (Number(item.unit_price) * Number(item.quantity));
        }, 0);
    }
    serverCalculatedAmount += Number(shipping_cost || 0);
    serverCalculatedAmount = parseFloat(serverCalculatedAmount.toFixed(2));

    if (Number(transaction_amount) !== serverCalculatedAmount) {
        console.error("[process-card-payment] Amount mismatch. Frontend:", Number(transaction_amount), "Backend calculated:", serverCalculatedAmount);
        return res.status(400).json({
            error: 'Invalid transaction amount.',
            message: `El monto de la transacción es inválido. Esperado: ${serverCalculatedAmount}, Recibido: ${Number(transaction_amount)}`,
            detail: `Expected ${serverCalculatedAmount}, got ${Number(transaction_amount)}`
        });
    }
    // --- END SERVER-SIDE AMOUNT VALIDATION ---

    const payment_data = {
        transaction_amount: Number(transaction_amount),
        token: token,
        description: `Pedido Sheiki - ${external_reference}`,
        installments: Number(installments),
        payment_method_id: payment_method_id,
        issuer_id: String(issuer_id), // Ensure issuer_id is a string
        payer: {
            email: payer.email,
            // Consider adding identification if required by your Mercado Pago account or for certain amounts
            // identification: {
            //   type: payer.identification?.type, // e.g., "CI" for Uruguay
            //   number: payer.identification?.number
            // }
        },
        external_reference: external_reference,
        metadata: {
            ...shipping_data,
            shipping_cost: Number(shipping_cost),
            items: order_items,
            externalReference: external_reference, // Consistent naming
        },
        // notification_url: "YOUR_VERCEL_DEPLOYMENT_URL/api/webhook" 
        // Ensure this is configured at application level in Mercado Pago settings,
        // or ensure your create-preference sets it if you want to override.
    };

    try {
        console.log("[process-card-payment] Attempting to create payment with data:", JSON.stringify(payment_data, null, 2));
        const paymentResponse = await paymentClient.create({ body: payment_data });
        console.log('[process-card-payment] MP Payment Response:', paymentResponse);

        // Successfully created payment intent with Mercado Pago
        res.status(201).json({
            id: paymentResponse.id,
            status: paymentResponse.status,
            status_detail: paymentResponse.status_detail,
            external_reference: paymentResponse.external_reference
        });
    } catch (error) {
        console.error('[process-card-payment] Error creating payment with Mercado Pago:', error.toString(), error.cause ? JSON.stringify(error.cause) : '');

        const mpErrorMessage = error.cause && Array.isArray(error.cause) && error.cause.length > 0
            ? error.cause[0].description
            : error.message || 'Unknown error processing payment.';
        const errorStatus = error.statusCode || 500; // Mercado Pago SDK might use statusCode

        res.status(errorStatus).json({
            error: 'Failed to process payment with Mercado Pago',
            message: mpErrorMessage, // Provide MP specific message to frontend
            mp_error_cause: error.cause // For server logging or more detailed frontend errors if needed
        });
    }
}