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
      admin_preferences: {
        Row: {
          accent_color: string
          dark_mode: boolean
          glass_enabled: boolean
          glass_intensity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          dark_mode?: boolean
          glass_enabled?: boolean
          glass_intensity?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          dark_mode?: boolean
          glass_enabled?: boolean
          glass_intensity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          sort: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          sort?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          sort?: number
          updated_at?: string
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          customer_address: string | null
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
          customer_address?: string | null
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
          customer_address?: string | null
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
      page_visits: {
        Row: {
          created_at: string
          device: string | null
          id: string
          path: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device?: string | null
          id?: string
          path: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
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
          name_data: string | null
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
          brand?: string | null
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
          name_data?: string | null
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
          brand?: string | null
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
          name_data?: string | null
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
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_blocked: boolean
          is_verified: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_blocked?: boolean
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          author_id: string | null
          body_ar: string | null
          body_en: string | null
          client: string | null
          completed_at: string | null
          cover_url: string | null
          created_at: string
          gallery: string[]
          id: string
          is_published: boolean
          location: string | null
          slug: string
          sort: number
          summary_ar: string | null
          summary_en: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          client?: string | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          gallery?: string[]
          id?: string
          is_published?: boolean
          location?: string | null
          slug: string
          sort?: number
          summary_ar?: string | null
          summary_en?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          client?: string | null
          completed_at?: string | null
          cover_url?: string | null
          created_at?: string
          gallery?: string[]
          id?: string
          is_published?: boolean
          location?: string | null
          slug?: string
          sort?: number
          summary_ar?: string | null
          summary_en?: string | null
          title_ar?: string
          title_en?: string
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
          attachments: string[]
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
          attachments?: string[]
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
          attachments?: string[]
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
      sales_permissions: {
        Row: {
          can_manage_blog: boolean
          can_manage_brands: boolean
          can_manage_categories: boolean
          can_manage_orders: boolean
          can_manage_products: boolean
          can_manage_projects: boolean
          can_manage_quotes: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          can_manage_blog?: boolean
          can_manage_brands?: boolean
          can_manage_categories?: boolean
          can_manage_orders?: boolean
          can_manage_products?: boolean
          can_manage_projects?: boolean
          can_manage_quotes?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          can_manage_blog?: boolean
          can_manage_brands?: boolean
          can_manage_categories?: boolean
          can_manage_orders?: boolean
          can_manage_products?: boolean
          can_manage_projects?: boolean
          can_manage_quotes?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content_ar: string
          content_en: string
          cover_url: string | null
          id: string
          key: string
          title_ar: string
          title_en: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_ar?: string
          content_en?: string
          cover_url?: string | null
          id?: string
          key: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_ar?: string
          content_en?: string
          cover_url?: string | null
          id?: string
          key?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
          name_data: string | null
          name_en: string | null
          price_dealer_iqd: number | null
          price_iqd: number | null
          price_wholesale_iqd: number | null
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
          name_data?: string | null
          name_en?: string | null
          price_dealer_iqd?: never
          price_iqd?: number | null
          price_wholesale_iqd?: never
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
          name_data?: string | null
          name_en?: string | null
          price_dealer_iqd?: never
          price_iqd?: number | null
          price_wholesale_iqd?: never
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: { Args: { _user_id: string }; Returns: undefined }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_verified: boolean
          phone: string
          quote_count: number
          roles: string[]
          sales_perms: Json
        }[]
      }
      admin_restore_table: {
        Args: { _rows: Json; _table: string; _truncate?: boolean }
        Returns: number
      }
      admin_set_blocked: {
        Args: { _blocked: boolean; _user_id: string }
        Returns: undefined
      }
      admin_set_pricing_role: {
        Args: { _role: string; _user_id: string }
        Returns: undefined
      }
      admin_set_sales_permissions: {
        Args: {
          _can_manage_blog?: boolean
          _can_manage_brands?: boolean
          _can_manage_categories?: boolean
          _can_manage_orders?: boolean
          _can_manage_products?: boolean
          _can_manage_projects?: boolean
          _can_manage_quotes?: boolean
          _is_sales: boolean
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_verified: {
        Args: { _user_id: string; _verified: boolean }
        Returns: undefined
      }
      bulk_upsert_products_by_name_data: {
        Args: { items: Json }
        Returns: {
          inserted_count: number
          updated_count: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_blog_like_count: { Args: { _post_id: string }; Returns: number }
      get_my_sales_permissions: {
        Args: never
        Returns: {
          can_manage_blog: boolean
          can_manage_brands: boolean
          can_manage_categories: boolean
          can_manage_orders: boolean
          can_manage_products: boolean
          can_manage_projects: boolean
          can_manage_quotes: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "sales_permissions"
          isOneToOne: true
          isSetofReturn: false
        }
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
      has_sales_perm: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      import_products_apply: { Args: { p_items: Json }; Returns: Json }
      is_current_user_blocked: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "wholesale" | "dealer" | "sales"
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
      app_role: ["admin", "customer", "wholesale", "dealer", "sales"],
    },
  },
} as const
