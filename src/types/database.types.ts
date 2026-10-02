export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      faculties: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          faculty_id: string;
          name: string;
          code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          faculty_id: string;
          name: string;
          code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          faculty_id?: string;
          name?: string;
          code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          other_name: string | null;
          phone_number: string;
          registration_number: string;
          faculty_id: string;
          department_id: string;
          admission_type: Database["public"]["Enums"]["admission_type"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          other_name?: string | null;
          phone_number: string;
          registration_number: string;
          faculty_id: string;
          department_id: string;
          admission_type: Database["public"]["Enums"]["admission_type"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          other_name?: string | null;
          phone_number?: string;
          registration_number?: string;
          faculty_id?: string;
          department_id?: string;
          admission_type?: Database["public"]["Enums"]["admission_type"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_profiles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["admin_role"];
          faculty_id: string | null;
          has_changed_password: boolean;
          temporary_password_issued_at: string | null;
          temporary_password_reset_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["admin_role"];
          faculty_id?: string | null;
          has_changed_password?: boolean;
          temporary_password_issued_at?: string | null;
          temporary_password_reset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          faculty_id?: string | null;
          has_changed_password?: boolean;
          temporary_password_issued_at?: string | null;
          temporary_password_reset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_profiles_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_rate_limit: {
        Args: {
          p_key: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          retry_after_seconds: number;
        }[];
      };
    };
    Enums: {
      admission_type: "JAMBITE" | "DIRECT_ENTRY";
      admin_role: "SUPER_ADMIN" | "FACULTY_ADMIN";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
