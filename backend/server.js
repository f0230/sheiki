
import { loadMercadoPago } from "@mercadopago/sdk-js";

await loadMercadoPago();
const mp = new window.MercadoPago("TEST-e6e6f120-4164-4363-8777-34b204c147ab");

// Importar dependencias
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');  // SDK de MercadoPago

// Inicializar express
const app = express();
const port = 5000;

// Middleware
app.use(cors());  // Permitir solicitudes CORS
app.use(express.json());  // Parsear cuerpo de las solicitudes en formato JSON

// Configurar MercadoPago con tu access token
mercadopago.configurations.setAccessToken('TEST-e6e6f120-4164-4363-8777-34b204c147ab');  // Usa tu access token de prueba

// Endpoint para crear la preferencia de pago
app.post('/create-payment', (req, res) => {
  const preference = {
    items: req.body.items.map(item => ({
      title: item.nombre,
      unit_price: item.precio,  // Precio por unidad
      quantity: item.quantity,
    })),
    back_urls: {
      success: 'http://localhost:3000/success',   // URL de éxito
      failure: 'http://localhost:3000/failure',   // URL de fracaso
      pending: 'http://localhost:3000/pending',   // URL si el pago está pendiente
    },
    auto_return: 'approved',   // Redirige automáticamente cuando el pago es aprobado
    payment_methods: {
      excluded_payment_types: [
        {
          id: "ticket" // Si no quieres aceptar pagos por ticket
        }
      ],
    },
  };

  // Crear la preferencia de pago con MercadoPago
  mercadopago.preferences.create(preference)
    .then(function (response) {
      res.json({ id: response.body.id });  // Enviar el ID de la preferencia de pago al frontend
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear la preferencia de pago' });
    });
});

// Endpoint para procesar el pago
app.post('/process_payment', (req, res) => {
  const paymentData = req.body;

  // Crear el pago
  mercadopago.payment.create(paymentData)
    .then(function (response) {
      res.json(response.body);  // Enviar la respuesta con el estado del pago
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al procesar el pago' });
    });
});

// Iniciar el servidor en el puerto 5000
app.listen(port, () => {
  console.log(`Servidor de backend corriendo en http://localhost:${port}`);
});
