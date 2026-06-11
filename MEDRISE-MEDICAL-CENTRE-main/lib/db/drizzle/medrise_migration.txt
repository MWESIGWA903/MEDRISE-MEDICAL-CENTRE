CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"age" integer,
	"sex" text,
	"service" text NOT NULL,
	"preferred_date" text NOT NULL,
	"preferred_time" text NOT NULL,
	"preferred_doctor" text,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"title" text,
	"phone" text,
	"email" text,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"department" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"date_of_birth" text,
	"age" integer,
	"age_months" integer,
	"age_days" integer,
	"gender" text,
	"department" text,
	"address" text,
	"blood_type" text,
	"allergies" text,
	"medical_notes" text,
	"next_of_kin_name" text,
	"next_of_kin_phone" text,
	"next_of_kin_relationship" text,
	"insurance_name" text,
	"insurance_policy_number" text,
	"payment_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"date" date NOT NULL,
	"shift" text DEFAULT 'day' NOT NULL,
	"status" text NOT NULL,
	"check_in" text,
	"check_out" text,
	"notes" text,
	"recorded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"staff_id" integer,
	"visit_date" text NOT NULL,
	"chief_complaint" text,
	"diagnosis" text,
	"treatment_plan" text,
	"prescriptions" text,
	"referral" text,
	"follow_up_date" text,
	"follow_up_status" text DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vital_signs" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"consultation_id" integer,
	"blood_pressure" text,
	"temperature" text,
	"pulse" text,
	"weight" text,
	"height" text,
	"oxygen_saturation" text,
	"respiratory_rate" text,
	"recorded_by" integer,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"consultation_id" integer,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "pharmacy_dispensings" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"patient_id" integer,
	"consultation_id" integer,
	"quantity" integer NOT NULL,
	"dispensed_by" integer,
	"dispensed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "pharmacy_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"drug_name" text NOT NULL,
	"generic_name" text,
	"category" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'units' NOT NULL,
	"reorder_level" integer DEFAULT 10 NOT NULL,
	"expiry_date" text,
	"buying_price" numeric(12, 2),
	"selling_price" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"consultation_id" integer,
	"ordered_by" integer,
	"test_name" text NOT NULL,
	"test_category" text,
	"priority" text DEFAULT 'routine' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"clinical_info" text,
	"notes" text,
	"ordered_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"lab_order_id" integer NOT NULL,
	"result" text,
	"unit" text,
	"reference_range" text,
	"interpretation" text,
	"notes" text,
	"recorded_by" integer,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"leave_type" text DEFAULT 'annual' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approver_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"date" text NOT NULL,
	"shift" text DEFAULT 'day' NOT NULL,
	"start_time" text,
	"end_time" text,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"actor_name" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"details" text,
	"previous_value" text,
	"new_value" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer,
	"patient_name" text NOT NULL,
	"queue_date" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"arrival_order" integer NOT NULL,
	"staff_id" integer,
	"staff_name" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"notes" text,
	"referral_source" text DEFAULT 'home',
	"referral_facility" text,
	"department" text DEFAULT 'general',
	"transfer_note" text,
	"diagnosis" text,
	"lab_investigations" text,
	"imaging_investigations" text,
	"management_plan" text,
	"vitals_snapshot" text,
	"notification_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_name" text NOT NULL,
	"phone" text,
	"service" text,
	"rating" integer NOT NULL,
	"comment" text,
	"would_recommend" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triage" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"assigned_nurse_id" integer,
	"assigned_nurse_name" text,
	"blood_pressure" text,
	"pulse_rate" text,
	"respiratory_rate" text,
	"oxygen_saturation" text,
	"temperature" text,
	"weight" text,
	"height" text,
	"pain_scale" integer,
	"chief_complaint" text NOT NULL,
	"nursing_assessment" text,
	"interventions_performed" text,
	"reassessment_notes" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"triage_time" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"admin_id" integer NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"username" text NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "imaging_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"consultation_id" integer,
	"queue_entry_id" integer,
	"requested_by" integer,
	"modality" text NOT NULL,
	"body_part" text,
	"clinical_indication" text,
	"priority" text DEFAULT 'routine' NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"findings" text,
	"impression" text,
	"reported_by" integer,
	"notes" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_dismissals" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"admin_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"related_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hmis_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_key" text NOT NULL,
	"period_type" text DEFAULT 'monthly' NOT NULL,
	"target_value" integer DEFAULT 0 NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hmis_targets_metric_period_unique" UNIQUE("metric_key","period_type")
);
--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"queue_entry_id" integer,
	"ward" text DEFAULT 'General Ward' NOT NULL,
	"bed_number" text,
	"admitted_by" integer,
	"admitted_by_name" text,
	"admission_type" text DEFAULT 'elective' NOT NULL,
	"diagnosis" text,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"discharged_at" timestamp,
	"discharge_summary" text,
	"discharged_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maternity_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"gravida" integer DEFAULT 1,
	"para" integer DEFAULT 0,
	"lmp" text,
	"edd" text,
	"gestational_age_at_booking" integer,
	"age_at_booking" integer,
	"booking_weight" text,
	"booking_bp" text,
	"blood_group" text,
	"rhesus" text,
	"hiv_status" text,
	"tb_status" text,
	"syphilis_status" text,
	"hepatitis_b_status" text,
	"risk_factors" text,
	"is_high_risk" boolean DEFAULT false,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"attended_by" integer,
	"attended_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anc_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"maternity_record_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"visit_number" integer DEFAULT 1 NOT NULL,
	"visit_date" text NOT NULL,
	"gestational_age" integer,
	"weight" text,
	"blood_pressure" text,
	"temperature" text,
	"pulse" text,
	"fundal_height" text,
	"presentation" text,
	"fetal_heart_rate" text,
	"fetal_movement" text,
	"edema" text,
	"urine_protein" text,
	"urine_sugar" text,
	"danger_signs" text,
	"iron_folic_given" boolean DEFAULT false,
	"iptp" boolean DEFAULT false,
	"tetanus_vaccine" text,
	"malaria_test" text,
	"malaria_result" text,
	"hiv_test_done" boolean DEFAULT false,
	"hiv_result" text,
	"ctx_given" boolean DEFAULT false,
	"arvs" text,
	"birth_plan" text,
	"referral_indication" text,
	"next_visit_date" text,
	"clinical_notes" text,
	"attended_by" integer,
	"attended_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"maternity_record_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"delivery_date" text NOT NULL,
	"delivery_time" text,
	"gestational_age" integer,
	"delivery_mode" text,
	"delivery_ward" text,
	"baby_sex" text,
	"birth_weight" text,
	"apgar_1" integer,
	"apgar_5" integer,
	"apgar_10" integer,
	"neonatal_outcome" text,
	"neonatal_resuscitation" boolean DEFAULT false,
	"third_stage_management" text,
	"placenta_complete" text,
	"blood_loss" text,
	"perineal_tears" text,
	"maternal_outcome" text,
	"complications" text,
	"breastfeeding_initiated" text,
	"vitamin_k_given" boolean DEFAULT false,
	"eye_prophylaxis" boolean DEFAULT false,
	"attendant_id" integer,
	"attendant_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partograph_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"maternity_record_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"entry_date" text NOT NULL,
	"entry_time" text NOT NULL,
	"fetal_heart_rate" integer,
	"liquor" text,
	"moulding" text,
	"cervical_dilation" integer,
	"descent" integer,
	"contractions" integer,
	"contraction_duration" integer,
	"contraction_strength" text,
	"blood_pressure" text,
	"pulse" integer,
	"temperature" text,
	"urine_output" text,
	"urine_protein" text,
	"urine_acetone" text,
	"oxytocin" text,
	"drugs_given" text,
	"notes" text,
	"recorded_by" integer,
	"recorded_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theatre_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"surgery_type" text NOT NULL,
	"surgeon_name" text,
	"surgeon_id" integer,
	"anaesthetist_name" text,
	"scrub_nurse_name" text,
	"circulating_nurse_name" text,
	"booked_date" text NOT NULL,
	"booked_time" text,
	"estimated_duration" integer,
	"theatre_room" text DEFAULT 'Main Theatre',
	"priority" text DEFAULT 'elective' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"diagnosis" text,
	"pre_op_notes" text,
	"consent_obtained" boolean DEFAULT false,
	"npo_status" boolean DEFAULT false,
	"blood_available" text,
	"created_by_id" integer,
	"created_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operative_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"operation_performed" text NOT NULL,
	"pre_op_diagnosis" text,
	"post_op_diagnosis" text,
	"procedure_notes" text,
	"findings" text,
	"complications" text,
	"anaesthesia_type" text,
	"anaesthesia_agents" text,
	"blood_loss_ml" text,
	"blood_transfusion" boolean DEFAULT false,
	"specimens_sent" text,
	"drains_inserted" text,
	"closure_method" text,
	"actual_start_time" text,
	"actual_end_time" text,
	"surgeon_name" text,
	"assistant_name" text,
	"anaesthetist_name" text,
	"swab_count_correct" boolean DEFAULT true,
	"instrument_count_correct" boolean DEFAULT true,
	"post_op_instructions" text,
	"post_op_ward" text,
	"condition" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"date" text NOT NULL,
	"age_months" integer,
	"weight" text,
	"height" text,
	"muac" text,
	"head_circumference" text,
	"weight_for_age_z" text,
	"height_for_age_z" text,
	"bmi" text,
	"nutritional_status" text,
	"oedema" text,
	"feeding_assessment" text,
	"notes" text,
	"recorded_by_id" integer,
	"recorded_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "immunization_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"vaccine" text NOT NULL,
	"dose_number" integer DEFAULT 1,
	"date_given" text NOT NULL,
	"batch_number" text,
	"site" text,
	"route" text,
	"next_due_date" text,
	"next_due_vaccine" text,
	"adverse_reaction" text,
	"administered_by_id" integer,
	"administered_by_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dental_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"visit_date" text NOT NULL,
	"chief_complaint" text,
	"examination_notes" text,
	"oral_hygiene" text,
	"extraoral_findings" text,
	"soft_tissue_findings" text,
	"periodontal_status" text,
	"xray_taken" boolean DEFAULT false,
	"xray_findings" text,
	"tooth_chart" text,
	"treatment_plan" text,
	"notes" text,
	"dentist_id" integer,
	"dentist_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dental_procedures" (
	"id" serial PRIMARY KEY NOT NULL,
	"dental_record_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"procedure_date" text NOT NULL,
	"tooth_numbers" text,
	"procedure_name" text NOT NULL,
	"procedure_code" text,
	"surface" text,
	"material_used" text,
	"anaesthesia_given" boolean DEFAULT false,
	"anaesthesia_type" text,
	"findings" text,
	"complications" text,
	"next_appointment" text,
	"notes" text,
	"performed_by_id" integer,
	"performed_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ward_round_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"round_date" text NOT NULL,
	"round_time" text,
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"blood_pressure" text,
	"pulse" text,
	"temperature" text,
	"respiratory_rate" text,
	"spo2" text,
	"blood_glucose" text,
	"weight" text,
	"written_by_id" integer,
	"written_by_name" text,
	"written_by_role" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inpatient_drug_chart" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"drug_name" text NOT NULL,
	"dose" text NOT NULL,
	"route" text DEFAULT 'oral' NOT NULL,
	"frequency" text NOT NULL,
	"start_date" text NOT NULL,
	"stop_date" text,
	"indication" text,
	"status" text DEFAULT 'active' NOT NULL,
	"prescribed_by_id" integer,
	"prescribed_by_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nursing_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"note_date" text NOT NULL,
	"note_time" text,
	"note_type" text DEFAULT 'observation',
	"note" text NOT NULL,
	"blood_pressure" text,
	"pulse" text,
	"temperature" text,
	"respiratory_rate" text,
	"spo2" text,
	"blood_glucose" text,
	"urine_output" text,
	"fluid_intake" text,
	"written_by_id" integer,
	"written_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_staff_id_admins_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_staff_id_admins_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_dispensings" ADD CONSTRAINT "pharmacy_dispensings_stock_id_pharmacy_stock_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."pharmacy_stock"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_lab_order_id_lab_orders_id_fk" FOREIGN KEY ("lab_order_id") REFERENCES "public"."lab_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staff_id_admins_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_staff_id_admins_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage" ADD CONSTRAINT "triage_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage" ADD CONSTRAINT "triage_assigned_nurse_id_admins_id_fk" FOREIGN KEY ("assigned_nurse_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_dismissals" ADD CONSTRAINT "notification_dismissals_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_dismissals" ADD CONSTRAINT "notification_dismissals_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_admitted_by_admins_id_fk" FOREIGN KEY ("admitted_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maternity_records" ADD CONSTRAINT "maternity_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maternity_records" ADD CONSTRAINT "maternity_records_attended_by_admins_id_fk" FOREIGN KEY ("attended_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anc_visits" ADD CONSTRAINT "anc_visits_maternity_record_id_maternity_records_id_fk" FOREIGN KEY ("maternity_record_id") REFERENCES "public"."maternity_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anc_visits" ADD CONSTRAINT "anc_visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anc_visits" ADD CONSTRAINT "anc_visits_attended_by_admins_id_fk" FOREIGN KEY ("attended_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_records" ADD CONSTRAINT "delivery_records_maternity_record_id_maternity_records_id_fk" FOREIGN KEY ("maternity_record_id") REFERENCES "public"."maternity_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_records" ADD CONSTRAINT "delivery_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_records" ADD CONSTRAINT "delivery_records_attendant_id_admins_id_fk" FOREIGN KEY ("attendant_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partograph_entries" ADD CONSTRAINT "partograph_entries_maternity_record_id_maternity_records_id_fk" FOREIGN KEY ("maternity_record_id") REFERENCES "public"."maternity_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partograph_entries" ADD CONSTRAINT "partograph_entries_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partograph_entries" ADD CONSTRAINT "partograph_entries_recorded_by_admins_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theatre_bookings" ADD CONSTRAINT "theatre_bookings_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theatre_bookings" ADD CONSTRAINT "theatre_bookings_surgeon_id_admins_id_fk" FOREIGN KEY ("surgeon_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theatre_bookings" ADD CONSTRAINT "theatre_bookings_created_by_id_admins_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operative_records" ADD CONSTRAINT "operative_records_booking_id_theatre_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."theatre_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operative_records" ADD CONSTRAINT "operative_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_recorded_by_id_admins_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_administered_by_id_admins_id_fk" FOREIGN KEY ("administered_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_records" ADD CONSTRAINT "dental_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_records" ADD CONSTRAINT "dental_records_dentist_id_admins_id_fk" FOREIGN KEY ("dentist_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_procedures" ADD CONSTRAINT "dental_procedures_dental_record_id_dental_records_id_fk" FOREIGN KEY ("dental_record_id") REFERENCES "public"."dental_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_procedures" ADD CONSTRAINT "dental_procedures_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dental_procedures" ADD CONSTRAINT "dental_procedures_performed_by_id_admins_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ward_round_notes" ADD CONSTRAINT "ward_round_notes_admission_id_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ward_round_notes" ADD CONSTRAINT "ward_round_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ward_round_notes" ADD CONSTRAINT "ward_round_notes_written_by_id_admins_id_fk" FOREIGN KEY ("written_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inpatient_drug_chart" ADD CONSTRAINT "inpatient_drug_chart_admission_id_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inpatient_drug_chart" ADD CONSTRAINT "inpatient_drug_chart_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inpatient_drug_chart" ADD CONSTRAINT "inpatient_drug_chart_prescribed_by_id_admins_id_fk" FOREIGN KEY ("prescribed_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_admission_id_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_written_by_id_admins_id_fk" FOREIGN KEY ("written_by_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;