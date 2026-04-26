export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body_ar: string | null
          body_en: string | null
          cover_url: string | null
          created_at: string
          excerpt_ar: string | null
          excerpt_en: string | null
          featured_sort: number
          id: string
          is_featured: boolean
          published_at: string | null
          slug: string
          status: string
          title_ar: string
          title_en: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          featured_sort?: number
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug: string
          status?: string
          title_ar: string
          title_en: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          featured_sort?: number
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug?: string
          status?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          key: string
          name_ar: string
          name_en: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name_ar: string
          name_en: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name_ar?: string
          name_en?: string
          sort?: number
        }
        Relationships: []
      }
      login_activity: {
        Row: {
          created_at: string
          email: string | null
          event: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_iqd: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_iqd?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_iqd?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_city: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          order_no: string
          status: string
          total_iqd: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_city?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          order_no?: string
          status?: string
          total_iqd?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_city?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          order_no?: string
          status?: string
          total_iqd?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string
          category_id: string | null
          created_at: string
          datasheet_name: string | null
          datasheet_url: string | null
          desc_ar: string | null
          desc_en: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_ar: string
          name_en: string
          price_dealer_iqd: number
          price_iqd: number
          price_wholesale_iqd: number
          sku: string | null
          stock: number
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          category_id?: string | null
          created_at?: string
          datasheet_name?: string | null
          datasheet_url?: string | null
          desc_ar?: string | null
          desc_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar: string
          name_en: string
          price_dealer_iqd?: number
          price_iqd?: number
          price_wholesale_iqd?: number
          sku?: string | null
          stock?: number
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          category_id?: string | null
          created_at?: string
          datasheet_name?: string | null
          datasheet_url?: string | null
          desc_ar?: string | null
          desc_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_ar?: string
          name_en?: string
          price_dealer_iqd?: number
          price_iqd?: number
          price_wholesale_iqd?: number
          sku?: string | null
          stock?: number
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          message: string | null
          phone: string
          product_id: string | null
          product_name: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          message?: string | null
          phone: string
          product_id?: string | null
          product_name?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          product_id?: string | null
          product_name?: string | null
          status?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name_ar: string
          name_en: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      products_public: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string | null
          datasheet_name: string | null
          datasheet_url: string | null
          desc_ar: string | null
          desc_en: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          name_ar: string | null
          name_en: string | null
          price_iqd: number | null
          sku: string | null
          stock: number | null
          subcategory: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          datasheet_name?: string | null
          datasheet_url?: string | null
          desc_ar?: string | null
          desc_en?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string | null
          price_iqd?: never
          sku?: string | null
          stock?: number | null
          subcategory?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          datasheet_name?: string | null
          datasheet_url?: string | null
          desc_ar?: string | null
          desc_en?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string | null
          price_iqd?: never
          sku?: string | null
          stock?: number | null
          subcategory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          quote_count: number
          roles: string[]
        }[]
      }
      admin_set_pricing_role: {
        Args: { _role: string; _user_id: string }
        Returns: undefined
      }
      get_visible_price: {
        Args: {
          _dealer: number
          _retail: number
          _user_id: string
          _wholesale: number
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "wholesale" | "dealer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "wholesale", "dealer"],
    },
  },
} as const
