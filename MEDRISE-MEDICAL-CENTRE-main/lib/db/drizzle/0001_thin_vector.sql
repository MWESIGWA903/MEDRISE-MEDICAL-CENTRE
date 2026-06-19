CREATE TABLE "pharmacy_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"consultation_id" integer,
	"drug_name" text NOT NULL,
	"dose" text NOT NULL,
	"frequency" text NOT NULL,
	"duration" text NOT NULL,
	"instructions" text NOT NULL,
	"prescribed_by" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'routine' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "assigned_staff_id" integer;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "assigned_doctor_name" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "checkin_time" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "age_weeks" integer;--> statement-breakpoint
ALTER TABLE "patient_queue" ADD COLUMN "triage_nursing_notes" text;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "presenting_complaints" text;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "brief_medical_history" text;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "emergency_investigations_requested" text;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "investigation_results" text;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "laboratory_results_upload" text;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "imaging_results_upload" text;--> statement-breakpoint
ALTER TABLE "growth_records" ADD COLUMN "age_weeks" integer;--> statement-breakpoint
ALTER TABLE "pharmacy_orders" ADD CONSTRAINT "pharmacy_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_orders" ADD CONSTRAINT "pharmacy_orders_prescribed_by_admins_id_fk" FOREIGN KEY ("prescribed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pharmacy_orders_patient_id_idx" ON "pharmacy_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "pharmacy_orders_status_idx" ON "pharmacy_orders" USING btree ("status");--> statement-breakpoint
ALTER TABLE "pharmacy_dispensings" ADD CONSTRAINT "pharmacy_dispensings_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_dispensings" ADD CONSTRAINT "pharmacy_dispensings_dispensed_by_admins_id_fk" FOREIGN KEY ("dispensed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consultations_patient_id_idx" ON "consultations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "consultations_staff_id_idx" ON "consultations" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "consultations_created_at_idx" ON "consultations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vital_signs_patient_id_idx" ON "vital_signs" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "vital_signs_consultation_id_idx" ON "vital_signs" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "lab_orders_patient_id_idx" ON "lab_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "lab_orders_consultation_id_idx" ON "lab_orders" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "lab_orders_status_idx" ON "lab_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lab_results_lab_order_id_idx" ON "lab_results" USING btree ("lab_order_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "admissions_patient_id_idx" ON "admissions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "admissions_status_idx" ON "admissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admissions_ward_idx" ON "admissions" USING btree ("ward");--> statement-breakpoint
CREATE INDEX "ward_round_notes_admission_id_idx" ON "ward_round_notes" USING btree ("admission_id");--> statement-breakpoint
CREATE INDEX "ward_round_notes_patient_id_idx" ON "ward_round_notes" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "inpatient_drug_chart_admission_id_idx" ON "inpatient_drug_chart" USING btree ("admission_id");--> statement-breakpoint
CREATE INDEX "inpatient_drug_chart_patient_id_idx" ON "inpatient_drug_chart" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "inpatient_drug_chart_status_idx" ON "inpatient_drug_chart" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nursing_notes_admission_id_idx" ON "nursing_notes" USING btree ("admission_id");--> statement-breakpoint
CREATE INDEX "nursing_notes_patient_id_idx" ON "nursing_notes" USING btree ("patient_id");