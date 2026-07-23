export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_weight' | 'gain_muscle' | 'maintain' | 'focus';
export type Category = '主食' | '主菜' | '副菜' | '汁物' | 'デザート' | '飲み物' | 'その他';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  id: string;
  full_name: string;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  activity_level: ActivityLevel;
  goal: Goal;
  target_calories: number;
  target_protein: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  location: string;
  name: string;
  category: Category;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  price_yen: number;
  available: boolean;
  image_url: string;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  menu_item_id: string;
  quantity: number;
  meal_type: MealType;
  logged_at: string;
  ai_advice: AiAdvice | null;
  created_at: string;
  menu_items?: MenuItem;
}

export interface AiAdvice {
  score: number;
  summary: string;
  goal_match: string;
  suggestions: string[];
  nutrients: {
    totalCalories: number;
    totalProtein: number;
    totalFat: number;
    totalCarbs: number;
  };
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Omit<MenuItem, 'id' | 'created_at'>;
        Update: Partial<MenuItem>;
      };
      meal_logs: {
        Row: MealLog;
        Insert: Omit<MealLog, 'id' | 'created_at' | 'menu_items'>;
        Update: Partial<MealLog>;
      };
    };
  };
};
