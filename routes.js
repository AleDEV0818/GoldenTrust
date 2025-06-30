import express from "express";
import {
  login,
  renderResetPassword,
  resetPassword,
  logout,
  checkAuthenticated,
  checkNotAuthenticated
} from "./controllers/auth.js";
import {
  redirect_dashboard,
  dashboard,
  dashboardLastQuarter,
  dashboardWeekReports,
  totalSalesStatistics,
  nbSalesStatistics,
  rnSalesStatistics,
  rwSalesStatistics,
  cnSalesStatistics,
  dashboardMetrics 
} from "./controllers/dash-reports.js";

import { agency, agencyDashboardMetrics } from './controllers/agencyController.js';
import {
  headcarrier,
  addHeadCarrier,
  head_carrier_list,
  addCarrier,
  deleteCarrier
} from "./controllers/config.js";
import { dataSearch } from "./controllers/search.js";
import { passwordMail } from "./controllers/mailer.js";
import passport from "passport";
import { authenticate } from "./config/passportConfig.js";
import gtiDirectoryRouter from "./controllers/gtusers.js";
import notRenewalsController from "./controllers/NotRenewalsController.js";
import renewalsController from "./controllers/renewalsController.js";
 import { 
  renderMessageCenter,
  streamVideo,
  downloadVideo 
} from "./controllers/messageController.js";


const router = express.Router();

/** MIDDLEWARE PARA VERIFICAR AUTENTICACIÓN EN RUTAS RENOVACIONES */
const renewalsAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  
  if (!req.user?.location_id) {
    return res.status(403).send("Usuario sin ubicación asignada");
  }
  
  next();
};

/** HTML REQUESTS */

// Auth and user
router.get('/login', checkAuthenticated, login);
router.post('/login', authenticate(passport));
router.post('/users/auth/send/:email', passwordMail);
router.get('/users/auth/reset-password/:email', renderResetPassword);
router.post('/users/auth/reset-password/:email', resetPassword);
router.get('/users/logout', logout);

// Dashboard
router.get('/', checkNotAuthenticated, redirect_dashboard);
router.get('/users/dashboard', checkNotAuthenticated, dashboard);
router.post('/users/dashboard/lastQuarter', checkNotAuthenticated, dashboardLastQuarter);
router.post('/users/dashboard/weekReports', checkNotAuthenticated, dashboardWeekReports);
router.post('/users/dashboard/totalSalesStatistics', checkNotAuthenticated, totalSalesStatistics);
router.post('/users/dashboard/nbSalesStatistics', checkNotAuthenticated, nbSalesStatistics);
router.post('/users/dashboard/rnSalesStatistics', checkNotAuthenticated, rnSalesStatistics);
router.post('/users/dashboard/rwSalesStatistics', checkNotAuthenticated, rwSalesStatistics);
router.post('/users/dashboard/cnSalesStatistics', checkNotAuthenticated, cnSalesStatistics);
router.get('/users/dashboard/metrics', checkNotAuthenticated, dashboardMetrics);


// Config
router.get('/users/config/headcarriers', checkNotAuthenticated, headcarrier);
router.post('/users/config/headcarrier/addHeadCarrier', checkNotAuthenticated, addHeadCarrier);
router.post('/users/config/headcarrier/list', checkNotAuthenticated, head_carrier_list);
router.post('/users/config/headcarrier/addCarrier', checkNotAuthenticated, addCarrier);
router.post('/users/config/headcarrier/deleteCarrier', checkNotAuthenticated, deleteCarrier);

// Search
router.post('/users/search', checkNotAuthenticated, dataSearch);

// GTI Directory
router.get('/gtidirectory', checkNotAuthenticated, async function(req, res) { /* implement here if needed */ });
router.use('/users', gtiDirectoryRouter);

// Agency 
router.get('/users/agency', agency);
router.get('/api/agency-dashboard-metrics', agencyDashboardMetrics); 




router.get(
  '/users/message-center/upholding-gti-standards',
  renewalsAuth,
  streamVideo
);

router.get(
  '/users/renewals/message-center',
  renewalsAuth,
  renderMessageCenter
);

router.get('/video/download', downloadVideo);

// ======= RUTAS DE RENOVACIONES PRÓXIMAS =======
router.get(
  "/users/renewals/agency-upcoming-renewals", 
  renewalsAuth, 
  renewalsController.agencyUpcomingRenewalsView
);

router.post(
  "/users/renewals/agency-upcoming-renewals/data", 
  renewalsAuth, 
  renewalsController.agencyUpcomingRenewalsData
);

// ======= RUTAS DE RENOVACIONES EXPIRADAS =======
router.get(
  '/users/renewals/agency-expired-not-renewed', 
  renewalsAuth,
  notRenewalsController.expiredNotRenewedView
);


router.post(
  '/users/renewals/agency-expired-not-renewed/data-month', 
  renewalsAuth,
  notRenewalsController.getExpiredPolicies
);


router.post(
  '/users/renewals/agency-lost-renewals-by-line-kpis', 
  renewalsAuth,
  notRenewalsController.getLostRenewalKPIs  // Así si usas el export default
);


export default router;
