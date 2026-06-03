-- InTrackLog Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Vehicles table
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  reg_number TEXT,
  description TEXT,
  start_mileage INTEGER,
  color_index INTEGER DEFAULT 0,
  badge TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Entries table
CREATE TABLE entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL,
  reading_km INTEGER,
  trip_km INTEGER,
  expense_type TEXT,
  amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attachments table
CREATE TABLE attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uri TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Vehicles policies
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Entries policies
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT USING (vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT WITH CHECK (vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE USING (vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid()));

-- Attachments policies
CREATE POLICY "Users can view own attachments" ON attachments
  FOR SELECT USING (entry_id IN (
    SELECT e.id FROM entries e JOIN vehicles v ON e.vehicle_id = v.id WHERE v.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own attachments" ON attachments
  FOR INSERT WITH CHECK (entry_id IN (
    SELECT e.id FROM entries e JOIN vehicles v ON e.vehicle_id = v.id WHERE v.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own attachments" ON attachments
  FOR DELETE USING (entry_id IN (
    SELECT e.id FROM entries e JOIN vehicles v ON e.vehicle_id = v.id WHERE v.user_id = auth.uid()
  ));

-- Performance index
CREATE INDEX idx_entries_vehicle_id_entry_date ON entries(vehicle_id, entry_date DESC);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "Anyone can view attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'attachments');
