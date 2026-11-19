import { Route, Routes } from 'react-router-dom';
import StorefrontLayout from './layouts/StorefrontLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import HomePage from './pages/storefront/HomePage.jsx';
import CatalogPage from './pages/storefront/CatalogPage.jsx';
import ProductDetailPage from './pages/storefront/ProductDetailPage.jsx';
import ProfilePage from './pages/storefront/ProfilePage.jsx';
import CartPage from './pages/storefront/CartPage.jsx';
import CheckoutPage from './pages/storefront/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/storefront/OrderConfirmationPage.jsx';
import OrdersPage from './pages/storefront/OrdersPage.jsx';
import OrderDetailPage from './pages/storefront/OrderDetailPage.jsx';
import NotFoundPage from './pages/storefront/NotFoundPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Storefront routes */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/products/:idOrSlug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id/confirmation"
          element={
            <ProtectedRoute>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />
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

      {/* Admin routes (Role-Based Protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
      </Route>
    </Routes>
  );
}
