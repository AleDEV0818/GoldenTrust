import { pool } from "../config/dbConfig.js";


function formatShortCurrency(num) {
  num = parseFloat(num) || 0;
  if (num >= 1000000) return `$${(num/1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num/1000).toFixed(1)}K`;
  return `$${Math.round(num)}`;
}

// --- Ticker generator (robusto para cualquier agencia/alias) ---
function getTickerLines(rows, isCorporate, locationAlias = "") {
  if (isCorporate) {
    // Corporativo: siempre los 4 fijos
    const order = ['Total', 'Headquarters', 'Hialeah', 'Bent Tree'];
    return order.map(alias => {
      const row = rows.find(r =>
        (r.location_name || '').trim().toLowerCase() === alias.trim().toLowerCase()
      );
      const goalKey = Object.keys(NB_GOALS).find(
        k => k.trim().toLowerCase() === alias.trim().toLowerCase()
      );
      const goal = goalKey ? NB_GOALS[goalKey] : 10000;
      const value = row ? (parseFloat(row.total_premium?.toString().replace(/[^0-9.-]+/g, "")) || 0) : 0;
      const percent = (value / goal * 100) || 0;
      return `${alias} NB ${formatShortCurrency(goal)} / ${formatShortCurrency(value)} / ${percent.toFixed(1)}%`;
    });
  } else {
    // Franquicia/sucursal: siempre 1 línea, aunque no haya datos
    let alias = (rows[0]?.location_name || locationAlias || "Sucursal").trim();
    const goalKey = Object.keys(NB_GOALS).find(
      k => k.trim().toLowerCase() === alias.trim().toLowerCase()
    );
    const goal = goalKey ? NB_GOALS[goalKey] : 10000;
    const value = rows[0]?.total_premium
      ? (parseFloat(rows[0].total_premium.toString().replace(/[^0-9.-]+/g, "")) || 0)
      : 0;
    const percent = (value / goal * 100) || 0;
    return [
      `${alias} NB ${formatShortCurrency(goal)} / ${formatShortCurrency(value)} / ${percent.toFixed(1)}%`
    ];
  }
}

// --- Utilidades ---
function formatCurrency(amount) {
  if (amount == null) return '$0.00';
  if (typeof amount === 'object' && amount !== null && 'toString' in amount) {
    amount = parseFloat(amount.toString().replace(/[^0-9.-]+/g,"")) || 0;
  }
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function getTotalRow(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { premium: 0, policies: 0 };
  }
  let row = rows.find(r =>
    (r.business_type || r.businesstype || r.type || r.location_name || '').toString().toLowerCase() === 'total'
  ) || rows[0];

  let premium = row.premium ?? row.total_premium ?? row.gross_premium ?? row.amount ?? 0;
  if (typeof premium === 'string') {
    premium = parseFloat(premium.replace(/[^0-9.-]+/g, "")) || 0;
  }
  if (typeof premium !== 'number') premium = Number(premium) || 0;

  let policies = row.policies ?? row.total_policies ?? 0;
  if (typeof policies !== 'number') policies = Number(policies) || 0;

  return {
    premium,
    policies
  };
}

// --- Safe Query ---
async function safeQuery(query, params = []) {
  try {
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error(`Query error:`, error);
    return [];
  }
}

async function getLocationType(locationId) {
  if (!locationId) return 1;
  try {
    const result = await safeQuery(
      'SELECT location_type FROM qq.locations WHERE location_id = $1',
      [locationId]
    );
    if (!result.length) return 1;
    return result[0].location_type;
  } catch (error) {
    return 1;
  }
}

// --- Producción HOY/MES agencia/corporativo ---
async function getAgencyTodayTotal(locationId, locationType) {
  let rows = [];
  if (locationType === 1) {
    rows = await safeQuery('SELECT * FROM intranet.corporate_today');
  } else {
    rows = await safeQuery(
      'SELECT * FROM intranet.dashboard_location_daily($1)',
      [locationId]
    );
  }
  return getTotalRow(rows);
}
async function getAgencyMonthTotal(locationId, locationType) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const initialDateStr = new Date(year, month, 1).toISOString().split('T')[0];
  const finalDateStr = new Date(year, month + 1, 0).toISOString().split('T')[0];
  let rows = [];
  if (locationType === 1) {
    rows = await safeQuery('SELECT * FROM intranet.corporate_month');
  } else {
    rows = await safeQuery(
      'SELECT * FROM intranet.dashboard_location_month($1, $2, $3)',
      [initialDateStr, finalDateStr, locationId]
    );
  }
  return getTotalRow(rows);
}

// --- Producción HOY/MES compañía ---
async function getCompanyTodayTotal() {
  const rows = await safeQuery('SELECT * FROM intranet.dashboard_company_today');
  return getTotalRow(rows);
}
async function getCompanyMonthTotal() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const initialDateStr = new Date(year, month, 1).toISOString().split('T')[0];
  const finalDateStr = new Date(year, month + 1, 0).toISOString().split('T')[0];
  let rows = [];
  try {
    rows = await safeQuery(
      'SELECT * FROM intranet.dashboard_sales_month_total_by_type_tkg($1, $2)',
      [initialDateStr, finalDateStr]
    );
  } catch (err) {
    rows = await safeQuery(
      'SELECT * FROM intranet.dashboard_sales_month_total_by_type($1, $2)',
      [initialDateStr, finalDateStr]
    );
  }
  return getTotalRow(rows);
}

// --- Datos Producer Detallados (por fecha y location) ---
async function getProducerRows(locationId, startDate, endDate) {
  if (!locationId) return [];
  return await safeQuery(
    'SELECT * FROM intranet.dashboard_producer_rw_location($1, $2, $3)',
    [startDate, endDate, locationId]
  );
}

// --- Datos Producer (solo totales) ---
async function getProducerDataTotals(locationId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const initialDateStr = new Date(year, month, 1).toISOString().split('T')[0];
  const finalDateStr = new Date(year, month + 1, 0).toISOString().split('T')[0];
  const todayDateStr = today.toISOString().split('T')[0];

  // Producer HOY
  const producerTodayRows = await safeQuery(
    'SELECT * FROM intranet.dashboard_producer_rw_location($1, $2, $3)', [todayDateStr, todayDateStr, locationId]
  );
  // Producer MES
  const producerMonthRows = await safeQuery(
    'SELECT * FROM intranet.dashboard_producer_rw_location($1, $2, $3)', [initialDateStr, finalDateStr, locationId]
  );

  // Totales Producer Hoy
  const producerTodayTotals = producerTodayRows.reduce((acc, curr) => {
    let premium = typeof curr.premium === 'string'
      ? parseFloat(curr.premium.replace(/[^0-9.-]+/g, "")) || 0
      : Number(curr.premium) || 0;
    let policies = Number(curr.policies) || 0;
    acc.premium += premium;
    acc.policies += policies;
    return acc;
  }, { premium: 0, policies: 0 });

  // Totales Producer Mes
  const producerMonthTotals = producerMonthRows.reduce((acc, curr) => {
    let premium = typeof curr.premium === 'string'
      ? parseFloat(curr.premium.replace(/[^0-9.-]+/g, "")) || 0
      : Number(curr.premium) || 0;
    let policies = Number(curr.policies) || 0;
    acc.premium += premium;
    acc.policies += policies;
    return acc;
  }, { premium: 0, policies: 0 });

  return {
    producerToday: {
      premium: formatCurrency(producerTodayTotals.premium),
      policies: producerTodayTotals.policies
    },
    producerMonth: {
      premium: formatCurrency(producerMonthTotals.premium),
      policies: producerMonthTotals.policies
    }
  };
}

// --- API endpoint para la cinta de noticias ---
export const getNewsTickerRenewed = async (req, res) => {
  try {
    const locationId = req.query.location_id ? parseInt(req.query.location_id) : null;
    const inputDate = req.query.date || new Date().toISOString().split('T')[0];

    let locationType = 1;
    let locationAlias = "";
    if (locationId) {
      const rows = await safeQuery('SELECT location_type, alias, location_name FROM qq.locations WHERE location_id = $1', [locationId]);
      if (rows.length) {
        locationType = rows[0].location_type;
        locationAlias = rows[0].alias || rows[0].location_name || "";
      }
    }

    const params = locationId ? [inputDate, locationId] : [inputDate, null];
    // Puedes cambiar el SP por uno especial para producers si tienes uno
    const tickerRows = await safeQuery('SELECT * FROM intranet.get_corporate_nb_sales_by_date($1, $2)', params);

    const isCorporate = locationType === 1;
    const tickerLines = getTickerLines(tickerRows, isCorporate, locationAlias);

    res.json({ tickerLines });
  } catch (error) {
    console.error('Ticker API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// --- API principal ---
export const getTelevisorDataRenewed = async (req, res) => {
  const locationId = req.query.location_id ? parseInt(req.query.location_id) : null;
  try {
    const locationType = await getLocationType(locationId);

    let locationAlias = "Corporate";
    if (locationId) {
      const rows = await safeQuery('SELECT alias, location_name FROM qq.locations WHERE location_id = $1', [locationId]);
      if (rows.length) locationAlias = rows[0].alias || rows[0].location_name || "Location";
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const initialDateStr = new Date(year, month, 1).toISOString().split('T')[0];
    const finalDateStr = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const todayDateStr = today.toISOString().split('T')[0];

    const [
      agencyToday,
      agencyMonth,
      companyToday,
      companyMonth,
      producerTotals,
      producerTodayRows,
      producerMonthRows
    ] = await Promise.all([
      getAgencyTodayTotal(locationId, locationType),
      getAgencyMonthTotal(locationId, locationType),
      getCompanyTodayTotal(),
      getCompanyMonthTotal(),
      getProducerDataTotals(locationId),
      getProducerRows(locationId, todayDateStr, todayDateStr),
      getProducerRows(locationId, initialDateStr, finalDateStr)
    ]);

    res.json({
      today: {
        location: {
          premium: formatCurrency(agencyToday.premium),
          policies: Number(agencyToday.policies) || 0
        },
        company: {
          premium: formatCurrency(companyToday.premium),
          policies: Number(companyToday.policies) || 0
        },
        producer: producerTotals.producerToday
      },
      month: {
        location: {
          premium: formatCurrency(agencyMonth.premium),
          policies: Number(agencyMonth.policies) || 0
        },
        company: {
          premium: formatCurrency(companyMonth.premium),
          policies: Number(companyMonth.policies) || 0
        },
        producer: producerTotals.producerMonth
      },
      csrToday: producerTodayRows,   // Key se mantiene por compatibilidad JS actual, puedes renombrar a producerToday
      csrMonth: producerMonthRows,
      locationAlias,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

// --- Render EJS ---
export const televisorTotalsRenewed = async (req, res) => {
  const monthlyGoal = 10000000;
  const monthlyGoalFormatted = formatCurrency(monthlyGoal);
  res.render('televisorTotalsRenewed', {
    locationAlias: "Corporate",
    monthlyGoalFormatted,
    monthlyGoal,
    currentDate: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    currentTime: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    refreshInterval: 600000
  });
};
