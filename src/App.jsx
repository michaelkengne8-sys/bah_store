import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { StoreProvider } from "./context/StoreContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnnouncementBar from "./components/AnnouncementBar";
import Toaster from "./components/Toaster";
import Modal from "./components/Modal";
import QuickViewModal from "./components/QuickViewModal";
import CompareDrawer from "./components/CompareDrawer";
import ChatWidget from "./components/ChatWidget";
import AgeVerification from "./components/AgeVerification";
import MobileBottomNav from "./components/MobileBottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import AdminLayout from "./components/AdminLayout.tsx";

// Route-level code splitting: each page loads in its own chunk on demand.
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Cashouts = lazy(() => import("./pages/Cashouts"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminProducts = lazy(() => import("./pages/AdminProducts.tsx"));
const AdminProductForm = lazy(() => import("./pages/AdminProductForm.tsx"));
const AdminCategories = lazy(() => import("./pages/AdminCategories.tsx"));
const AdminActivity = lazy(() => import("./pages/AdminActivity.tsx"));
const AdminSEO = lazy(() => import("./pages/AdminSEO.tsx"));
const AdminOrders = lazy(() => import("./pages/AdminOrders.tsx"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers.tsx"));
const AdminSettings = lazy(() => import("./pages/AdminSettings.tsx"));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-[60vh]"
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/account/orders" element={<MyOrders />} />
              <Route path="/account/orders/:id" element={<OrderDetail />} />
              <Route path="/account/cashouts" element={<Cashouts />} />
              <Route path="/account/*" element={<Account />} />
            </Route>

            {/* Admin routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/new" element={<AdminProductForm />} />
              <Route path="/admin/products/:id" element={<AdminProductForm />} />
              <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/categories/new" element={<AdminCategories />} />
              <Route path="/admin/activity" element={<AdminActivity />} />
              <Route path="/admin/seo" element={<AdminSEO />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <ErrorBoundary>
            <div className="flex min-h-screen flex-col">
              <AgeVerification />
              <AnnouncementBar />
              <Navbar />
              <AnimatedRoutes />
              <Footer />
              <MobileBottomNav />
            </div>
          </ErrorBoundary>
          <Toaster />
          <Modal size="lg">
            <QuickViewModal />
          </Modal>
          <CompareDrawer />
          <ChatWidget />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
