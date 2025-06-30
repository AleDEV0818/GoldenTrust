import { pool } from "../config/dbConfig.js";

// ==================== UTILIDADES DE FECHA ====================
const getExpiredMonthEndDate = (monthOffset = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthOffset + 1, 0);
  return date.toISOString().split('T')[0];
};

const getExpiredLast12Months = (locale = "en-US") => {
  const now = new Date();
  return Array.from({ length: 12 }).map((_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: i,
      label: date.toLocaleString(locale, { month: "long", year: "numeric" })
    };
  });
};

// ==================== CONTROLADORES PRINCIPALES ====================

// Obtener pólizas expiradas no renovadas
export const getExpiredPolicies = async (req, res) => {
  try {
    const locationId = req.user?.location_id;
    if (!locationId) {
      return res.status(400).json({ 
        error: "Usuario sin ubicación definida. Contacte al administrador." 
      });
    }

    const monthOffset = Number(req.body.month) || 0;
    const cutoffDate = getExpiredMonthEndDate(monthOffset);

    const result = await pool.query(
      `SELECT 
        policy_id,
        policy_number,
        customer,
        phone,
        exp_date,
        premium::NUMERIC,
        carrier,
        line,
        csr
      FROM intranet.renewals_lost_front($1, $2)
      ORDER BY exp_date DESC`,
      [cutoffDate, locationId]
    );
    
    res.json({ expiredPolicies: result.rows });
  } catch (error) {
    console.error('Error obteniendo pólizas expiradas:', error);
    res.status(500).json({
      error: "Error en el servidor",
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Contacte al soporte técnico'
    });
  }
};

// Obtener KPIs de renovaciones perdidas (CORREGIDO)
export const getLostRenewalKPIs = async (req, res) => {
  try {
    const locationId = req.user?.location_id;
    if (!locationId) {
      return res.status(400).json({ 
        error: "Usuario sin ubicación definida. Contacte al administrador." 
      });
    }

    const monthOffset = parseInt(req.body.month) || 0;
    // CORRECCIÓN: Siempre usar la misma función para obtener la fecha
    const targetDate = getExpiredMonthEndDate(monthOffset);

    // Obtener totales generales
    const totalsQuery = await pool.query(
      `SELECT 
        COALESCE(premium::NUMERIC, 0) AS total_premium, 
        COALESCE(policies, 0) AS total_policies
       FROM intranet.renewals_lost_totals($1, $2)`,
      [targetDate, locationId]
    );
    
    // Obtener desglose por línea
    const linesQuery = await pool.query(
      `SELECT 
        CASE 
          WHEN line ILIKE 'commercial%' THEN 'Commercial'
          WHEN line ILIKE 'homeowner%' OR line ILIKE 'home owner%' THEN 'Homeowner'
          ELSE 'Other'
        END AS normalized_line,
        SUM(COALESCE(premium::NUMERIC, 0)) AS premium,
        SUM(COALESCE(policies, 0)) AS policies
       FROM intranet.expired_not_renewals_totals($1, $2)
       GROUP BY normalized_line`,
      [targetDate, locationId]
    );
    
    const totals = totalsQuery.rows[0] || { total_premium: 0, total_policies: 0 };
    const lines = linesQuery.rows;
    
    // Inicializar con valores por defecto
    const lineData = {
      lostOther: { policies: 0, premium: 0 },
      lostCommercial: { policies: 0, premium: 0 },
      lostHomeowner: { policies: 0, premium: 0 }
    };
    
    // Procesar resultados
    lines.forEach(item => {
      const normalizedLine = (item.normalized_line || 'Other').trim();
      const policies = parseInt(item.policies) || 0;
      const premium = parseFloat(item.premium) || 0;
      
      if (normalizedLine === 'Commercial') {
        lineData.lostCommercial.policies = policies;
        lineData.lostCommercial.premium = premium;
      } 
      else if (normalizedLine === 'Homeowner') {
        lineData.lostHomeowner.policies = policies;
        lineData.lostHomeowner.premium = premium;
      } 
      else {
        lineData.lostOther.policies = policies;
        lineData.lostOther.premium = premium;
      }
    });
    
    // CORRECCIÓN: Usar targetDate para obtener el nombre del mes
    const monthName = new Date(targetDate).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    res.json({
      lostByLine: {
        lostGeneral: { 
          policies: parseInt(totals.total_policies) || 0,
          premium: parseFloat(totals.total_premium) || 0
        },
        ...lineData
      },
      monthName
    });
  } catch (error) {
    console.error('Error obteniendo KPIs de renovaciones:', error);
    res.status(500).json({
      error: "Error en el servidor",
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Contacte al soporte técnico'
    });
  }
};

// Renderizar vista principal de renovaciones
export const expiredNotRenewedView  = async (req, res) => {
  try {
    const locationId = req.user?.location_id;
    if (!locationId) {
      return res.status(400).render('error', {
        message: "Configuración de cuenta incompleta",
        details: "Su cuenta no está asociada a una ubicación. Contacte al administrador."
      });
    }

    const last12Months = getExpiredLast12Months('en-US');
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    // Datos iniciales para KPIs
    const initialKPIs = {
      lostGeneral: { policies: 0, premium: 0 },
      lostOther: { policies: 0, premium: 0 },
      lostCommercial: { policies: 0, premium: 0 },
      lostHomeowner: { policies: 0, premium: 0 }
    };

    res.render("agency-expired-not-renewed", {
      last4Months: last12Months,
      currentMonthOffset: 0,
      lostByLine: initialKPIs,
      kpiMonth: monthName,
      user: req.user,
      helpers: {
        formatCurrency: (value) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value || 0);
        },
        formatDate: (dateStr) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
    });

  } catch (error) {
    console.error('Error renderizando dashboard:', error);
    res.status(500).render("error", {
      message: "Error en el servidor",
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Contacte al soporte técnico'
    });
  }
};

// ==================== MANEJO CENTRALIZADO DE ERRORES ====================
export const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: "Error en la aplicación",
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

// ==================== EXPORTACIÓN ====================
export default {
  getExpiredPolicies,
  getLostRenewalKPIs,
  expiredNotRenewedView, 
  errorHandler
};