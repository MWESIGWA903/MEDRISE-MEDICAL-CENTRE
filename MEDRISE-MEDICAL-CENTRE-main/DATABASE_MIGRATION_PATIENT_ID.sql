-- Database Migration: Add Patient ID Field
-- Date: June 16, 2026
-- Purpose: Add professional Patient ID generation to patients table

-- Add patient_id column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS patient_id TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT IF NOT EXISTS patients_patient_id_key UNIQUE (patient_id);

-- Generate Patient IDs for existing patients
UPDATE patients 
SET patient_id = 'MED-2024-' || LPAD(id::TEXT, 3, '0')
WHERE patient_id = '' OR patient_id IS NULL;

-- Set patient_id to NOT NULL after populating existing records
ALTER TABLE patients 
ALTER COLUMN patient_id SET NOT NULL;

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
