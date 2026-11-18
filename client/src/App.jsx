import { Route, Routes } from 'react-router-dom';
import StorefrontLayout from './layouts/StorefrontLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import HomePage from './pages/storefront/HomePage.jsx';
import CatalogPage from './pages/storefront/CatalogPage.jsx';
import ProductDetailPage from './pages/storefront/ProductDetailPage.jsx';
import ProfilePage from './pages/storefront/ProfilePage.jsx';
import NotFoundPage from './pages/storefront/NotFoundPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Storefront routes */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/products/:idOrSlug" element={<ProductDetailPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
