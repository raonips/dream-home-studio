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
      ad_templates: {
        Row: {
          button_text: string
          created_at: string
          custom_html: string
          heading: string
          id: string
          is_active: boolean
          layout_model: string
          overlay_style: string
          subtitle: string | null
          target_category: string
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string
          created_at?: string
          custom_html?: string
          heading?: string
          id?: string
          is_active?: boolean
          layout_model?: string
          overlay_style?: string
          subtitle?: string | null
          target_category?: string
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string
          created_at?: string
          custom_html?: string
          heading?: string
          id?: string
          is_active?: boolean
          layout_model?: string
          overlay_style?: string
          subtitle?: string | null
          target_category?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      condominio_tags: {
        Row: {
          created_at: string
          descricao_seo: string | null
          icone: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string
          descricao_seo?: string | null
          icone?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string
          descricao_seo?: string | null
          icone?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      condominios: {
        Row: {
          condominio_tags: string[] | null
          created_at: string | null
          description: string | null
          featured_image: string | null
          hero_image: string | null
          id: string
          images: string[] | null
          infrastructure: string[] | null
          latitude: number | null
          location_filter: string | null
          longitude: number | null
          name: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          condominio_tags?: string[] | null
          created_at?: string | null
          description?: string | null
          featured_image?: string | null
          hero_image?: string | null
          id?: string
          images?: string[] | null
          infrastructure?: string[] | null
          latitude?: number | null
          location_filter?: string | null
          longitude?: number | null
          name?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          condominio_tags?: string[] | null
          created_at?: string | null
          description?: string | null
          featured_image?: string | null
          hero_image?: string | null
          id?: string
          images?: string[] | null
          infrastructure?: string[] | null
          latitude?: number | null
          location_filter?: string | null
          longitude?: number | null
          name?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_blocks: {
        Row: {
          created_at: string | null
          html_content: string | null
          id: string
          is_active: boolean | null
          target_p: string[] | null
          target_pages: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          target_p?: string[] | null
          target_pages?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          target_p?: string[] | null
          target_pages?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guia_categorias: {
        Row: {
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          imagem: string | null
          imagem_mobile: string | null
          nome: string
          ordem: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          imagem?: string | null
          imagem_mobile?: string | null
          nome: string
          ordem?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          imagem?: string | null
          imagem_mobile?: string | null
          nome?: string
          ordem?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      guia_posts: {
        Row: {
          autor: string | null
          categoria_id: string | null
          conteudo: string | null
          created_at: string
          id: string
          imagem_destaque: string | null
          imagem_destaque_mobile: string | null
          published_at: string | null
          resumo: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string | null
          categoria_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          imagem_destaque?: string | null
          imagem_destaque_mobile?: string | null
          published_at?: string | null
          resumo?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string | null
          categoria_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          imagem_destaque?: string | null
          imagem_destaque_mobile?: string | null
          published_at?: string | null
          resumo?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guia_posts_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "guia_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      guia_site_settings: {
        Row: {
          address: string | null
          body_scripts: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          facebook_url: string | null
          favicon_url: string | null
          google_maps_api_key: string | null
          head_scripts: string | null
          header_logo_url: string | null
          hero_bg_desktop: string | null
          hero_bg_mobile: string | null
          hero_desktop_low: string
          hero_image_url: string | null
          hero_mobile_low: string
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          map_provider: string | null
          og_image_url: string | null
          primary_color: string | null
          site_description: string | null
          site_keywords: string | null
          site_name: string | null
          site_title: string | null
          updated_at: string | null
          watermark_opacity: number | null
          watermark_position: string | null
          watermark_scale: number | null
          watermark_url: string | null
          whatsapp_number: string
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          body_scripts?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          google_maps_api_key?: string | null
          head_scripts?: string | null
          header_logo_url?: string | null
          hero_bg_desktop?: string | null
          hero_bg_mobile?: string | null
          hero_desktop_low?: string
          hero_image_url?: string | null
          hero_mobile_low?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          map_provider?: string | null
          og_image_url?: string | null
          primary_color?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_name?: string | null
          site_title?: string | null
          updated_at?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_scale?: number | null
          watermark_url?: string | null
          whatsapp_number?: string
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          body_scripts?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          google_maps_api_key?: string | null
          head_scripts?: string | null
          header_logo_url?: string | null
          hero_bg_desktop?: string | null
          hero_bg_mobile?: string | null
          hero_desktop_low?: string
          hero_image_url?: string | null
          hero_mobile_low?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          map_provider?: string | null
          og_image_url?: string | null
          primary_color?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_name?: string | null
          site_title?: string | null
          updated_at?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_scale?: number | null
          watermark_url?: string | null
          whatsapp_number?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          arquivado: boolean | null
          created_at: string | null
          email: string | null
          geladeira: boolean | null
          id: string
          intention: string | null
          is_read: boolean
          message: string | null
          name: string | null
          phone: string | null
          property_id: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          arquivado?: boolean | null
          created_at?: string | null
          email?: string | null
          geladeira?: boolean | null
          id?: string
          intention?: string | null
          is_read?: boolean
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          arquivado?: boolean | null
          created_at?: string | null
          email?: string | null
          geladeira?: boolean | null
          id?: string
          intention?: string | null
          is_read?: boolean
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      locais: {
        Row: {
          ativo: boolean
          banner_publicidade: string | null
          categoria: string
          created_at: string
          cupom_desconto: string | null
          descricao: string | null
          endereco: string | null
          google_maps_link: string | null
          horario_funcionamento: string | null
          id: string
          imagem_destaque: string | null
          imagem_destaque_mobile: string | null
          imagens: string[] | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          nome: string
          ordem: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          telefone: string | null
          updated_at: string
          url_vendas: string | null
          valor_desconto: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          banner_publicidade?: string | null
          categoria?: string
          created_at?: string
          cupom_desconto?: string | null
          descricao?: string | null
          endereco?: string | null
          google_maps_link?: string | null
          horario_funcionamento?: string | null
          id?: string
          imagem_destaque?: string | null
          imagem_destaque_mobile?: string | null
          imagens?: string[] | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nome: string
          ordem?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          telefone?: string | null
          updated_at?: string
          url_vendas?: string | null
          valor_desconto?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          banner_publicidade?: string | null
          categoria?: string
          created_at?: string
          cupom_desconto?: string | null
          descricao?: string | null
          endereco?: string | null
          google_maps_link?: string | null
          horario_funcionamento?: string | null
          id?: string
          imagem_destaque?: string | null
          imagem_destaque_mobile?: string | null
          imagens?: string[] | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nome?: string
          ordem?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          telefone?: string | null
          updated_at?: string
          url_vendas?: string | null
          valor_desconto?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      placas_qr: {
        Row: {
          created_at: string
          id: string
          id_placa: string
          imovel_vinculado_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_placa: string
          imovel_vinculado_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          id_placa?: string
          imovel_vinculado_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placas_qr_imovel_vinculado_id_fkey"
            columns: ["imovel_vinculado_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          cleaning_fee: number | null
          condominio_slug: string | null
          created_at: string | null
          daily_rate: number | null
          description: string | null
          destaque: boolean | null
          featured_image: string | null
          highlight_tag: string | null
          ical_url: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_featured: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          map_privacy: string | null
          max_guests: number | null
          parking: number | null
          partnership: string | null
          price: number | null
          price_formatted: string | null
          property_type: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          transaction_type: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cleaning_fee?: number | null
          condominio_slug?: string | null
          created_at?: string | null
          daily_rate?: number | null
          description?: string | null
          destaque?: boolean | null
          featured_image?: string | null
          highlight_tag?: string | null
          ical_url?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          map_privacy?: string | null
          max_guests?: number | null
          parking?: number | null
          partnership?: string | null
          price?: number | null
          price_formatted?: string | null
          property_type?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cleaning_fee?: number | null
          condominio_slug?: string | null
          created_at?: string | null
          daily_rate?: number | null
          description?: string | null
          destaque?: boolean | null
          featured_image?: string | null
          highlight_tag?: string | null
          ical_url?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          map_privacy?: string | null
          max_guests?: number | null
          parking?: number | null
          partnership?: string | null
          price?: number | null
          price_formatted?: string | null
          property_type?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_condominio_slug_fkey"
            columns: ["condominio_slug"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["slug"]
          },
        ]
      }
      seo_overrides: {
        Row: {
          created_at: string
          id: string
          page_path: string
          seo_description: string | null
          seo_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          body_scripts: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          facebook_url: string | null
          favicon_url: string | null
          google_maps_api_key: string | null
          head_scripts: string | null
          header_logo_url: string | null
          hero_bg_desktop: string | null
          hero_bg_mobile: string | null
          hero_desktop_low: string
          hero_image_url: string | null
          hero_mobile_low: string
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          map_provider: string | null
          og_image_url: string | null
          primary_color: string | null
          qr_logo_url: string | null
          site_description: string | null
          site_keywords: string | null
          site_name: string | null
          site_title: string | null
          updated_at: string | null
          watermark_opacity: number | null
          watermark_position: string | null
          watermark_scale: number | null
          watermark_url: string | null
          whatsapp_number: string
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          body_scripts?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          google_maps_api_key?: string | null
          head_scripts?: string | null
          header_logo_url?: string | null
          hero_bg_desktop?: string | null
          hero_bg_mobile?: string | null
          hero_desktop_low?: string
          hero_image_url?: string | null
          hero_mobile_low?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          map_provider?: string | null
          og_image_url?: string | null
          primary_color?: string | null
          qr_logo_url?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_name?: string | null
          site_title?: string | null
          updated_at?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_scale?: number | null
          watermark_url?: string | null
          whatsapp_number?: string
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          body_scripts?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          google_maps_api_key?: string | null
          head_scripts?: string | null
          header_logo_url?: string | null
          hero_bg_desktop?: string | null
          hero_bg_mobile?: string | null
          hero_desktop_low?: string
          hero_image_url?: string | null
          hero_mobile_low?: string
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          map_provider?: string | null
          og_image_url?: string | null
          primary_color?: string | null
          qr_logo_url?: string | null
          site_description?: string | null
          site_keywords?: string | null
          site_name?: string | null
          site_title?: string | null
          updated_at?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_scale?: number | null
          watermark_url?: string | null
          whatsapp_number?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          descricao_seo: string | null
          icone: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string
          descricao_seo?: string | null
          icone?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string
          descricao_seo?: string | null
          icone?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { target_role: string }; Returns: boolean }
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
