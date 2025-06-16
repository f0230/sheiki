// /api/send-order-email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { email, nombre, items, total, external_reference } = req.body;

        if (!email || !nombre || !items || !total) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const listaProductos = items.map(item => `- ${item.nombre} (Talle ${item.talle}, Color ${item.color}) x${item.quantity}`).join('\n');

        const mensaje = `Hola ${nombre},\n\nGracias por tu compra en Sheiki 🖤\n\nResumen de tu orden (${external_reference}):\n\n${listaProductos}\n\nTotal: $${total}\n\nEn breve te estaremos contactando para coordinar la entrega.\n\n¡Gracias por elegirnos!`;

        const { data, error } = await resend.emails.send({
            from: 'Sheiki <no-responder@sheiki.uy>',
            to: email,
            subject: `Gracias por tu compra 🖤 [${external_reference}]`,
            text: mensaje,
        });

        if (error) throw error;

        return res.status(200).json({ message: 'Email enviado correctamente', data });

    } catch (err) {
        console.error('❌ Error al enviar email:', err);
        return res.status(500).json({ message: 'Error interno al enviar email' });
    }
}
