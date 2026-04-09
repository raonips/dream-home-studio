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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      condominio_tags: {
        Row: {
          created_at: string
          descricao_seo: string
          icone: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string
          descricao_seo?: string
          icone?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string
          descricao_seo?: string
          icone?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      condominios: {
        Row: {
          condominio_tags: string[]
          created_at: string
          description: string
          featured_image: string
          hero_image: string
          id: string
          images: string[]
          infrastructure: string[] | null
          latitude: number | null
          location_filter: string
          longitude: number | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          thumbnail_url: string
          updated_at: string
        }
        Insert: {
          condominio_tags?: string[]
          created_at?: string
          description?: string
          featured_image?: string
          hero_image?: string
          id?: string
          images?: string[]
          infrastructure?: string[] | null
          latitude?: number | null
          location_filter?: string
          longitude?: number | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          thumbnail_url?: string
          updated_at?: string
        }
        Update: {
          condominio_tags?: string[]
          created_at?: string
          description?: string
          featured_image?: string
          hero_image?: string
          id?: string
          images?: string[]
          infrastructure?: string[] | null
          latitude?: number | null
          location_filter?: string
          longitude?: number | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          thumbnail_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_blocks: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          target_pages: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          target_pages?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          target_pages?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          arquivado: boolean
          condominio_id: string | null
          created_at: string
          email: string | null
          geladeira: boolean
          id: string
          intention: string | null
          is_read: boolean
          message: string | null
          name: string
          phone: string | null
          property_id: string | null
          source: string | null
          status: string
        }
        Insert: {
          arquivado?: boolean
          condominio_id?: string | null
          created_at?: string
          email?: string | null
          geladeira?: boolean
          id?: string
          intention?: string | null
          is_read?: boolean
          message?: string | null
          name: string
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          arquivado?: boolean
          condominio_id?: string | null
          created_at?: string
          email?: string | null
          geladeira?: boolean
          id?: string
          intention?: string | null
          is_read?: boolean
          message?: string | null
          name?: string
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          area: number
          bathrooms: number
          bedrooms: number
          cleaning_fee: number
          condominio_slug: string | null
          created_at: string
          daily_rate: number
          description: string
          featured_image: string
          highlight_tag: string
          ical_url: string
          id: string
          image_url: string
          images: string[] | null
          is_featured: boolean
          latitude: number | null
          location: string
          longitude: number | null
          map_privacy: string
          max_guests: number
          parking: number
          partnership: string
          price: number
          price_formatted: string
          property_type: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          thumbnail_url: string
          title: string
          transaction_type: string
          updated_at: string
          video_url: string
        }
        Insert: {
          area?: number
          bathrooms?: number
          bedrooms?: number
          cleaning_fee?: number
          condominio_slug?: string | null
          created_at?: string
          daily_rate?: number
          description?: string
          featured_image?: string
          highlight_tag?: string
          ical_url?: string
          id?: string
          image_url?: string
          images?: string[] | null
          is_featured?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_privacy?: string
          max_guests?: number
          parking?: number
          partnership?: string
          price?: number
          price_formatted?: string
          property_type?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string
          title: string
          transaction_type?: string
          updated_at?: string
          video_url?: string
        }
        Update: {
          area?: number
          bathrooms?: number
          bedrooms?: number
          cleaning_fee?: number
          condominio_slug?: string | null
          created_at?: string
          daily_rate?: number
          description?: string
          featured_image?: string
          highlight_tag?: string
          ical_url?: string
          id?: string
          image_url?: string
          images?: string[] | null
          is_featured?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_privacy?: string
          max_guests?: number
          parking?: number
          partnership?: string
          price?: number
          price_formatted?: string
          property_type?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string
          title?: string
          transaction_type?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          body_scripts: string
          created_at: string
          favicon_url: string
          google_maps_api_key: string
          head_scripts: string
          hero_bg_desktop: string
          hero_bg_mobile: string
          hero_image_url: string
          hero_subtitle: string
          hero_title: string
          id: string
          instagram_url: string
          logo_url: string
          map_provider: string
          og_image_url: string
          site_description: string
          site_keywords: string
          site_title: string
          updated_at: string
          watermark_opacity: number
          watermark_position: string
          watermark_scale: number
          watermark_url: string
          whatsapp_number: string
        }
        Insert: {
          body_scripts?: string
          created_at?: string
          favicon_url?: string
          google_maps_api_key?: string
          head_scripts?: string
          hero_bg_desktop?: string
          hero_bg_mobile?: string
          hero_image_url?: string
          hero_subtitle?: string
          hero_title?: string
          id?: string
          instagram_url?: string
          logo_url?: string
          map_provider?: string
          og_image_url?: string
          site_description?: string
          site_keywords?: string
          site_title?: string
          updated_at?: string
          watermark_opacity?: number
          watermark_position?: string
          watermark_scale?: number
          watermark_url?: string
          whatsapp_number?: string
        }
        Update: {
          body_scripts?: string
          created_at?: string
          favicon_url?: string
          google_maps_api_key?: string
          head_scripts?: string
          hero_bg_desktop?: string
          hero_bg_mobile?: string
          hero_image_url?: string
          hero_subtitle?: string
          hero_title?: string
          id?: string
          instagram_url?: string
          logo_url?: string
          map_provider?: string
          og_image_url?: string
          site_description?: string
          site_keywords?: string
          site_title?: string
          updated_at?: string
          watermark_opacity?: number
          watermark_position?: string
          watermark_scale?: number
          watermark_url?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          descricao_seo: string
          icone: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string
          descricao_seo?: string
          icone?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string
          descricao_seo?: string
          icone?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
