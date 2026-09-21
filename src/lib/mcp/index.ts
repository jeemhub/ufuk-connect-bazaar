import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCatalogTaxonomy from "./tools/list-catalog-taxonomy";
import listMyOrders from "./tools/list-my-orders";
import getOrder from "./tools/get-order";
import createQuoteRequest from "./tools/create-quote-request";
import listContent from "./tools/list-content";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ufuk-al-basra",
  title: "UFUK AL-Basra",
  version: "0.1.0",
  instructions:
    "Tools for the UFUK AL-Basra store. Use `search_products` and `get_product` for the catalog, `list_catalog_taxonomy` for categories and brands, `list_my_orders` and `get_order` for the signed-in user's orders, `create_quote_request` to ask sales for a price, and `list_content` for blog posts and projects. All data access runs as the signed-in user.",
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
  ],
});
