-- MedRise Medical Centre — Database Performance Index Migration
-- Run this SQL in your Supabase SQL Editor to add missing FK indexes.
-- Go to: Supabase Dashboard → SQL Editor → Paste and Run

-- ── Vital Signs ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS vital_signs_patient_id_idx      ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS vital_signs_consultation_id_idx ON vital_signs(consultation_id);

-- ── Lab Orders & Results ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS lab_orders_patient_id_idx       ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS lab_orders_consultation_id_idx  ON lab_orders(consultation_id);
CREATE INDEX IF NOT EXISTS lab_orders_status_idx           ON lab_orders(status);
CREATE INDEX IF NOT EXISTS lab_results_lab_order_id_idx    ON lab_results(lab_order_id);

-- ── Consultations ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS consultations_patient_id_idx    ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS consultations_staff_id_idx      ON consultations(staff_id);
CREATE INDEX IF NOT EXISTS consultations_created_at_idx    ON consultations(created_at);

-- ── Audit Logs ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx         ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx       ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx           ON audit_logs(entity_type, entity_id);

-- ── Admissions ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS admissions_patient_id_idx       ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS admissions_status_idx           ON admissions(status);
CREATE INDEX IF NOT EXISTS admissions_ward_idx             ON admissions(ward);

-- ── Ward Round Notes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ward_round_notes_admission_id_idx ON ward_round_notes(admission_id);
CREATE INDEX IF NOT EXISTS ward_round_notes_patient_id_idx   ON ward_round_notes(patient_id);

-- ── Nursing Notes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS nursing_notes_admission_id_idx  ON nursing_notes(admission_id);
CREATE INDEX IF NOT EXISTS nursing_notes_patient_id_idx    ON nursing_notes(patient_id);

-- ── Inpatient Drug Chart ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS inpatient_drug_chart_admission_id_idx ON inpatient_drug_chart(admission_id);
CREATE INDEX IF NOT EXISTS inpatient_drug_chart_patient_id_idx   ON inpatient_drug_chart(patient_id);
CREATE INDEX IF NOT EXISTS inpatient_drug_chart_status_idx       ON inpatient_drug_chart(status);
