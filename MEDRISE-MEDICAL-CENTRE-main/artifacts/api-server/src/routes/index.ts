import { Router } from 'express';

/* ===================== ROUTES IMPORTS ===================== */

import healthRouter from './health';
import appointmentsRouter from './appointments';
import labRouter from './lab';
import staffRouter from './staff';
import queueRouter from './queue';
import adminRouter from './admin';
import triageRouter from './triage';
import vitalsRouter from './vitals';
import dentalRouter from './dental';
import theatreRouter from './theatre';
import reportsRouter from './reports';
import imagingRouter from './imaging';
import billingRouter from './billing';
import pharmacyRouter from './pharmacy';
import patientsRouter from './patients';
import feedbackRouter from './feedback';
import schedulesRouter from './schedules';
import maternityRouter from './maternity';
import inpatientRouter from './inpatient';
import gynaeRouter from './gynae';
import auditLogsRouter from './auditLogs';
import attendanceRouter from './attendance';
import admissionsRouter from './admissions';
import paediatricsRouter from './paediatrics';
import loginHistoryRouter from './loginHistory';
import consultationsRouter from './consultations';
import passwordResetRouter from './passwordReset';
import notificationsRouter from './notifications';
import documentVersionsRouter from './documentVersions';

const router = Router();

/* ===================== MOUNT ROUTES ===================== */

router.use(healthRouter);
router.use(appointmentsRouter);
router.use(labRouter);
router.use(staffRouter);
router.use(queueRouter);
router.use(adminRouter);
router.use(triageRouter);
router.use(vitalsRouter);
router.use(dentalRouter);
router.use(theatreRouter);
router.use(reportsRouter);
router.use(imagingRouter);
router.use(billingRouter);
router.use(pharmacyRouter);
router.use(patientsRouter);
router.use(feedbackRouter);
router.use(schedulesRouter);
router.use(maternityRouter);
router.use(inpatientRouter);
router.use(gynaeRouter);
router.use(auditLogsRouter);
router.use(attendanceRouter);
router.use(admissionsRouter);
router.use(paediatricsRouter);
router.use(loginHistoryRouter);
router.use(consultationsRouter);
router.use(passwordResetRouter);
router.use(notificationsRouter);
router.use(documentVersionsRouter);

/* ===================== ROUTE DEBUG (SAFE) ===================== */
/* This only runs once at startup */

if (process.env.NODE_ENV !== 'production') {
  const mountedRoutes = [
    'health',
    'appointments',
    'lab',
    'staff',
    'queue',
    'admin',
    'triage',
    'vitals',
    'dental',
    'theatre',
    'reports',
    'imaging',
    'billing',
    'pharmacy',
    'patients',
    'feedback',
    'schedules',
    'maternity',
    'inpatient',
    'gynae',
    'auditLogs',
    'attendance',
    'admissions',
    'paediatrics',
    'loginHistory',
    'consultations',
    'passwordReset',
    'notifications',
    'documentVersions',
  ];

  console.log('🚀 Medrise API Routes Loaded:');
  mountedRoutes.forEach((r) => console.log(`   ✔ /api/${r}`));
}

/* ===================== EXPORT ===================== */

export default router;
