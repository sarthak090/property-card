export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          featured_image: string | null
          id: string
          meta_description: string
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          featured_image?: string | null
          id?: string
          meta_description: string
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          avgPrice: number
          avgPricePerSqft: number
          avgRent: number
          bedrooms: number
          created_at: string | null
          days: number
          estYield: number
          guidePrice: number
          id: string
          offerReceived: number | null
          postcode: string
          sstc: boolean
          town: string
          type: string
          url: string
        }
        Insert: {
          address: string
          avgPrice: number
          avgPricePerSqft: number
          avgRent: number
          bedrooms: number
          created_at?: string | null
          days: number
          estYield: number
          guidePrice: number
          id?: string
          offerReceived?: number | null
          postcode: string
          sstc?: boolean
          town: string
          type: string
          url: string
        }
        Update: {
          address?: string
          avgPrice?: number
          avgPricePerSqft?: number
          avgRent?: number
          bedrooms?: number
          created_at?: string | null
          days?: number
          estYield?: number
          guidePrice?: number
          id?: string
          offerReceived?: number | null
          postcode?: string
          sstc?: boolean
          town?: string
          type?: string
          url?: string
        }
        Relationships: []
      }
      properties_manual: {
        Row: {
          Address: string
          "Avg £/sqft": number | null
          "Avg price": number | null
          "Avg rent (pm)": number | null
          Bedrooms: number | null
          Days: number | null
          "Est yield": number | null
          "Guide price": number | null
          "Offer rec'd": string | null
          Postcode: string | null
          SSTC: string | null
          Town: string | null
          Type: string | null
          URL: string | null
        }
        Insert: {
          Address: string
          "Avg £/sqft"?: number | null
          "Avg price"?: number | null
          "Avg rent (pm)"?: number | null
          Bedrooms?: number | null
          Days?: number | null
          "Est yield"?: number | null
          "Guide price"?: number | null
          "Offer rec'd"?: string | null
          Postcode?: string | null
          SSTC?: string | null
          Town?: string | null
          Type?: string | null
          URL?: string | null
        }
        Update: {
          Address?: string
          "Avg £/sqft"?: number | null
          "Avg price"?: number | null
          "Avg rent (pm)"?: number | null
          Bedrooms?: number | null
          Days?: number | null
          "Est yield"?: number | null
          "Guide price"?: number | null
          "Offer rec'd"?: string | null
          Postcode?: string | null
          SSTC?: string | null
          Town?: string | null
          Type?: string | null
          URL?: string | null
        }
        Relationships: []
      }
      propertiesadd: {
        Row: {
          actualurl: string | null
          Address: string | null
          "Avg £/sqft": number | null
          "Avg price": number | null
          "Avg rent (pm)": number | null
          Bedrooms: number | null
          created_at: string | null
          Days: number | null
          "Est yield": number | null
          "Guide price": number | null
          image_url: string
          imageurl: string | null
          listing_images: string[]
          listing_main_image: string | null
          "Offer rec'd": number | null
          Postcode: string | null
          SSTC: number | null
          Town: string | null
          Type: string | null
          URL: string | null
        }
        Insert: {
          actualurl?: string | null
          Address?: string | null
          "Avg £/sqft"?: number | null
          "Avg price"?: number | null
          "Avg rent (pm)"?: number | null
          Bedrooms?: number | null
          created_at?: string | null
          Days?: number | null
          "Est yield"?: number | null
          "Guide price"?: number | null
          image_url: string
          imageurl?: string | null
          listing_images?: string[]
          listing_main_image?: string | null
          "Offer rec'd"?: number | null
          Postcode?: string | null
          SSTC?: number | null
          Town?: string | null
          Type?: string | null
          URL?: string | null
        }
        Update: {
          actualurl?: string | null
          Address?: string | null
          "Avg £/sqft"?: number | null
          "Avg price"?: number | null
          "Avg rent (pm)"?: number | null
          Bedrooms?: number | null
          created_at?: string | null
          Days?: number | null
          "Est yield"?: number | null
          "Guide price"?: number | null
          image_url?: string
          imageurl?: string | null
          listing_images?: string[]
          listing_main_image?: string | null
          "Offer rec'd"?: number | null
          Postcode?: string | null
          SSTC?: number | null
          Town?: string | null
          Type?: string | null
          URL?: string | null
        }
        Relationships: []
      }
      propertieslist: {
        Row: {
          actualurl: string | null
          Address: string | null
          "Avg £/sqft": number | null
          "Avg price": number | null
          "Avg rent (pm)": number | null
          Bedrooms: number | null
          created_at: string | null
          Days: number | null
          "Est yield": number | null
          "Guide price": number | null
          image_url: string | null
          imageurl: string | null
          listing_images: Json | null
          listing_main_image: string | null
          "Offer rec'd": number | null
          Postcode: string | null
          SSTC: string | null
          Town: string | null
          Type: string | null
          URL: string | null
        }
        Insert: {
          actualurl?: string | null
          Address?: string | null
          "Avg £/sqft"?: number | null
          "Avg price"?: number | null
          "Avg rent (pm)"?: number | null
          Bedrooms?: number | null
          created_at?: string | null
          Days?: number | null
          "Est yield"?: number | null
          "Guide price"?: number | null
          image_url?: string | null
          imageurl?: string | null
          listing_images?: Json | null
          listing_main_image?: string | null
          "Offer rec'd"?: number | null
          Postcode?: string | null
          SSTC?: string | null
          Town?: string | null
          Type?: string | null
          URL?: string | null
        }
        Update: {
          actualurl?: string | null
          Address?: string | null
          "Avg £/sqft"?: number | null
          "Avg price"?: number | null
          "Avg rent (pm)"?: number | null
          Bedrooms?: number | null
          created_at?: string | null
          Days?: number | null
          "Est yield"?: number | null
          "Guide price"?: number | null
          image_url?: string | null
          imageurl?: string | null
          listing_images?: Json | null
          listing_main_image?: string | null
          "Offer rec'd"?: number | null
          Postcode?: string | null
          SSTC?: string | null
          Town?: string | null
          Type?: string | null
          URL?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_column_exists: {
        Args: {
          table_name: string
          column_name: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
