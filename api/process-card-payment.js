// /api/process-card-payment.js
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN, // Ensure MP_ACCESS_TOKEN is in your Vercel env variables
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
        transaction_amount, // This amount comes from the frontend (Brick initialization)
        installments,
        payer, // Includes email, identification (if collected)
        external_reference, // Crucial for linking
        order_items, // Sent from frontend for validation/description
        shipping_cost, // Sent from frontend for validation
        shipping_data // Sent from frontend
    } = req.body;

    // --- SERVER-SIDE AMOUNT VALIDATION (VERY IMPORTANT) ---
    // This is a simplified example. In a real scenario, you might fetch product prices
    // from your database based on item IDs in order_items to prevent tampering.
    let serverCalculatedAmount = 0;
    if (order_items && Array.isArray(order_items)) {
        serverCalculatedAmount = order_items.reduce((sum, item) => {
            // Assuming item.unit_price and item.quantity are sent and correct
            return sum + (Number(item.unit_price) * Number(item.quantity));
        }, 0);
    }
    serverCalculatedAmount += Number(shipping_cost || 0);
    serverCalculatedAmount = parseFloat(serverCalculatedAmount.toFixed(2));


    if (Number(transaction_amount) !== serverCalculatedAmount) {
        console.error("Amount mismatch. Frontend:", Number(transaction_amount), "Backend calculated:", serverCalculatedAmount);
        return res.status(400).json({
            error: 'Invalid transaction amount.',
            detail: `Expected ${serverCalculatedAmount}, got ${Number(transaction_amount)}`
        });
    }
    // --- END SERVER-SIDE AMOUNT VALIDATION ---

    const payment_data = {
        transaction_amount: Number(transaction_amount),
        token: token,
        description: `Pedido Sheiki - ${external_reference}`, // Customize as needed
        installments: Number(installments),
        payment_method_id: payment_method_id,
        issuer_id: issuer_id, // issuer_id is a string
        payer: {
            email: payer.email,
            // identification: payer.identification // Pass if collected by the Brick
            // first_name: shipping_data.nombre.split(' ')[0], // Example
        },
        external_reference: external_reference,
        metadata: {
            // Include metadata that was in your preference, or new relevant data
            // This will be available in the webhook and payment details.
            ...shipping_data,
            shipping_cost: Number(shipping_cost),
            items: order_items, // Storing items again for reference if needed
            externalReference: external_reference, // Consistent naming
        },
        // notification_url: "YOUR_VERCEL_DEPLOYMENT_URL/api/webhook" // Ensure this is correctly set up in your MP app settings
        // It's generally better to configure the notification URL at the application level in Mercado Pago
        // or at the preference level if you were creating a preference specifically for this.
        // If create-preference is still called, its notification_url (if set) would apply.
    };

    try {
        console.log("[process-card-payment] Attempting to create payment with data:", JSON.stringify(payment_data, null, 2));
        const paymentResponse = await paymentClient.create({ body: payment_data });
        console.log('[process-card-payment] MP Payment Response:', paymentResponse);

        res.status(201).json({
            id: paymentResponse.id,
            status: paymentResponse.status,
            status_detail: paymentResponse.status_detail,
            external_reference: paymentResponse.external_reference
        });
    } catch (error) {
        console.error('[process-card-payment] Error creating payment with Mercado Pago:', error);
        // Extracting more detailed error from Mercado Pago's response
        const mpError = error.cause && Array.isArray(error.cause) && error.cause.length > 0 ? error.cause[0] : { code: 'unknown', description: error.message || 'Unknown error' };
        const errorStatus = error.statusCode || 500;

        res.status(errorStatus).json({
            error: 'Failed to process payment',
            message: mpError.description || 'An error occurred while processing the payment with Mercado Pago.',
            mp_error_code: mpError.code,
            details: error.cause // Full error details for server logs
        });
    }
}