import {
  Printer,
  Search,
  ChevronLeft,
  BookOpen,
  AlertTriangle,
  Heart,
  Baby,
  Scissors,
  Smile,
  Stethoscope,
  Pill,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ── Protocol data ─────────────────────────────────────────────────────────────

type Protocol = { id: string; title: string; dept: string; category: string; content: string };

const DEPTS = [
  { id: 'all', label: 'All Departments', icon: BookOpen },
  { id: 'internal', label: 'Internal Medicine', icon: Stethoscope },
  { id: 'surgery', label: 'Surgery', icon: Scissors },
  { id: 'emergency', label: 'Emergency', icon: Zap },
  { id: 'paediatrics', label: 'Paediatrics', icon: Baby },
  { id: 'maternity', label: 'Maternity / OB-GYN', icon: Heart },
  { id: 'pharmacy', label: 'Pharmacy / Medicines', icon: Pill },
];

const PROTOCOLS: Protocol[] = [
  // ─── INTERNAL MEDICINE ─────────────────────────────────────────────────────
  {
    id: 'malaria-uncomplicated',
    title: 'Uncomplicated Malaria Treatment',
    dept: 'internal',
    category: 'Infectious Disease',
    content: `
<h2>Uncomplicated Malaria — Treatment Protocol</h2>
<p><em>For confirmed P. falciparum or mixed species. RDT or microscopy positive.</em></p>

<h3>First-Line Treatment (Adults)</h3>
<ul>
  <li><strong>Artemether-Lumefantrine (AL)</strong> — Co-artem 80/480mg: 4 tablets at 0h, 8h, 24h, 36h, 48h, 60h</li>
  <li>Give with fatty food or milk to improve absorption</li>
  <li>Total course: 6 doses over 3 days</li>
</ul>

<h3>First-Line Treatment (Children &lt;35kg)</h3>
<table>
  <tr><th>Weight</th><th>Tablets per dose</th></tr>
  <tr><td>5–&lt;15 kg</td><td>1 tablet</td></tr>
  <tr><td>15–&lt;25 kg</td><td>2 tablets</td></tr>
  <tr><td>25–&lt;35 kg</td><td>3 tablets</td></tr>
  <tr><td>≥35 kg</td><td>4 tablets (adult dose)</td></tr>
</table>

<h3>Antipyretic</h3>
<ul>
  <li>Paracetamol 1g oral TDS (adults) or 15 mg/kg TDS (children)</li>
  <li>Tepid sponging for temperature &gt;38.5°C</li>
</ul>

<h3>Pregnancy (any trimester)</h3>
<ul>
  <li>1st trimester: Quinine + Clindamycin for 7 days</li>
  <li>2nd/3rd trimester: AL (same dosing as adults)</li>
</ul>

<h3>Follow-up</h3>
<ul>
  <li>Review at 24–48h if not improving</li>
  <li>Blood film/RDT Day 3 if persisting symptoms</li>
  <li>Consider severe malaria if vomiting, prostration, high parasitaemia</li>
</ul>
    `,
  },
  {
    id: 'malaria-severe',
    title: 'Severe Malaria Management',
    dept: 'internal',
    category: 'Infectious Disease',
    content: `
<h2>Severe Malaria — Management Protocol</h2>
<p><em>Criteria: impaired consciousness, convulsions, severe anaemia (Hb &lt;7), prostration, hypoglycaemia, respiratory distress, haemoglobinuria, hyperparasitaemia (&gt;5%).</em></p>

<h3>Immediate Actions (ABC)</h3>
<ul>
  <li>Secure IV access — 2 large-bore cannulas</li>
  <li>Check blood glucose STAT — treat hypoglycaemia (RBS &lt;3.0 mmol/L) with 50% Dextrose 25–50 mL IV stat, then 10% Dextrose infusion</li>
  <li>Airway — position semi-prone if GCS &lt;9</li>
  <li>IV fluids: cautious 10 mL/kg Normal Saline bolus if dehydrated</li>
</ul>

<h3>Anti-malarial Treatment</h3>
<ul>
  <li><strong>IV Artesunate 2.4 mg/kg</strong> at 0h, 12h, 24h, then once daily until able to take oral</li>
  <li>Switch to AL (full course) once able to swallow</li>
  <li>If Artesunate unavailable: Quinine 20 mg/kg loading in 5% Dextrose over 4h, then 10 mg/kg Q8H</li>
</ul>

<h3>Convulsion Management</h3>
<ul>
  <li>Diazepam 0.3 mg/kg IV (max 10 mg) or rectal diazepam 0.5 mg/kg</li>
  <li>Phenobarbitone 15 mg/kg IV if continued seizures (give slowly)</li>
  <li>Exclude hypoglycaemia as cause</li>
</ul>

<h3>Severe Anaemia (Hb &lt;5 g/dL or &lt;7 with signs of decompensation)</h3>
<ul>
  <li>Whole blood 10 mL/kg over 3–4h (use 20 mL/kg in children)</li>
  <li>Furosemide 1 mg/kg with transfusion</li>
</ul>

<h3>Monitoring</h3>
<ul>
  <li>Hourly: GCS, RBS, vitals, urine output</li>
  <li>Urine output target: ≥0.5 mL/kg/hr in adults, ≥1 mL/kg/hr in children</li>
  <li>Avoid excessive IV fluids — risk of pulmonary oedema</li>
</ul>
    `,
  },
  {
    id: 'typhoid',
    title: 'Typhoid Fever (Enteric Fever)',
    dept: 'internal',
    category: 'Infectious Disease',
    content: `
<h2>Typhoid Fever — Treatment Protocol</h2>
<p><em>Salmonella typhi / paratyphi infection. Confirmed by culture or clinical diagnosis.</em></p>

<h3>First-Line Antibiotics</h3>
<ul>
  <li><strong>Ciprofloxacin</strong> 500 mg oral BD × 7 days (adults)</li>
  <li><strong>Azithromycin</strong> 1g oral OD × 5 days (alternative, good for resistant strains)</li>
  <li><strong>Ceftriaxone</strong> 2g IV OD × 7–14 days (severe / complicated / unable to take oral)</li>
</ul>

<h3>Supportive Care</h3>
<ul>
  <li>Paracetamol 1g TDS for fever</li>
  <li>Adequate oral or IV hydration</li>
  <li>Nutritious soft diet — avoid high-fibre foods (risk of perforation)</li>
  <li>Bed rest</li>
</ul>

<h3>Complications to Watch</h3>
<table>
  <tr><th>Complication</th><th>Signs</th><th>Action</th></tr>
  <tr><td>Intestinal perforation</td><td>Sudden peritonitis, rigid abdomen</td><td>Urgent surgical consult, IV antibiotics, resuscitation</td></tr>
  <tr><td>GI haemorrhage</td><td>Melaena, rectal bleeding</td><td>IV fluids, blood transfusion, surgical review</td></tr>
  <tr><td>Encephalopathy</td><td>Confusion, delirium</td><td>Dexamethasone 3mg/kg then 1mg/kg Q6H × 48h</td></tr>
</table>

<h3>Discharge Criteria</h3>
<ul>
  <li>Afebrile for 48h, tolerating oral medication</li>
  <li>Complete full antibiotic course as outpatient</li>
  <li>Food handlers: stool cultures ×3 negative before return to work</li>
</ul>
    `,
  },
  {
    id: 'hypertension',
    title: 'Hypertension Management',
    dept: 'internal',
    category: 'Cardiovascular',
    content: `
<h2>Hypertension — Management Protocol</h2>

<h3>Classification</h3>
<table>
  <tr><th>Category</th><th>Systolic</th><th>Diastolic</th></tr>
  <tr><td>Normal</td><td>&lt;120</td><td>&lt;80</td></tr>
  <tr><td>Elevated</td><td>120–129</td><td>&lt;80</td></tr>
  <tr><td>Stage 1 HTN</td><td>130–139</td><td>80–89</td></tr>
  <tr><td>Stage 2 HTN</td><td>≥140</td><td>≥90</td></tr>
  <tr><td>Hypertensive Crisis</td><td>&gt;180</td><td>&gt;120</td></tr>
</table>

<h3>First-Line Medications</h3>
<ul>
  <li><strong>Amlodipine</strong> 5–10mg OD (CCB — preferred first-line)</li>
  <li><strong>Enalapril</strong> 5–20mg BD (ACE inhibitor — good for diabetes/proteinuria; avoid in pregnancy)</li>
  <li><strong>Hydrochlorothiazide</strong> 12.5–25mg OD (thiazide diuretic)</li>
  <li><strong>Atenolol</strong> 25–100mg OD (beta-blocker — add if rate control needed)</li>
</ul>

<h3>Hypertensive Emergency (BP &gt;180/120 + end-organ damage)</h3>
<ul>
  <li>Admit to HDU/ICU</li>
  <li><strong>Nifedipine SR</strong> 20mg oral or sublingual (NOT short-acting nifedipine)</li>
  <li>IV Labetalol 20mg over 2 min, repeat Q10min (total 300mg)</li>
  <li>Aim: reduce BP by 25% in first hour, normal over 24–48h</li>
  <li>Monitor: ECG, renal function, urinalysis, fundoscopy</li>
</ul>

<h3>Hypertensive Urgency (BP &gt;180/120, no end-organ damage)</h3>
<ul>
  <li>Oral Nifedipine SR 20mg or Amlodipine 10mg</li>
  <li>Reduce BP over 24–48h</li>
  <li>Observe for 2–4h before discharge</li>
</ul>

<h3>Monitoring</h3>
<ul>
  <li>BP checks twice daily while admitted</li>
  <li>U&E, creatinine, urinalysis on admission</li>
  <li>ECG (LVH assessment)</li>
  <li>Lifestyle: low-salt diet, weight reduction, quit smoking, limit alcohol, exercise</li>
</ul>
    `,
  },
  {
    id: 'diabetes',
    title: 'Type 2 Diabetes Management',
    dept: 'internal',
    category: 'Endocrine',
    content: `
<h2>Type 2 Diabetes — Inpatient Management Protocol</h2>

<h3>Glycaemic Targets (Inpatient)</h3>
<ul>
  <li>Non-ICU: 7.8–10.0 mmol/L (140–180 mg/dL)</li>
  <li>ICU: 6.1–7.8 mmol/L (target &lt;10 mmol/L)</li>
  <li>Avoid hypoglycaemia (&lt;4.0 mmol/L)</li>
</ul>

<h3>RBS Monitoring Schedule</h3>
<ul>
  <li>Pre-meal and bedtime (QDS if on insulin)</li>
  <li>Q4H if critically unwell or changing insulin regimen</li>
</ul>

<h3>Oral Medications (Continue or Modify)</h3>
<ul>
  <li>Metformin: HOLD if contrast given, surgery, acute illness, eGFR &lt;30</li>
  <li>Sulphonylureas (Glibenclamide): use with caution — hold if poor oral intake</li>
  <li>SGLT-2 inhibitors: HOLD when admitted</li>
</ul>

<h3>Insulin Regimens</h3>
<table>
  <tr><th>Situation</th><th>Regimen</th></tr>
  <tr><td>Well-controlled, eating</td><td>Continue usual insulin; adjust doses</td></tr>
  <tr><td>NBM / poor intake</td><td>50% usual basal dose, hold bolus. Glucose infusion if needed</td></tr>
  <tr><td>New uncontrolled DM</td><td>Start Insulin regular sliding scale Q6H</td></tr>
  <tr><td>Perioperative</td><td>GKI (Glucose-Potassium-Insulin) infusion</td></tr>
</table>

<h3>Sliding Scale (Insulin Regular SC)</h3>
<table>
  <tr><th>RBS (mmol/L)</th><th>Units</th></tr>
  <tr><td>&lt;4.0</td><td>HOLD — treat hypoglycaemia</td></tr>
  <tr><td>4.0–7.0</td><td>0 units</td></tr>
  <tr><td>7.1–10.0</td><td>2 units</td></tr>
  <tr><td>10.1–14.0</td><td>4 units</td></tr>
  <tr><td>14.1–17.0</td><td>6 units</td></tr>
  <tr><td>&gt;17.0</td><td>8 units + call doctor</td></tr>
</table>

<h3>Hypoglycaemia Management (RBS &lt;4.0 mmol/L)</h3>
<ul>
  <li>Conscious: 15–20g fast-acting glucose (150–200mL juice, 3–4 glucose tablets)</li>
  <li>Unconscious: 50mL 50% Dextrose IV stat, then 10% Dextrose infusion</li>
  <li>Recheck RBS in 15 minutes; repeat if still &lt;4.0</li>
  <li>Identify and treat cause; adjust insulin doses</li>
</ul>
    `,
  },
  {
    id: 'pneumonia',
    title: 'Community-Acquired Pneumonia (CAP)',
    dept: 'internal',
    category: 'Respiratory',
    content: `
<h2>Community-Acquired Pneumonia — Treatment Protocol</h2>

<h3>Severity Assessment (CURB-65)</h3>
<table>
  <tr><th>Factor</th><th>Score</th></tr>
  <tr><td>Confusion (new)</td><td>1</td></tr>
  <tr><td>Urea &gt;7 mmol/L</td><td>1</td></tr>
  <tr><td>Respiratory rate ≥30/min</td><td>1</td></tr>
  <tr><td>BP: Systolic &lt;90 or Diastolic &lt;60</td><td>1</td></tr>
  <tr><td>Age ≥65 years</td><td>1</td></tr>
</table>
<ul>
  <li>Score 0–1: Mild — outpatient or short admission</li>
  <li>Score 2: Moderate — admit, short IV course then switch oral</li>
  <li>Score 3–5: Severe — admit, IV antibiotics, consider ICU</li>
</ul>

<h3>Antibiotic Treatment</h3>
<ul>
  <li><strong>Mild (outpatient):</strong> Amoxicillin 500mg–1g oral TDS × 5 days ± Azithromycin 500mg OD × 3 days</li>
  <li><strong>Moderate (admission):</strong> Amoxicillin-Clavulanate 1.2g IV TDS + Azithromycin 500mg OD × 5–7 days; switch to oral when clinically improved</li>
  <li><strong>Severe / ICU:</strong> Ceftriaxone 2g IV OD + Azithromycin 500mg IV OD; consider antifungal cover if immunocompromised</li>
  <li><strong>Aspiration pneumonia:</strong> Add Metronidazole 500mg IV TDS</li>
  <li><strong>Penicillin allergy:</strong> Levofloxacin or Moxifloxacin + Azithromycin</li>
</ul>

<h3>Supportive Care</h3>
<ul>
  <li>O₂ if SpO₂ &lt;94% — target 94–98% (88–92% in COPD)</li>
  <li>IV fluids if dehydrated</li>
  <li>Paracetamol for fever</li>
  <li>Chest physiotherapy if secretions</li>
  <li>VTE prophylaxis if immobile</li>
</ul>

<h3>Monitoring</h3>
<ul>
  <li>Vitals Q4–6H, SpO₂ continuous</li>
  <li>CXR at 6 weeks (to confirm resolution, exclude malignancy)</li>
  <li>Discharge when: afebrile 24h, RR &lt;24, SpO₂ &gt;94% on room air, eating/drinking</li>
</ul>
    `,
  },
  {
    id: 'sepsis',
    title: 'Sepsis / Septic Shock Protocol',
    dept: 'internal',
    category: 'Critical Care',
    content: `
<h2>Sepsis — Hour-1 Bundle (Surviving Sepsis Campaign)</h2>
<p><em>Suspected infection + ≥2 qSOFA: RR ≥22/min, altered mentation, SBP ≤100 mmHg</em></p>

<h3>Within 1 Hour — The Sepsis Bundle</h3>
<ol>
  <li><strong>Measure lactate</strong> — Repeat if initial &gt;2 mmol/L. Target &lt;2 mmol/L</li>
  <li><strong>Blood cultures ×2</strong> — Before starting antibiotics (do not delay antibiotics beyond 1h)</li>
  <li><strong>Broad-spectrum antibiotics IV</strong> within 1 hour of recognition:
    <ul>
      <li>Ceftriaxone 2g IV + Metronidazole 500mg IV</li>
      <li>Add Gentamicin 5 mg/kg IV if severe sepsis</li>
      <li>De-escalate based on culture sensitivities</li>
    </ul>
  </li>
  <li><strong>IV fluid resuscitation</strong> — 30 mL/kg crystalloid (Normal Saline or Ringer's Lactate) for hypotension or lactate ≥4 mmol/L</li>
  <li><strong>Vasopressors if MAP &lt;65 mmHg</strong> despite fluids — Norepinephrine 0.1–0.3 mcg/kg/min IV (preferred)</li>
</ol>

<h3>Monitoring Targets</h3>
<ul>
  <li>MAP ≥65 mmHg</li>
  <li>Urine output ≥0.5 mL/kg/hr</li>
  <li>Lactate clearance ≥10% per 2h</li>
  <li>ScvO₂ ≥70%</li>
  <li>Vital signs Q1H until stabilised</li>
</ul>

<h3>Source Control</h3>
<ul>
  <li>Identify focus: CXR, urine MC&amp;S, wound swab, ultrasound abdomen</li>
  <li>Drain abscesses, remove infected lines, debride infected wounds</li>
</ul>

<h3>Adjuncts</h3>
<ul>
  <li>Hydrocortisone 200mg/day IV infusion if refractory shock (vasopressor-dependent)</li>
  <li>VTE prophylaxis (if not already anticoagulated)</li>
  <li>Stress ulcer prophylaxis: Omeprazole 40mg IV OD</li>
  <li>Glucose control: target 6–10 mmol/L</li>
</ul>
    `,
  },
  {
    id: 'anemia',
    title: 'Anaemia Management',
    dept: 'internal',
    category: 'Haematology',
    content: `
<h2>Anaemia — Assessment and Management Protocol</h2>

<h3>Classification by Severity</h3>
<table>
  <tr><th>Severity</th><th>Hb (g/dL)</th><th>Action</th></tr>
  <tr><td>Mild</td><td>10–12 (F), 10–13 (M)</td><td>Investigate cause, iron supplements</td></tr>
  <tr><td>Moderate</td><td>7–10</td><td>Treat cause; transfuse if symptomatic</td></tr>
  <tr><td>Severe</td><td>5–7</td><td>Admit, transfuse</td></tr>
  <tr><td>Very severe</td><td>&lt;5</td><td>Emergency transfusion</td></tr>
</table>

<h3>Common Causes in Uganda / East Africa</h3>
<ul>
  <li>Iron deficiency (most common) — especially in women, children</li>
  <li>Malaria (haemolytic + bone marrow suppression)</li>
  <li>HIV-related</li>
  <li>Chronic disease (TB, renal failure)</li>
  <li>Haemoglobinopathy (sickle cell, thalassaemia)</li>
  <li>B12 / folate deficiency</li>
</ul>

<h3>Iron Deficiency Anaemia</h3>
<ul>
  <li>Ferrous sulphate 200mg TDS oral (take with Vitamin C; not with tea/milk)</li>
  <li>Folic acid 5mg OD</li>
  <li>Treat for 3 months after Hb normalises to replenish stores</li>
  <li>IV iron (Ferric carboxymaltose) if: intolerant of oral, malabsorption, severe anaemia</li>
</ul>

<h3>Transfusion Triggers</h3>
<ul>
  <li>Hb &lt;7 g/dL in stable patients</li>
  <li>Hb &lt;8 g/dL in cardiac disease or post-operative</li>
  <li>Any Hb with haemodynamic instability</li>
  <li>Symptomatic (dyspnoea at rest, chest pain, altered mentation)</li>
</ul>

<h3>Blood Transfusion Protocol</h3>
<ul>
  <li>Group & cross-match before transfusing</li>
  <li>1 unit packed cells raises Hb by ~1 g/dL</li>
  <li>Rate: 1 unit over 2–4h; use diuretic (Furosemide 20mg IV) if cardiac risk</li>
  <li>Check Hb 1h and 6h post-transfusion</li>
  <li>Document each unit: start time, end time, reaction check at 15 min</li>
</ul>
    `,
  },

  // ─── SURGERY ────────────────────────────────────────────────────────────────
  {
    id: 'preop-checklist',
    title: 'Pre-operative Assessment Checklist',
    dept: 'surgery',
    category: 'Perioperative',
    content: `
<h2>Pre-operative Assessment & Checklist</h2>

<h3>Anaesthetic Risk (ASA Classification)</h3>
<table>
  <tr><th>ASA</th><th>Description</th><th>Example</th></tr>
  <tr><td>I</td><td>Healthy patient</td><td>No systemic disease</td></tr>
  <tr><td>II</td><td>Mild systemic disease</td><td>Controlled DM/HTN, smoker</td></tr>
  <tr><td>III</td><td>Severe systemic disease</td><td>Poorly controlled DM, COPD, morbid obesity</td></tr>
  <tr><td>IV</td><td>Severe systemic disease, constant threat to life</td><td>Recent MI, severe cardiac failure</td></tr>
  <tr><td>V</td><td>Moribund patient</td><td>Ruptured aneurysm, septic shock</td></tr>
</table>

<h3>Pre-op Investigations</h3>
<ul>
  <li>All: FBC, blood group, cross-match, RBS</li>
  <li>Age &gt;40 / cardiac risk: ECG, CXR</li>
  <li>Renal disease: U&E, creatinine</li>
  <li>Liver disease: LFTs, clotting profile</li>
  <li>Diabetes: HbA1c, RBS</li>
  <li>Women of reproductive age: urine HCG</li>
</ul>

<h3>Pre-operative Preparation</h3>
<ul>
  <li><strong>NPO:</strong> Nil by mouth — solids 6h, clear fluids 2h before GA (4h regional)</li>
  <li><strong>Medications:</strong> Continue antihypertensives, cardiac drugs. HOLD Metformin, anticoagulants (discuss with anaesthetist)</li>
  <li><strong>Consent:</strong> Written informed consent — procedure, risks, alternatives, complications</li>
  <li><strong>Blood:</strong> Cross-match 2 units if major procedure or haematocrit &lt;30%</li>
  <li><strong>DVT prophylaxis:</strong> Compression stockings; Heparin 5000 IU SC 2h pre-op for high-risk</li>
  <li><strong>Antibiotics:</strong> Cefazolin 1–2g IV at induction (within 60 min); Metronidazole 500mg IV for bowel/contaminated</li>
  <li><strong>Skin prep:</strong> Chlorhexidine-alcohol prep; hair clipping (not shaving)</li>
  <li><strong>Surgical marking:</strong> Mark laterality if applicable; surgeon to mark</li>
</ul>

<h3>Pre-op Safety Checklist (WHO Sign-In)</h3>
<ul>
  <li>Patient identity confirmed (name, DOB, consent form)</li>
  <li>Procedure and site confirmed</li>
  <li>Anaesthesia safety check complete</li>
  <li>Pulse oximeter attached and functioning</li>
  <li>Known allergy documented</li>
  <li>Difficult airway / aspiration risk identified</li>
  <li>Blood loss risk: &gt;500 mL blood/products available</li>
</ul>
    `,
  },
  {
    id: 'postop-care',
    title: 'Post-operative Care Protocol',
    dept: 'surgery',
    category: 'Perioperative',
    content: `
<h2>Post-operative Care Protocol</h2>

<h3>Immediate Recovery (1–4 hours post-op)</h3>
<ul>
  <li>Airway: Ensure airway patent; recovery position until fully awake</li>
  <li>Oxygen: O₂ mask at 4–6 L/min until SpO₂ ≥96% on room air</li>
  <li>Monitoring: Vitals every 15 min for 1h, then every 30 min for 2h</li>
  <li>Fluids: IV maintenance until drinking</li>
  <li>Pain: Paracetamol 1g IV/oral QDS ± NSAID ± opioid for breakthrough</li>
  <li>PONV: Ondansetron 4mg IV for nausea/vomiting</li>
</ul>

<h3>Pain Management Ladder (Post-op)</h3>
<table>
  <tr><th>Pain Level</th><th>Treatment</th></tr>
  <tr><td>Mild (VAS 1–3)</td><td>Paracetamol 1g QDS oral/IV</td></tr>
  <tr><td>Moderate (VAS 4–6)</td><td>Paracetamol + Ibuprofen 400mg TDS or Diclofenac 75mg IM/oral</td></tr>
  <tr><td>Severe (VAS 7–10)</td><td>Add Morphine 5–10mg SC/IV Q4H PRN; Tramadol 100mg oral/IM Q6H</td></tr>
</table>

<h3>Post-op Routine Orders</h3>
<ul>
  <li>DVT prophylaxis: Heparin 5000 IU SC BD + compression stockings</li>
  <li>Foley catheter: Remove at 24h (48h after pelvic surgery)</li>
  <li>Wound: Check daily; first dressing change at 24–48h</li>
  <li>Diet: Sips of water when awake; advance as tolerated; full diet by Day 2 (simple cases)</li>
  <li>Drain: Remove when &lt;30 mL/24h serous output</li>
  <li>Early mobilisation: Sit up 4h post-op; walk with assistance Day 1</li>
</ul>

<h3>Warning Signs — Escalate to Surgeon</h3>
<ul>
  <li>Fever &gt;38.5°C beyond Day 1 (wound infection, anastomotic leak, DVT)</li>
  <li>Wound dehiscence, discharge, erythema</li>
  <li>Acute abdomen — rigidity, absent bowel sounds beyond Day 2</li>
  <li>Haematuria with frank blood / clots</li>
  <li>BP &lt;90/60 or tachycardia &gt;100 not explained by pain/fever</li>
  <li>Falling urine output (&lt;0.5 mL/kg/hr for 2 consecutive hours)</li>
</ul>
    `,
  },

  // ─── EMERGENCY ──────────────────────────────────────────────────────────────
  {
    id: 'bls-cpr',
    title: 'Basic Life Support / CPR Protocol',
    dept: 'emergency',
    category: 'Resuscitation',
    content: `
<h2>Basic Life Support — Adult CPR Protocol (2020 Guidelines)</h2>

<h3>Chain of Survival</h3>
<ol>
  <li>Early recognition and call for help</li>
  <li>Early CPR — focus on chest compressions</li>
  <li>Rapid defibrillation</li>
  <li>Advanced resuscitation</li>
  <li>Post-cardiac arrest care</li>
</ol>

<h3>Adult BLS Sequence</h3>
<ol>
  <li><strong>Check safety</strong> — Is the scene safe?</li>
  <li><strong>Check response</strong> — Tap shoulders, shout "Are you OK?"</li>
  <li><strong>Call for help</strong> — Activate emergency team / shout for help</li>
  <li><strong>Airway</strong> — Head-tilt chin-lift; look for foreign body</li>
  <li><strong>Check breathing</strong> — Look, listen, feel for ≤10 seconds; if no/abnormal breathing, start CPR</li>
  <li><strong>30:2 compressions to breaths</strong>
    <ul>
      <li>Rate: 100–120/min</li>
      <li>Depth: 5–6 cm (adults)</li>
      <li>Full chest recoil between compressions</li>
      <li>Minimise interruptions</li>
    </ul>
  </li>
  <li><strong>Defibrillation</strong> — As soon as AED available: analyse rhythm, shock if VF/pVT; resume CPR immediately after shock</li>
</ol>

<h3>ACLS — Shockable Rhythms (VF / Pulseless VT)</h3>
<ul>
  <li>1 shock → immediately resume CPR × 2 min</li>
  <li>Adrenaline 1mg IV Q3–5min from 3rd shock</li>
  <li>Amiodarone 300mg IV after 3rd shock, 150mg after 5th shock</li>
</ul>

<h3>ACLS — Non-shockable Rhythms (PEA / Asystole)</h3>
<ul>
  <li>Continue CPR; adrenaline 1mg IV Q3–5min immediately</li>
  <li>Treat reversible causes (4Hs &amp; 4Ts):
    <ul>
      <li>Hypoxia, Hypovolaemia, Hypo/Hyperkalaemia, Hypothermia</li>
      <li>Thrombosis (pulmonary/coronary), Tension pneumothorax, Tamponade, Toxins</li>
    </ul>
  </li>
</ul>
    `,
  },
  {
    id: 'eclampsia',
    title: 'Eclampsia / Severe Pre-eclampsia',
    dept: 'emergency',
    category: 'Obstetric Emergency',
    content: `
<h2>Eclampsia — Emergency Management Protocol</h2>
<p><em>Eclampsia: seizures in a pregnant/postpartum woman with pre-eclampsia</em></p>
<p><em>Severe Pre-eclampsia: BP ≥160/110 + proteinuria OR severe features</em></p>

<h3>Immediate Management (ABCDE)</h3>
<ul>
  <li>Position: Left lateral; protect airway; O₂ 4–6 L/min</li>
  <li>IV access — 2 large-bore cannulas</li>
  <li>Seizure first aid: padded side-rails, do not restrain limbs, time seizure</li>
  <li>Call for help: senior obstetrician + anaesthetist + midwife</li>
</ul>

<h3>Magnesium Sulphate — FIRST LINE Anticonvulsant</h3>
<ul>
  <li><strong>Loading dose:</strong> MgSO4 4g IV over 5–10 min (20% solution)</li>
  <li><strong>Maintenance:</strong> MgSO4 1g/hr IV infusion × 24h after last seizure</li>
  <li><strong>Recurrence:</strong> Additional 2g IV bolus over 5 min</li>
  <li><strong>Toxicity monitoring (every 30 min):</strong>
    <ul>
      <li>Respiratory rate ≥16/min</li>
      <li>Patellar reflexes present</li>
      <li>Urine output ≥25–30 mL/hr</li>
    </ul>
  </li>
  <li><strong>Antidote:</strong> Calcium gluconate 10mL of 10% IV over 3 min</li>
</ul>

<h3>Blood Pressure Control</h3>
<ul>
  <li>Target: SBP 140–155 mmHg; DBP 90–105 mmHg</li>
  <li><strong>Hydralazine</strong> 5–10mg IV Q20min (max 30mg)</li>
  <li><strong>Labetalol</strong> 20–40mg IV Q20min (max 200mg); avoid in asthma</li>
  <li><strong>Nifedipine SR</strong> 10–20mg oral Q20min (oral route acceptable)</li>
</ul>

<h3>Definitive Management — Deliver the Baby</h3>
<ul>
  <li>Gestation ≥34 weeks: deliver once stabilised</li>
  <li>Gestation &lt;34 weeks: corticosteroids (Dexamethasone 6mg IM Q12H × 4 doses) if stabilised; consider delivery based on severity</li>
  <li>Route: vaginal preferred if favourable; C/S for obstetric indications</li>
</ul>

<h3>Post-partum</h3>
<ul>
  <li>Continue MgSO4 for 24h post-delivery</li>
  <li>Continue antihypertensives</li>
  <li>Monitor BP Q4H for 48h</li>
</ul>
    `,
  },
  {
    id: 'shock',
    title: 'Shock Management Protocol',
    dept: 'emergency',
    category: 'Critical Care',
    content: `
<h2>Shock — Recognition and Management Protocol</h2>
<p><em>Shock: inadequate tissue perfusion. SBP &lt;90 mmHg or MAP &lt;65 mmHg + signs of hypoperfusion.</em></p>

<h3>Types of Shock</h3>
<table>
  <tr><th>Type</th><th>Cause</th><th>Features</th></tr>
  <tr><td>Hypovolaemic</td><td>Haemorrhage, dehydration</td><td>Low BP, tachycardia, cold clammy, low JVP</td></tr>
  <tr><td>Septic</td><td>Infection</td><td>Warm peripheries initially, fever, tachypnoea</td></tr>
  <tr><td>Cardiogenic</td><td>MI, acute LVF</td><td>Pulmonary oedema, raised JVP, S3 gallop</td></tr>
  <tr><td>Obstructive</td><td>PE, tension pneumothorax, tamponade</td><td>Raised JVP, diminished breath sounds, Beck's triad</td></tr>
  <tr><td>Distributive</td><td>Anaphylaxis, neurogenic</td><td>Vasodilation, warm peripheries</td></tr>
</table>

<h3>Initial Management (All Types)</h3>
<ol>
  <li>IV access × 2 large bore; send FBC, U&E, LFT, group & cross-match, lactate, blood cultures</li>
  <li>O₂ at 15 L/min via non-rebreather mask</li>
  <li>IV fluid: 250–500 mL crystalloid bolus over 15 min; reassess; repeat up to 30 mL/kg if hypovolaemic</li>
  <li>Urinary catheter — monitor hourly output</li>
  <li>ECG, CXR, point-of-care USS if available</li>
</ol>

<h3>Specific Treatment</h3>
<ul>
  <li><strong>Haemorrhagic shock:</strong> Blood products early (1:1:1 RBC:FFP:Platelets); urgent surgical haemostasis; permissive hypotension (SBP 80–90) until haemostasis</li>
  <li><strong>Septic shock:</strong> Antibiotics within 1h, norepinephrine vasopressor (see Sepsis protocol)</li>
  <li><strong>Cardiogenic shock:</strong> Cautious fluids; inotropes (Dobutamine); avoid excess IV fluids; treat MI/arrhythmia</li>
  <li><strong>Anaphylaxis:</strong> Adrenaline 0.5mg IM (anterolateral thigh); antihistamines; hydrocortisone 200mg IV; fluids</li>
  <li><strong>Tension pneumothorax:</strong> Immediate needle decompression (2nd ICS, MCL) → chest drain</li>
</ul>
    `,
  },

  // ─── PAEDIATRICS ────────────────────────────────────────────────────────────
  {
    id: 'imci',
    title: 'IMCI — Integrated Management of Childhood Illness',
    dept: 'paediatrics',
    category: 'General Paediatrics',
    content: `
<h2>IMCI — Integrated Management of Childhood Illness</h2>
<p><em>For children 2 months to 5 years. Assess all sick children systematically.</em></p>

<h3>Danger Signs (Refer Immediately)</h3>
<ul>
  <li>Cannot breastfeed or drink</li>
  <li>Vomits everything</li>
  <li>Convulsions (current or in past)</li>
  <li>Lethargic or unconscious</li>
  <li>Grunting / severe respiratory distress</li>
</ul>

<h3>Fever Assessment</h3>
<ul>
  <li>Malaria: RDT → treat with AL (weight-based) + Paracetamol</li>
  <li>Bacterial infection: if stiff neck → meningitis (LP + IV antibiotics)</li>
  <li>Measles: Vitamin A + supportive</li>
</ul>

<h3>Cough / Difficult Breathing Classification</h3>
<table>
  <tr><th>Classification</th><th>Signs</th><th>Treatment</th></tr>
  <tr><td>Severe pneumonia</td><td>Chest indrawing, grunting, cyanosis</td><td>Admit; O₂; Benzyl Penicillin IV + Gentamicin</td></tr>
  <tr><td>Pneumonia</td><td>Fast breathing (age-adjusted), no indrawing</td><td>Amoxicillin oral × 5 days; review Day 2</td></tr>
  <tr><td>No pneumonia (cough/cold)</td><td>No fast breathing</td><td>Home care; soothe throat; review if worsens</td></tr>
</table>
<p><em>Fast breathing: &lt;2mo: ≥60/min; 2–12mo: ≥50/min; 1–5yr: ≥40/min</em></p>

<h3>Diarrhoea and Dehydration</h3>
<table>
  <tr><th>Classification</th><th>Signs</th><th>Treatment</th></tr>
  <tr><td>Severe dehydration</td><td>Sunken eyes, skin pinch very slow, lethargic</td><td>Plan C: Ringer's 100 mL/kg over 3h (infants) / 30 min then 70 mL/kg (older)</td></tr>
  <tr><td>Some dehydration</td><td>Restless, sunken eyes, thirsty</td><td>Plan B: 75 mL/kg ORS over 4h; ZInc 20mg OD × 10 days</td></tr>
  <tr><td>No dehydration</td><td>None of above</td><td>Plan A: ORS after each loose stool; Zinc; continue feeding</td></tr>
</table>

<h3>SAM — Severe Acute Malnutrition</h3>
<ul>
  <li>MUAC &lt;11.5 cm OR weight-for-height Z-score &lt;-3 OR bilateral pitting oedema</li>
  <li>Admit: F-75 therapeutic milk first 1–2 weeks (Phase 1)</li>
  <li>Transition to F-100 / RUTF (Plumpy'Nut) Phase 2</li>
  <li>Antibiotics: Amoxicillin 15mg/kg oral BD × 7 days</li>
  <li>Vitamin A, Folic acid, Multivitamins</li>
</ul>
    `,
  },
  {
    id: 'neonatal-care',
    title: 'Neonatal Care Protocol',
    dept: 'paediatrics',
    category: 'Neonatology',
    content: `
<h2>Neonatal Care Protocol — Newborn (0–28 days)</h2>

<h3>Immediate Newborn Care (Golden Minute)</h3>
<ol>
  <li>Dry and stimulate (30 sec) — rub back/soles</li>
  <li>Assess breathing — if not breathing, give positive-pressure ventilation (40–60 breaths/min)</li>
  <li>Keep warm — skin-to-skin or warmer; hat and wrap</li>
  <li>Early breastfeeding within 1 hour of birth</li>
</ol>

<h3>APGAR Score</h3>
<table>
  <tr><th>Sign</th><th>0</th><th>1</th><th>2</th></tr>
  <tr><td>Appearance (colour)</td><td>Blue/pale</td><td>Blue extremities</td><td>Completely pink</td></tr>
  <tr><td>Pulse</td><td>Absent</td><td>&lt;100</td><td>≥100</td></tr>
  <tr><td>Grimace (reflex)</td><td>No response</td><td>Grimace</td><td>Cry/cough/sneeze</td></tr>
  <tr><td>Activity (tone)</td><td>Limp</td><td>Some flexion</td><td>Active motion</td></tr>
  <tr><td>Respiration</td><td>Absent</td><td>Irregular, weak</td><td>Good cry</td></tr>
</table>
<ul>
  <li>Score 7–10: Normal; Score 4–6: Moderate depression; Score &lt;4: Severe</li>
</ul>

<h3>Routine Prophylaxis</h3>
<ul>
  <li>Vitamin K1 (phytomenadione) 1mg IM within 1h of birth (0.5mg if &lt;1.5kg)</li>
  <li>Tetracycline 1% eye ointment (both eyes) — neonatal conjunctivitis prophylaxis</li>
  <li>BCG vaccine + OPV0 + Hep B at birth (see EPI schedule)</li>
</ul>

<h3>Neonatal Sepsis</h3>
<ul>
  <li>Risk factors: maternal fever, prolonged ROM (&gt;18h), meconium-stained liquor</li>
  <li>Signs: poor feeding, lethargy, temperature instability, apnoea, bulging fontanelle</li>
  <li>Empiric antibiotics: Benzyl Penicillin 50,000 IU/kg BD IV + Gentamicin 5mg/kg OD IV</li>
  <li>Duration: 5 days if cultures negative + improving; 7–10 days if culture positive</li>
</ul>

<h3>Danger Signs — Refer to Neonatology</h3>
<ul>
  <li>Respiratory rate &gt;60/min, grunting, severe retractions</li>
  <li>Temperature &lt;35.5°C or &gt;38°C</li>
  <li>Jaundice within 24h of birth or extending to palms/soles</li>
  <li>Seizures or abnormal movements</li>
</ul>
    `,
  },

  // ─── MATERNITY ──────────────────────────────────────────────────────────────
  {
    id: 'pph',
    title: 'Postpartum Haemorrhage (PPH) Management',
    dept: 'maternity',
    category: 'Obstetric Emergency',
    content: `
<h2>Postpartum Haemorrhage — Management Protocol</h2>
<p><em>PPH: blood loss ≥500 mL after vaginal delivery or ≥1000 mL after C/S within 24h of delivery</em></p>

<h3>4 T's — Causes</h3>
<ul>
  <li><strong>Tone</strong> (70%): Uterine atony — most common</li>
  <li><strong>Trauma</strong> (20%): Lacerations, uterine rupture, extensions</li>
  <li><strong>Tissue</strong> (10%): Retained placenta/membranes</li>
  <li><strong>Thrombin</strong> (&lt;1%): Coagulopathy (DIC)</li>
</ul>

<h3>Immediate Management (Call for Help)</h3>
<ol>
  <li>Uterine massage — bimanual compression</li>
  <li>IV access × 2 large bore; send FBC, clotting, cross-match × 4 units</li>
  <li>IV fluids: Ringer's Lactate 1L bolus stat; transfuse early</li>
  <li>Empty bladder — Foley catheter</li>
</ol>

<h3>Uterotonic Drugs (Stepwise)</h3>
<ol>
  <li><strong>Oxytocin</strong> 10 IU IM or 20–40 IU in 1L N/S infusion (FIRST LINE)</li>
  <li><strong>Ergometrine</strong> 0.2 mg IM (avoid in hypertension)</li>
  <li><strong>Misoprostol</strong> 800 mcg PR / sublingual if IV not available</li>
  <li><strong>Tranexamic acid</strong> 1g IV over 10 min within 3h of delivery (always give)</li>
  <li><strong>Carboprost</strong> 0.25 mg IM Q15min (max 8 doses) — avoid in asthma</li>
</ol>

<h3>Surgical Options (If Medical Fails)</h3>
<ul>
  <li>Intrauterine balloon tamponade (Bakri balloon / condom catheter)</li>
  <li>B-Lynch suture (uterine compression suture)</li>
  <li>Uterine artery ligation</li>
  <li>Subtotal/total hysterectomy (life-saving)</li>
</ul>
    `,
  },

  // ─── PHARMACY ───────────────────────────────────────────────────────────────
  {
    id: 'antibiotic-stewardship',
    title: 'Antibiotic Stewardship Guidelines',
    dept: 'pharmacy',
    category: 'Antimicrobials',
    content: `
<h2>Antibiotic Stewardship — Prescribing Guidelines</h2>

<h3>Core Principles</h3>
<ol>
  <li><strong>Culture before antibiotics</strong> — when clinically feasible</li>
  <li><strong>Right drug, dose, duration, route</strong></li>
  <li><strong>De-escalate</strong> as soon as cultures and sensitivities available</li>
  <li><strong>IV to oral switch</strong> as soon as patient can tolerate (usually 48–72h)</li>
  <li><strong>Stop date</strong> — document intended duration at time of prescribing</li>
</ol>

<h3>Empiric Antibiotic Guide (Common Infections)</h3>
<table>
  <tr><th>Infection</th><th>First-line</th><th>Duration</th><th>Alternative</th></tr>
  <tr><td>CAP (mild)</td><td>Amoxicillin 500mg TDS</td><td>5 days</td><td>Azithromycin 500mg OD × 3d</td></tr>
  <tr><td>CAP (moderate)</td><td>Amoxicillin-Clavulanate 1.2g IV TDS</td><td>7 days</td><td>Ceftriaxone 1g IV OD</td></tr>
  <tr><td>UTI (uncomplicated)</td><td>Nitrofurantoin 100mg BD × 5d or Cotrimoxazole 960mg BD × 3d</td><td>3–5 days</td><td>Ciprofloxacin 500mg BD × 3d</td></tr>
  <tr><td>UTI (complicated)</td><td>Ciprofloxacin 500mg BD</td><td>7–10 days</td><td>Ceftriaxone 1g IV OD</td></tr>
  <tr><td>Skin/soft tissue (mild)</td><td>Flucloxacillin 500mg QDS</td><td>5–7 days</td><td>Clindamycin 300mg TDS</td></tr>
  <tr><td>Skin/soft tissue (moderate)</td><td>Cloxacillin 1g IV QDS</td><td>7 days</td><td>Ceftriaxone + Clindamycin</td></tr>
  <tr><td>Sepsis (unknown source)</td><td>Ceftriaxone 2g IV OD + Metronidazole 500mg IV TDS</td><td>Until de-escalation</td><td>+Gentamicin if severe</td></tr>
  <tr><td>Surgical prophylaxis</td><td>Cefazolin 1g IV at induction</td><td>Single dose</td><td>Metronidazole for bowel</td></tr>
</table>

<h3>IV to Oral Switch Criteria</h3>
<ul>
  <li>Clinically improving (afebrile 24h, WBC normalising)</li>
  <li>Able to swallow and absorb oral medications</li>
  <li>No conditions preventing oral absorption</li>
  <li>Suitable oral formulation available</li>
  <li>IV Ceftriaxone → Oral Amoxicillin-Clavulanate or Ciprofloxacin</li>
</ul>

<h3>High-Alert Medications</h3>
<ul>
  <li><strong>Aminoglycosides (Gentamicin):</strong> Monitor renal function daily; draw peak/trough levels; avoid in renal failure</li>
  <li><strong>Vancomycin:</strong> Trough monitoring Q2 doses; nephrotoxic + ototoxic</li>
  <li><strong>Metronidazole:</strong> Avoid alcohol; avoid &gt;10 days (peripheral neuropathy)</li>
  <li><strong>Fluoroquinolones:</strong> Avoid in children &lt;18, pregnancy, tendinopathy risk</li>
</ul>
    `,
  },
];

// ── Print protocol ─────────────────────────────────────────────────────────────

function printProtocol(p: Protocol) {
  const deptLabel = DEPTS.find((d) => d.id === p.dept)?.label ?? p.dept;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${p.title}</title><style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#000;margin:24px;max-width:900px}
    h1{font-size:16px;color:#003087;border-bottom:2px solid #003087;padding-bottom:6px;margin-bottom:4px}
    h2{font-size:14px;color:#003087;margin-top:16px;margin-bottom:6px;border-left:4px solid #003087;padding-left:8px}
    h3{font-size:12px;color:#1a3a6b;margin-top:12px;margin-bottom:4px}
    p{margin:4px 0}
    ul,ol{margin:4px 0;padding-left:20px}
    li{margin:2px 0}
    table{width:100%;border-collapse:collapse;margin:6px 0}
    th{background:#e8efff;border:1px solid #aab;padding:4px 8px;text-align:left;font-size:11px}
    td{border:1px solid #ccc;padding:4px 8px;font-size:11px}
    .meta{font-size:10px;color:#666;margin-bottom:12px}
    .footer{margin-top:20px;border-top:1px solid #ccc;padding-top:8px;font-size:10px;color:#666;display:flex;justify-content:space-between}
    @media print{body{margin:15px}button{display:none}}
  </style></head><body>
    <h1>${p.title}</h1>
    <div class="meta">Department: ${deptLabel} &nbsp;|&nbsp; Category: ${p.category} &nbsp;|&nbsp; MedRise Medical Centre</div>
    ${p.content}
    <div class="footer">
      <span>MedRise Medical Centre — Clinical Protocol</span>
      <span>Printed: ${new Date().toLocaleString()}</span>
      <span>CONFIDENTIAL — Staff Use Only</span>
    </div>
    <script>window.print();window.close();</script>
  </body></html>`);
  w.document.close();
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

export default function ProtocolsTab() {
  const [dept, setDept] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Protocol | null>(null);

  const filtered = PROTOCOLS.filter((p) => {
    const matchesDept = dept === 'all' || p.dept === dept;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  if (selected) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#003087]">{selected.title}</h2>
            <p className="text-xs text-gray-500">
              {DEPTS.find((d) => d.id === selected.dept)?.label} • {selected.category}
            </p>
          </div>
          <Button
            className="bg-[#003087] hover:bg-[#002060] gap-2"
            onClick={() => printProtocol(selected)}
          >
            <Printer className="w-4 h-4" /> Print / Download PDF
          </Button>
        </div>
        <Card className="p-6">
          <div
            className="prose prose-sm max-w-none"
            style={{ fontSize: '13px', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{
              __html: selected.content
                .replace(
                  /<h2>/g,
                  '<h2 style="color:#003087;font-size:16px;font-weight:bold;border-bottom:2px solid #003087;padding-bottom:4px;margin-top:16px">',
                )
                .replace(
                  /<h3>/g,
                  '<h3 style="color:#1a3a6b;font-size:13px;font-weight:bold;margin-top:14px;border-left:4px solid #003087;padding-left:8px">',
                )
                .replace(
                  /<table>/g,
                  '<table style="width:100%;border-collapse:collapse;margin:8px 0">',
                )
                .replace(
                  /<th>/g,
                  '<th style="background:#e8efff;border:1px solid #aab;padding:6px 10px;text-align:left;font-size:12px">',
                )
                .replace(
                  /<td>/g,
                  '<td style="border:1px solid #ddd;padding:6px 10px;font-size:12px">',
                ),
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#003087] flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Clinical Protocols & Guidelines
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Evidence-based treatment protocols — printable as PDF for each department
        </p>
      </div>

      {/* Department filters */}
      <div className="flex flex-wrap gap-2">
        {DEPTS.map((d) => {
          const Icon = d.icon;
          const count =
            d.id === 'all' ? PROTOCOLS.length : PROTOCOLS.filter((p) => p.dept === d.id).length;
          return (
            <button
              key={d.id}
              onClick={() => setDept(d.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${dept === d.id ? 'bg-[#003087] text-white border-[#003087]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#003087] hover:text-[#003087]'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {d.label}
              <span
                className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${dept === d.id ? 'bg-white/20' : 'bg-gray-100'}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search protocols…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((p) => {
          const deptInfo = DEPTS.find((d) => d.id === p.dept);
          const Icon = deptInfo?.icon ?? BookOpen;
          return (
            <Card
              key={p.id}
              className="p-4 cursor-pointer hover:shadow-md hover:border-[#003087]/30 transition-all group"
              onClick={() => setSelected(p)}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#003087]/20 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-[#003087]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#003087] group-hover:underline">
                    {p.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{deptInfo?.label}</p>
                  <Badge className="mt-1.5 bg-gray-50 text-gray-600 border border-gray-200 text-xs">
                    {p.category}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    printProtocol(p);
                  }}
                >
                  <Printer className="w-3 h-3" /> Print
                </Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No protocols found for this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
