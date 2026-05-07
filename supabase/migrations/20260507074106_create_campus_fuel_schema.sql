/*
  # CampusFuel Schema

  1. New Tables
    - `profiles` - User profile with body info and goals
      - `id` (uuid, references auth.users)
      - `height_cm`, `weight_kg`, `age` (body metrics)
      - `activity_level` (sedentary/light/moderate/active/very_active)
      - `goal` (lose_weight/gain_muscle/maintain/focus)
      - `target_calories`, `target_protein` (daily targets)
    - `menu_items` - Cafeteria menu items
      - `id`, `menu_id`, `location`, `name`, `category`
      - `calories`, `protein_g`, `fat_g`, `carbs_g`
      - `price_yen`, `available`, `image_url`
    - `meal_logs` - Daily meal log entries
      - `id`, `user_id`, `logged_at`
      - `menu_item_id`, `quantity`
      - `ai_advice` (JSON for storing AI suggestions)

  2. Security
    - RLS enabled on all tables
    - Users can only access their own profiles and logs
    - Menu items are publicly readable
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  age integer,
  activity_level text DEFAULT 'moderate' CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  goal text DEFAULT 'maintain' CHECK (goal IN ('lose_weight','gain_muscle','maintain','focus')),
  target_calories integer DEFAULT 2000,
  target_protein integer DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id text UNIQUE NOT NULL,
  location text NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('主食','主菜','副菜','汁物','デザート','飲み物','その他')),
  calories integer NOT NULL DEFAULT 0,
  protein_g numeric(6,1) NOT NULL DEFAULT 0,
  fat_g numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g numeric(6,1) NOT NULL DEFAULT 0,
  price_yen integer DEFAULT 0,
  available boolean DEFAULT true,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menu items are publicly readable"
  ON menu_items FOR SELECT TO anon, authenticated
  USING (true);

-- Meal logs table
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  meal_type text DEFAULT 'lunch' CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  logged_at timestamptz DEFAULT now(),
  ai_advice jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_logged ON meal_logs (user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_location ON menu_items (location);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items (available);
