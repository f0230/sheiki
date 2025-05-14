// src/main.jsx
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';




// Lazy load para mejor rendimiento
const Home = lazy(() => import('./pages/Home.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const Checkout = lazy(() => import('./pages/Chekout.jsx'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Suspense fallback={<div className="text-center py-20">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/producto" element={<ProductPage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/pago" element={<Checkout/>} />

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
