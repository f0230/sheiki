export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido');
    }

    console.log('🔔 Webhook recibido:', req.body);
    return res.status(200).send('OK');
}
  