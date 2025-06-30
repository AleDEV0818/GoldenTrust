import { pool } from "../config/dbConfig.js";

// ---- UTILIDADES DE FECHA ----
export function getMonthStartDate(monthOffset = 0) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset, 1);
  return date;
}

export function getMonthEndDate(monthOffset = 0) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset + 1, 0);
  return date;
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

// ---- FUNCIÓN PARA CONVERTIR DINERO ----
function convertMoneyToNumber(moneyValue) {
  if (typeof moneyValue === 'number') return moneyValue;
  if (!moneyValue) return 0;
  
  if (typeof moneyValue === 'string') {
    const numericPart = moneyValue.replace(/[^\d.]/g, '');
    const numberValue = parseFloat(numericPart);
    return isNaN(numberValue) ? 0 : numberValue;
  }
  
  return 0;
}

// ---- CÁLCULO DE PORCENTAJES ----
function calculatePercentages(pr, pl, totalPolicies) {
  // Porcentaje de renovación real
  let percentRen = 0;
  if (totalPolicies > 0) {
    percentRen = (pr.policies / totalPolicies) * 100;
  }

  // Porcentaje máximo renovable
  let percentTkg = 100;
  if (totalPolicies > 0) {
    percentTkg = 100 - (pl.policies / totalPolicies) * 100;
  }

  // Redondear a 1 decimal
  return {
    percentren: Math.round(percentRen * 10) / 10,
    percenttkg: Math.round(percentTkg * 10) / 10
  };
}

// ---- SUMA PRECISA ----
function preciseMoneySum(values) {
  return values.reduce((sum, value) => {
    const numValue = convertMoneyToNumber(value);
    return parseFloat((sum + numValue).toFixed(2));
  }, 0);
}

// ---- OBTENER TOTALES DESDE BD ----
async function getDatabaseTotals(monthEnd, locationId) {
  const totalsSql = `SELECT * FROM intranet.renewals_upcoming_totals($1, $2)`;
  const totalsResult = await pool.query(totalsSql, [monthEnd, locationId]);
  return totalsResult.rows[0] || { premium: 0, policies: 0 };
}

// ---- CONTROLADOR PARA LA VISTA SSR ----
export const agencyUpcomingRenewalsView = async (req, res) => {
  try {
    const locationId = req.user?.location_id;
    if (!locationId) {
      return res.status(400).render('error', { 
        message: "Usuario sin ubicación definida", 
        error: {} 
      });
    }
    
    const monthEnd = toISODate(getMonthEndDate(0));
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Fijar a medianoche

    // 1) Obtener totales desde la base de datos
    const dbTotals = await getDatabaseTotals(monthEnd, locationId);
    
    // Convertir premium a número
    const urPremium = convertMoneyToNumber(dbTotals.premium);
    
    // 2) Obtener las pólizas individuales
    const policiesSql = `SELECT * FROM intranet.renewals_upcoming_details_front($1, $2)`;
    const policiesResult = await pool.query(policiesSql, [monthEnd, locationId]);
    const upcomingRenewals = policiesResult.rows || [];

    // 3) Calcular KPIs manualmente
    const ur = { 
      premium: urPremium,
      policies: dbTotals.policies 
    };
    
    const pr = { premium: 0, policies: 0 };
    const pl = { premium: 0, policies: 0 };
    
    // Arrays para sumas precisas
    const prPremiums = [];
    const plPremiums = [];
    
    for (const policy of upcomingRenewals) {
      const premium = convertMoneyToNumber(policy.premium);
      const expDate = new Date(policy.exp_date);
      expDate.setHours(0, 0, 0, 0); // Fijar a medianoche para comparación
      
      if (policy.renewed) {
        prPremiums.push(premium);
        pr.policies += 1;
      } else if (expDate <= todayDate) {
        plPremiums.push(premium);
        pl.policies += 1;
      }
    }

    // Calcular sumas con precisión
    pr.premium = preciseMoneySum(prPremiums);
    pl.premium = preciseMoneySum(plPremiums);

    // 4) Calcular porcentajes
    const per = calculatePercentages(pr, pl, ur.policies);

    // 5) Preparar datos para vista
    const data = {
      ur,  // Total de la agencia (dbTotals)
      pr,  // Renewed
      pl,  // Lost
      per, // Porcentajes
      upcomingRenewals: upcomingRenewals.map(policy => ({
        ...policy,
        premium: convertMoneyToNumber(policy.premium)
      })),
      nextMonths: getNextMonthsArray("en-US", 3),
      helpers: {
        formatDate: (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '',
        getInitials: (name) => {
          if (!name) return '--';
          const parts = name.trim().split(' ');
          return parts.length === 1 
            ? parts[0].substring(0, 2).toUpperCase()
            : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        },
        stringToNiceColor: (str) => {
          const avatarColors = ["#a3d8f4", "#f6c1c1", "#b9fbc0", "#ffd6a5", "#c8b6ff"];
          let hash = 0;
          for (let i = 0; i < str.length; i++) 
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          return avatarColors[Math.abs(hash) % avatarColors.length];
        },
        formatCurrency: (value) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
      }
    };

    res.render("agency-upcoming-renewals", data);

  } catch (error) {
    console.error("Error en agencyUpcomingRenewalsView:", error);
    res.status(500).render("error", { 
      message: "Error en el servidor", 
      error: { message: error.message } 
    });
  }
};

// ---- CONTROLADOR PARA EL ENDPOINT JSON ----
export const agencyUpcomingRenewalsData = async (req, res) => {
  try {
    const locationId = req.user?.location_id;
    if (!locationId) {
      return res.status(400).json({ error: "Usuario sin ubicación definida" });
    }
    
    const monthOffset = parseInt(req.body.month) || 0;
    const monthEnd = toISODate(getMonthEndDate(monthOffset));
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Fijar a medianoche

    // 1) Obtener totales desde la base de datos
    const dbTotals = await getDatabaseTotals(monthEnd, locationId);
    
    // Convertir premium a número
    const urPremium = convertMoneyToNumber(dbTotals.premium);

    // 2) Obtener las pólizas individuales
    const policiesSql = `SELECT * FROM intranet.renewals_upcoming_details_front($1, $2)`;
    const policiesResult = await pool.query(policiesSql, [monthEnd, locationId]);
    const upcomingRenewals = policiesResult.rows || [];

    // 3) Calcular KPIs manualmente
    const ur = { 
      premium: urPremium,
      policies: dbTotals.policies 
    };
    
    const pr = { premium: 0, policies: 0 };
    const pl = { premium: 0, policies: 0 };
    
    // Arrays para sumas precisas
    const prPremiums = [];
    const plPremiums = [];
    
    for (const policy of upcomingRenewals) {
      const premium = convertMoneyToNumber(policy.premium);
      const expDate = new Date(policy.exp_date);
      expDate.setHours(0, 0, 0, 0); // Fijar a medianoche para comparación
      
      if (policy.renewed) {
        prPremiums.push(premium);
        pr.policies += 1;
      } else if (expDate <= todayDate) {
        plPremiums.push(premium);
        pl.policies += 1;
      }
    }

    // Calcular sumas con precisión
    pr.premium = preciseMoneySum(prPremiums);
    pl.premium = preciseMoneySum(plPremiums);

    // 4) Calcular porcentajes
    const per = calculatePercentages(pr, pl, ur.policies);

    res.json({
      ur,
      pr,
      pl,
      per,
      upcomingRenewals: upcomingRenewals.map(policy => ({
        ...policy,
        premium: convertMoneyToNumber(policy.premium)
      }))
    });

  } catch (error) {
    console.error("Error en agencyUpcomingRenewalsData:", error);
    res.status(500).json({ 
      error: "Error en el servidor",
      details: error.message
    });
  }
};

// ---- FUNCIONES AUXILIARES ----
export function getNextMonthsArray(locale = "en-US", count = 3) {
  return Array.from({ length: count }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i + 1);
    return date.toLocaleString(locale, { month: "short", year: "numeric" });
  });
}

export default {
  getMonthStartDate,
  getMonthEndDate,
  getNextMonthsArray,
  agencyUpcomingRenewalsView,
  agencyUpcomingRenewalsData
};