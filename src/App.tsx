import { lazy, Suspense } from "react";
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

// Lazy-load non-critical routes to shrink initial JS bundle and reduce main-thread work (improves FID/TBT)
const ProductsPage = lazy(() => import("./pages/site/ProductsPage"));
const ProductDetail = lazy(() => import("./pages/site/ProductDetail"));
const QuotePage = lazy(() => import("./pages/site/QuotePage"));
const BlogList = lazy(() => import("./pages/site/BlogList"));
const BlogPost = lazy(() => import("./pages/site/BlogPost"));
const AuthPage = lazy(() => import("./pages/Auth"));
const AccountPage = lazy(() => import("./pages/site/Account"));
const BrandsPage = lazy(() => import("@/pages/site/BrandsPage"));
const AboutPage = lazy(() => import("@/pages/site/About"));
const ProjectsPage = lazy(() => import("@/pages/site/ProjectsPage"));
const ProjectDetail = lazy(() => import("@/pages/site/ProjectDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const DashboardSwitch = lazy(() => import("./pages/admin/DashboardSwitch"));
const Products = lazy(() => import("./pages/admin/Products"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Users = lazy(() => import("./pages/admin/Users"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Preferences = lazy(() => import("./pages/admin/Preferences"));
const Security = lazy(() => import("./pages/admin/Security"));
const Quotes = lazy(() => import("./pages/admin/Quotes"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminBrands = lazy(() => import("./pages/admin/Brands"));
const AdminAbout = lazy(() => import("./pages/admin/About"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const AdminBackup = lazy(() => import("./pages/admin/Backup"));

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
                <Suspense fallback={null}>
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
                        <ProtectedRoute requireStaff>
                          <AdminLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardSwitch />} />
                      <Route path="products" element={<ProtectedRoute requirePerm="can_manage_products"><Products /></ProtectedRoute>} />
                      <Route path="categories" element={<ProtectedRoute requirePerm="can_manage_categories"><Categories /></ProtectedRoute>} />
                      <Route path="brands" element={<ProtectedRoute requirePerm="can_manage_brands"><AdminBrands /></ProtectedRoute>} />
                      <Route path="blog" element={<ProtectedRoute requirePerm="can_manage_blog"><AdminBlog /></ProtectedRoute>} />
                      <Route path="projects" element={<ProtectedRoute requirePerm="can_manage_projects"><AdminProjects /></ProtectedRoute>} />
                      <Route path="about" element={<ProtectedRoute requireAdmin><AdminAbout /></ProtectedRoute>} />
                      <Route path="orders" element={<ProtectedRoute requirePerm="can_manage_orders"><Orders /></ProtectedRoute>} />
                      <Route path="users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
                      <Route path="quotes" element={<ProtectedRoute requirePerm="can_manage_quotes"><Quotes /></ProtectedRoute>} />
                      <Route path="security" element={<ProtectedRoute requireAdmin><Security /></ProtectedRoute>} />
                      <Route path="backup" element={<ProtectedRoute requireAdmin><AdminBackup /></ProtectedRoute>} />
                      <Route path="settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppShell>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
