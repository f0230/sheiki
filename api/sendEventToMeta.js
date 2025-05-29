// /api/sendEventToMeta.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        console.warn('[MetaAPI] ❌ Método no permitido:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const pixelId = process.env.META_PIXEL_ID;

    if (!accessToken || !pixelId) {
        console.error('[MetaAPI] ❌ Faltan META_ACCESS_TOKEN o META_PIXEL_ID');
        return res.status(500).json({ error: 'Faltan credenciales de Meta (TOKEN o PIXEL_ID).' });
    }

    const event = req.body;

    const payload = {
        data: [
            {
                event_name: event.event_name,
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                event_source_url: event.url,
                user_data: {
                    client_user_agent: event.user_agent,
                    client_ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    em: event.email ? [sha256(event.email)] : undefined,
                },
                custom_data: event.custom_data || {},
            },
        ],
    };

    console.log(`[MetaAPI] 📤 Enviando evento a Meta Pixel ${pixelId}:`, JSON.stringify(payload, null, 2));

    try {
        const fbRes = await fetch(
            `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const fbData = await fbRes.json();

        if (!fbRes.ok) {
            console.error('[MetaAPI] ❌ Error en respuesta de Meta:', fbData);
            return res.status(fbRes.status).json({ error: 'Error en respuesta de Meta', details: fbData });
        }

        console.log('[MetaAPI] ✅ Evento enviado correctamente a Meta:', fbData);
        return res.status(200).json(fbData);
    } catch (error) {
        console.error('[MetaAPI] ❌ Error al enviar evento a Meta:', error);
        return res.status(500).json({ error: 'Error enviando evento a Meta', details: error.message });
    }
}

function sha256(str) {
    return require('crypto').createHash('sha256').update(str).digest('hex');
}
  