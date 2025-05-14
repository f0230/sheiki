import express from 'express';
import cors from 'cors';
import { mercadopago } from 'mercadopago';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Configura Mercado Pago
mercadopago.configurations.setAccessToken('TEST-3163063679169777-051318-9609ee83ed38775754d91789d583ea1f-732478849'); // Reemplaza con tu token

// Endpoint para crear la preferencia
app.post('/api/create-preference', (req, res) => {
  const { items } = req.body;

  const preference = {
    items: items.map(item => ({
      title: item.nombre,
      unit_price: item.precio,
      quantity: item.quantity,
    })),
    back_urls: {
      success: 'http://localhost:3000/success',  // Redirige a la página de éxito de tu app
      failure: 'http://localhost:3000/failure',  // Redirige a la página de fallo de tu app
      pending: 'http://localhost:3000/pending',  // Redirige a la página de pago pendiente
    },

    auto_return: 'approved',
  };

  mercadopago.preferences.create(preference)
    .then(response => res.json({ preference: response.body }))
    .catch(error => res.status(500).json({ error: error.message }));
});

app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
});
