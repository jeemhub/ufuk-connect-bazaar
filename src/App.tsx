import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { CartProvider } from "@/cart/CartContext";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AppShell } from "@/components/site/AppShell";

import SiteLayout from "@/components/site/SiteLayout";
import Home from "./pages/site/Home";
import ProductsPage from "./pages/site/ProductsPage";
import ProductDetail from "./pages/site/ProductDetail";
import QuotePage from "./pages/site/QuotePage";
import BlogList from "./pages/site/BlogList";
import BlogPost from "./pages/site/BlogPost";
import AuthPage from "./pages/Auth";
import AccountPage from "./pages/site/Account";
import BrandsPage from "@/pages/site/BrandsPage";
import AboutPage from "@/pages/site/About";
import ProjectsPage from "@/pages/site/ProjectsPage";
import ProjectDetail from "@/pages/site/ProjectDetail";
import NotFound from "./pages/NotFound";

import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";
import Security from "./pages/admin/Security";
import Quotes from "./pages/admin/Quotes";
import AdminBlog from "./pages/admin/Blog";
import AdminBrands from "./pages/admin/Brands";
import AdminAbout from "./pages/admin/About";
import AdminProjects from "./pages/admin/Projects";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <CartDrawer />
              <AppShell>
                <Routes>
                  <Route element={<SiteLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/quote" element={<QuotePage />} />
                    <Route path="/blog" element={<BlogList />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                    <Route path="/brands" element={<BrandsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:slug" element={<ProjectDetail />} />
                  </Route>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="brands" element={<AdminBrands />} />
                    <Route path="blog" element={<AdminBlog />} />
                    <Route path="projects" element={<AdminProjects />} />
                    <Route path="about" element={<AdminAbout />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="users" element={<Users />} />
                    <Route path="quotes" element={<Quotes />} />
                    <Route path="security" element={<Security />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppShell>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
