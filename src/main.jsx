import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './index.css';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';




// Lazy load: páginas públicas
const Home = lazy(() => import('./pages/Home.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const Checkout = lazy(() => import('./pages/Chekout.jsx')); // <- corregido si estaba mal
const SuccessPage = lazy(() => import('./pages/SuccessPage.jsx'));
const FailurePage = lazy(() => import('./pages/FailurePage.jsx'));
const PendingPage = lazy(() => import('./pages/PendingPage.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));

// Lazy load: dashboard admin
const OrdenesAdmin = lazy(() => import('./pages/admin/OrdenesAdmin.jsx'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<div className="text-white p-8">Cargando...</div>}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/producto" element={<ProductPage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/pago" element={<Checkout />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/failure" element={<FailurePage />} />
            <Route path="/pending" element={<PendingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Rutas admin protegidas */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="ordenes" element={<OrdenesAdmin />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
