import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';
import './index.css';

import ScrollToTop from './components/ScrollToTop';
import LoadingFallback from './components/ui/LoadingFallback'; // 👈 import del nuevo loader

initMercadoPago('APP_USR-e255a7a3-c855-4cac-8ef9-b51094d2701b', {
  locale: 'es-UY', // 👈 esto es lo que forzará todo al español
});

// Lazy load para mejor rendimiento
const Home = lazy(() => import('./pages/Home.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const Checkout = lazy(() => import('./pages/Chekout.jsx'));
const SuccessPage = lazy(() => import('./pages/SuccessPage.jsx'));
const FailurePage = lazy(() => import('./pages/FailurePage.jsx'));
const PendingPage = lazy(() => import('./pages/PendingPage.jsx'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback type="spinner" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/producto" element={<ProductPage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/pago" element={<Checkout />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/failure" element={<FailurePage />} />
            <Route path="/pending" element={<PendingPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
