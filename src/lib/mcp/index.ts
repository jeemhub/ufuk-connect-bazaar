import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCatalogTaxonomy from "./tools/list-catalog-taxonomy";
import listMyOrders from "./tools/list-my-orders";
import getOrder from "./tools/get-order";
import createQuoteRequest from "./tools/create-quote-request";
import listContent from "./tools/list-content";
import listAllProducts from "./tools/list-all-products";
import createProduct from "./tools/create-product";
import updateProduct from "./tools/update-product";
import setProductActive from "./tools/set-product-active";
import updateProductStock from "./tools/update-product-stock";
import deleteProduct from "./tools/delete-product";
import setProductDatasheet from "./tools/set-product-datasheet";
import createCategory from "./tools/create-category";
import updateCategory from "./tools/update-category";
import createSubcategory from "./tools/create-subcategory";
import updateSubcategory from "./tools/update-subcategory";
import createBrand from "./tools/create-brand";
import updateBrand from "./tools/update-brand";
import updateOrderStatus from "./tools/update-order-status";
import updateQuoteRequestStatus from "./tools/update-quote-request-status";
import createBlogPost from "./tools/create-blog-post";
import updateBlogPost from "./tools/update-blog-post";
import createProject from "./tools/create-project";
import updateProject from "./tools/update-project";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ufuk-al-basra",
  title: "UFUK AL-Basra",
  version: "0.3.0",
  instructions:
    "Tools for the UFUK AL-Basra store. Use `search_products` and `get_product` for the catalog, `list_catalog_taxonomy` for categories and brands, `list_my_orders` and `get_order` for the signed-in user's orders, `create_quote_request` to ask sales for a price, and `list_content` for blog posts and projects. All data access runs as the signed-in user. " +
    "Admin-only tools (they fail with \"Admin role required\" otherwise): `list_all_products` (includes hidden products); product writes `create_product`, `update_product`, `set_product_active`, `update_product_stock`, `set_product_datasheet` (attach/remove the PDF datasheet), `delete_product`; catalog writes `create_category`, `update_category`, `create_subcategory`, `update_subcategory`, `create_brand`, `update_brand`; `update_order_status`, `update_quote_request_status`; content writes `create_blog_post`, `update_blog_post`, `create_project`, `update_project`. Prefer hiding a product with `set_product_active` over deleting it.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchProducts,
    getProduct,
    listCatalogTaxonomy,
    listMyOrders,
    getOrder,
    createQuoteRequest,
    listContent,
    listAllProducts,
    createProduct,
    updateProduct,
    setProductActive,
    updateProductStock,
    deleteProduct,
    setProductDatasheet,
    createCategory,
    updateCategory,
    createSubcategory,
    updateSubcategory,
    createBrand,
    updateBrand,
    updateOrderStatus,
    updateQuoteRequestStatus,
    createBlogPost,
    updateBlogPost,
    createProject,
    updateProject,
  ],
});
