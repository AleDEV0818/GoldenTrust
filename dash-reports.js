import {pool} from "../config/dbConfig.js";
import fs from 'fs';

const redirect_dashboard = (req, res) => {
    res.redirect('/users/dashboard')
}

const dashboard = async (req, res) => {

    let data = {}, production, agency, result;
    const date = new Date();
    const initial_date = new Date(date.getFullYear(), date.getMonth(), 1);
    const final_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
////////////////////Production/////////////////////////////

production = req.user.location_type != 1
? (await pool.query(`SELECT * FROM intranet.dashboard_location_daily($1)`, [req.user.location_id])).rows 
: (await pool.query(`SELECT * FROM intranet.dashboard_company_today`)).rows

data.agency = req.user.location_type != 1 ? req.user.location_alias : 'Company';

// SOLUCIÓN: Agregar verificaciones seguras en todas las propiedades
data.ct_nb_prem = production[0]?.premium ? production[0].premium.substring(0, production[0].premium.length - 3) : '$0';
data.ct_nb_pol = production[0]?.policies || 0;
data.ct_rn_prem = production[1]?.premium ? production[1].premium.substring(0, production[1].premium.length - 3) : '$0';
data.ct_rn_pol = production[1]?.policies || 0;
data.ct_rw_prem = production[2]?.premium ? production[2].premium.substring(0, production[2].premium.length - 3) : '$0';
data.ct_rw_pol = production[2]?.policies || 0;
data.ct_tot_prem = production[3]?.premium ? production[3].premium.substring(0, production[3].premium.length - 3) : '$0';
data.ct_tot_pol = production[3]?.policies || 0;

production = req.user.location_type != 1 
? (await pool.query(`SELECT * FROM intranet.dashboard_location_month($1, $2, $3)`, [initial_date, final_date, req.user.location_id])).rows
: (await pool.query(`SELECT * FROM intranet.dashboard_sales_month_total_by_type_tkg($1, $2)`, [initial_date, final_date])).rows

data.cm_nb_prem = production[0]?.premium ? production[0].premium.substring(0, production[0].premium.length - 3) : '$0.00';
data.cm_nb_pol = production[0]?.policies || 0;
data.cm_rn_prem = production[1]?.premium ? production[1].premium.substring(0, production[1].premium.length - 3) : '$0.00';
data.cm_rn_pol = production[1]?.policies || 0;
data.cm_rw_prem = production[2]?.premium ? production[2].premium.substring(0, production[2].premium.length - 3) : '$0.00';
data.cm_rw_pol = production[2]?.policies || 0;
data.cm_tot_prem = production[3]?.premium ? production[3].premium.substring(0, production[3].premium.length - 3) : '$0.00';
data.cm_tot_pol = production[3]?.policies || 0;

production = req.user.location_type != 1
? (await pool.query(`SELECT * FROM intranet.dashboard_location_year($1)`, [req.user.location_id])).rows
: (await pool.query(`SELECT * FROM intranet.dashboard_company_year`)).rows

data.cy_nb_prem = production[0]?.premium ? production[0].premium.substring(0, production[0].premium.length - 3) : '$0.00';
data.cy_nb_pol = production[0]?.policies || 0;
data.cy_rn_prem = production[1]?.premium ? production[1].premium.substring(0, production[1].premium.length - 3) : '$0.00';
data.cy_rn_pol = production[1]?.policies || 0;
data.cy_rw_prem = production[2]?.premium ? production[2].premium.substring(0, production[2].premium.length - 3) : '$0.00';
data.cy_rw_pol = production[2]?.policies || 0;
data.cy_tot_prem = production[3]?.premium ? production[3].premium.substring(0, production[3].premium.length - 3) : '$0.00';
data.cy_tot_pol = production[3]?.policies || 0;

data.ck_nb_prem = production[0]?.premiumtkg ? production[0].premiumtkg.substring(0, production[0].premiumtkg.length - 3) : '$0.00';
data.ck_nb_pol = production[0]?.policiestkg || 0;
data.ck_rn_prem = production[1]?.premiumtkg ? production[1].premiumtkg.substring(0, production[1].premiumtkg.length - 3) : '$0.00';
data.ck_rn_pol = production[1]?.policiestkg || 0;
data.ck_rw_prem = production[2]?.premiumtkg ? production[2].premiumtkg.substring(0, production[2].premiumtkg.length - 3) : '$0.00';
data.ck_rw_pol = production[2]?.policiestkg || 0;
data.ck_tot_prem = production[3]?.premiumtkg ? production[3].premiumtkg.substring(0, production[3].premiumtkg.length - 3) : '$0.00';
data.ck_tot_pol = production[3]?.policiestkg || 0;


//////////////////// CSR Ranking //////////////////////////////////


  result = await pool.query(`SELECT * FROM intranet.dashboard_csr_nb_location(DATE($1),DATE($2),ARRAY[CAST($3 AS INTEGER)])`, [initial_date, final_date, req.user.location_id]);

  data.csr_nb_ranking = result.rows;
  let inicial1, inicial2, state, states;

  for(let i = 0; i<data.csr_nb_ranking.length; i++){
    try {
        if(fs.accessSync('./assets/img/avatars/users/' + data.csr_nb_ranking[i].csr_id + '.png')){
            data.csr_nb_ranking[i].avatar = '' + data.csr_nb_ranking[i].csr_id + '.png';
        }
        data.csr_nb_ranking[i].avatar = '' + data.csr_nb_ranking[i].csr_id + '.png';
        }catch (e) {
            data.csr_nb_ranking[i].avatar = '';
            const state = 'primary';
            const aux = data.csr_nb_ranking[i]?.csr?.trim() || '';
            inicial1 = aux.substring(0,1);
            inicial2 = (aux.substring(aux.indexOf(' '), aux.length)).trim();
            inicial2 = inicial2.substring(0,1);
            data.csr_nb_ranking[i].output = '<span class="avatar-initial rounded-circle bg-label-' + state + '">' + inicial1 + inicial2 + '</span>';
        }
        const p = data.csr_nb_ranking[i]?.premium?.toString() || '0';
        data.csr_nb_ranking[i].premium = p.substring(0, p.length - 3);
}
    
//////////////////// Render //////////////////////////////////
  data.user = req.user;
  res.render("dashboard", data);
};

const dashboardLastQuarter = async (req, res)=>{
    
    let array = {}, x, lquarter, quarter, aux1, aux2, aux3, porC
    const result = !req.user || req.user.location_type == 1 
      ? await pool.query(`SELECT * FROM intranet.dashboard_sales_nb_last_quarter`) 
      : await pool.query(`SELECT * FROM intranet.dashboard_nb_last_quarter($1)`,[req.user.location_id]);
    /// Last Quarter Premium

    // SOLUCIÓN: Agregar verificaciones seguras
    aux1 = result.rows[5]?.premnb || '$0.00';
    aux2 = result.rows[4]?.premnb || '$0.00';
    aux3 = result.rows[3]?.premnb || '$0.00';
    array.lastQuarterPremByMonth = [Number(aux3.replace(/[^0-9\.]+/g,"")), Number(aux2.replace(/[^0-9\.]+/g,"")), Number(aux1.replace(/[^0-9\.]+/g,""))];
    lquarter = Number(aux3.replace(/[^0-9\.]+/g,"")) + Number(aux2.replace(/[^0-9\.]+/g,"")) + Number(aux1.replace(/[^0-9\.]+/g,""))
    quarter = lquarter.toFixed(0)
    quarter = quarter.substring(0, quarter.length - 3);
    aux1 = result.rows[2]?.premnb || '$0.00';
    aux2 = result.rows[1]?.premnb || '$0.00';
    aux3 = result.rows[0]?.premnb || '$0.00';
    porC = 100*lquarter/(Number(aux1.replace(/[^0-9\.]+/g,"")) + Number(aux2.replace(/[^0-9\.]+/g,"")) + Number(aux3.replace(/[^0-9\.]+/g,"")))
    x = (Number(quarter.replace(/[^0-9\.]+/g,""))).toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
    x = x.replace(pattern, "$1,$2");
    array.lastQuarter = x;
    array.porC = (porC - 100).toFixed(1)*1;

    /// Last Quarter Policies
    aux1 = result.rows[5]?.polnb || 0;
    aux2 = result.rows[4]?.polnb || 0;
    aux3 = result.rows[3]?.polnb || 0;
    array.lastQuarterPolByMonth = [Number(aux3), Number(aux2), Number(aux1)];
    lquarter = Number(aux1) + Number(aux2) + Number(aux3);
    aux1 = result.rows[2]?.polnb || 0;
    aux2 = result.rows[1]?.polnb || 0;
    aux3 = result.rows[0]?.polnb || 0;
    porC = 100*lquarter/(Number(aux1) + Number(aux2) + Number(aux3))
    array.lastQuarterPolicies = lquarter;
    array.porCPolicies = (porC - 100).toFixed(1)*1;

    res.status(200).send(array);
}

const dashboardWeekReports = async (req, res) => {

    let array = {}, premMax =0, sumPrem = 0, sumPol = 0, aux;

   const result1 = !req.user || req.user.location_type == 1
      ? await pool.query(`SELECT * FROM intranet.dashboard_sales_nb_week`)
      : await pool.query(`SELECT * FROM intranet.dashboard_nb_week($1)`, [req.user.location_id]);
    const result2 = !req.user || req.user.location_type == 1
      ? await pool.query(`SELECT * FROM intranet.dashboard_sales_nb_last_week`)
      : await pool.query(`SELECT * FROM intranet.dashboard_nb_last_week($1)`, [req.user.location_id]);

    array.weekSales = [];
    let id_max1 = 0;
    for(let j = 0; j<7; j++){
        // SOLUCIÓN: Agregar verificación segura
        aux = result1.rows[j]?.premium || '0';
        aux = Number(aux.replace(/[^0-9\.]+/g,"")) || 0;
        sumPrem = sumPrem + aux;
        sumPol = sumPol + Number((result1.rows[j]?.policies || '0').replace(/[^0-9\.]+/g,""));
        array.weekSales.push(aux);
        if(aux>premMax){
            id_max1 = j;
            premMax = aux;
        }
    }
    
    if(sumPrem < 1000 ) {
        array.weekPrem = '$' + sumPrem.toFixed() + 'k';
    } else {
        aux = sumPrem.toFixed(0);
        aux = aux.substring(0, aux.length - 3);
        array.weekPrem = '$' + aux + 'k';
    }
    array.weekPol = '# ' + sumPol;
    array.weekPremMax = id_max1;

    array.lastWeekPol = result2.rows[0]?.lastwpol || 0;
    aux = result2.rows[0]?.lastwpre || '$0.00';
    array.lastWeekPrem = aux.substring(0, aux.length - 7);
    array.lastWeekPolPer = result2.rows[0]?.polper || 0;
    array.lastWeekPrePer = result2.rows[0]?.premper || 0;

    res.status(200).send(array);

}

const totalSalesStatistics = async (req, res) => {
    const result = !req.user || req.user.location_type == 1 
      ? await pool.query(`SELECT * FROM intranet.dashboard_sales_last_year`)
      : await pool.query(`SELECT * FROM intranet.dashboard_sales_last_year($1)`, [req.user.location_id]);
    let aux, id_max1 = 0, max1 = 0
    let array = {
        "data": [
          {
            "id": 1,
            "chart_data": [],
            "active_option": 0
          },
        ]
      }
    for (let i = 4; i<=12; i++){
        // SOLUCIÓN: Agregar verificación segura
        aux = result.rows[i]?.premium ? result.rows[i].premium : '$0.00';
        aux = aux.split(',').join('');
        aux = aux.split('$').join('');
        if(Number(aux) > max1) {id_max1 = i-4; max1 = Number(aux);}
        array.data[0].chart_data.push(Math.round(Number(aux))/1000);
    }
    array.data[0].active_option = id_max1;
    res.status(200).send(array);
    
}

const nbSalesStatistics =  async (req, res) => {
    const result = !req.user || req.user.location_type == 1 
      ? await pool.query(`SELECT * FROM intranet.dashboard_sales_last_year_nb`)
      : await pool.query(`SELECT * FROM intranet.dashboard_nb_last_year($1)`, [req.user.location_id]);
  
    let aux, id_max1 = 0, max1 = 0
    let array = {
        "data": [
          {
            "id": 2,
            "chart_data": [],
            "active_option": 0
          },
        ]
      }
    for (let i = 4; i<=12; i++){
        // SOLUCIÓN CORREGIDA: Verificación segura
        aux = result.rows[i]?.premium ? result.rows[i].premium : '$0.00';
        aux = aux.split(',').join('');
        aux = aux.split('$').join('');
        if(Number(aux) > max1) {id_max1 = i-4; max1 = Number(aux);}
        array.data[0].chart_data.push(Math.round(Number(aux))/1000);
    }
    array.data[0].active_option = id_max1;
    res.status(200).send(array);
}

const rnSalesStatistics =  async (req, res) => {
    const result = !req.user || req.user.location_type == 1 
      ? await pool.query(`SELECT * FROM intranet.dashboard_sales_last_year_rn`)
      : await pool.query(`SELECT * FROM  intranet.dashboard_rn_last_year($1)`, [req.user.location_id]);
  
    let aux, id_max1 = 0, max1 = 0
    let array = {
        "data": [
          {
            "id": 3,
            "chart_data": [],
            "active_option": 0
          },
        ]
      }
    for (let i = 4; i<=12; i++){
        // SOLUCIÓN: Agregar verificación segura
        aux = result.rows[i]?.premium ? result.rows[i].premium : '$0.00';
        aux = aux.split(',').join('');
        aux = aux.split('$').join('');
        if(Number(aux) > max1) {id_max1 = i-4; max1 = Number(aux);}
        array.data[0].chart_data.push(Math.round(Number(aux))/1000);
    }
    array.data[0].active_option = id_max1;
    res.status(200).send(array);
}

const rwSalesStatistics =  async (req, res) => {
    const result = !req.user || req.user.location_type == 1 
      ? await pool.query(`SELECT * FROM intranet.dashboard_sales_last_year_rw`)
      : await pool.query(`SELECT * FROM intranet.dashboard_rw_last_year($1)`, [req.user.location_id]);
  
    let aux, id_max1 = 0, max1 = 0
    let array = {
        "data": [
          {
            "id": 4,
            "chart_data": [],
            "active_option": 0
          },
        ]
      }
    for (let i = 4; i<=12; i++){
        // SOLUCIÓN: Agregar verificación segura
        aux = result.rows[i]?.premium ? result.rows[i].premium : '$0.00';
        aux = aux.split(',').join('');
        aux = aux.split('$').join('');
        if(Number(aux) > max1) {id_max1 = i-4; max1 = Number(aux);}
        array.data[0].chart_data.push(Math.round(Number(aux))/1000);
    }
    array.data[0].active_option = id_max1;
    res.status(200).send(array);
}

const cnSalesStatistics =  async (req, res) => {
  const result = !req.user || req.user.location_type == 1 
    ? await pool.query(`SELECT * FROM intranet.dashboard_sales_last_year_cn`)
    : await pool.query(`SELECT * FROM intranet.dashboard_cn_last_year($1)`, [req.user.location_id]);

  let aux, id_max1 = 0, max1 = 0
  let array = {
      "data": [
        {
          "id": 5,
          "chart_data": [],
          "active_option": 0
        },
      ]
    }
  for (let i = 4; i<=12; i++){
      // SOLUCIÓN: Agregar verificación segura
      aux = result.rows[i]?.premcan ? result.rows[i].premcan : '$0.00';
      aux = aux.split(',').join('');
      aux = aux.split('$').join('');
      if(Number(aux) > max1) {id_max1 = i-4; max1 = Number(aux);}
      array.data[0].chart_data.push(Math.round(Number(aux))/1000);
  }
  array.data[0].active_option = id_max1;
  res.status(200).send(array);
}


const dashboardMetrics = async (req, res) => {
    let data = {};
    const date = new Date();
    const initial_date = new Date(date.getFullYear(), date.getMonth(), 1);
    const final_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Obtener métricas para hoy
    let production = req.user.location_type != 1
        ? (await pool.query(`SELECT * FROM intranet.dashboard_location_daily($1)`, [req.user.location_id])).rows 
        : (await pool.query(`SELECT * FROM intranet.dashboard_company_today`)).rows;

    data.today = {
        nb_prem: production[0]?.premium ? production[0].premium.substring(0, production[0].premium.length - 3) : '$0',
        nb_pol: production[0]?.policies || 0,
        rn_prem: production[1]?.premium ? production[1].premium.substring(0, production[1].premium.length - 3) : '$0',
        rn_pol: production[1]?.policies || 0,
        rw_prem: production[2]?.premium ? production[2].premium.substring(0, production[2].premium.length - 3) : '$0',
        rw_pol: production[2]?.policies || 0,
        tot_prem: production[3]?.premium ? production[3].premium.substring(0, production[3].premium.length - 3) : '$0',
        tot_pol: production[3]?.policies || 0
    };

    // Obtener métricas para el mes
    production = req.user.location_type != 1 
        ? (await pool.query(`SELECT * FROM intranet.dashboard_location_month($1, $2, $3)`, [initial_date, final_date, req.user.location_id])).rows
        : (await pool.query(`SELECT * FROM intranet.dashboard_sales_month_total_by_type_tkg($1, $2)`, [initial_date, final_date])).rows;

    data.month = {
        nb_prem: production[0]?.premium ? production[0].premium.substring(0, production[0].premium.length - 3) : '$0.00',
        nb_pol: production[0]?.policies || 0,
        rn_prem: production[1]?.premium ? production[1].premium.substring(0, production[1].premium.length - 3) : '$0.00',
        rn_pol: production[1]?.policies || 0,
        rw_prem: production[2]?.premium ? production[2].premium.substring(0, production[2].premium.length - 3) : '$0.00',
        rw_pol: production[2]?.policies || 0,
        tot_prem: production[3]?.premium ? production[3].premium.substring(0, production[3].premium.length - 3) : '$0.00',
        tot_pol: production[3]?.policies || 0
    };

    // Obtener métricas para el año
    production = req.user.location_type != 1
        ? (await pool.query(`SELECT * FROM intranet.dashboard_location_year($1)`, [req.user.location_id])).rows
        : (await pool.query(`SELECT * FROM intranet.dashboard_company_year`)).rows;

    data.year = {
        nb_prem: production[0]?.premium ? production[0].premium.substring(0, production[0].premium.length - 3) : '$0.00',
        nb_pol: production[0]?.policies || 0,
        rn_prem: production[1]?.premium ? production[1].premium.substring(0, production[1].premium.length - 3) : '$0.00',
        rn_pol: production[1]?.policies || 0,
        rw_prem: production[2]?.premium ? production[2].premium.substring(0, production[2].premium.length - 3) : '$0.00',
        rw_pol: production[2]?.policies || 0,
        tot_prem: production[3]?.premium ? production[3].premium.substring(0, production[3].premium.length - 3) : '$0.00',
        tot_pol: production[3]?.policies || 0
    };

    res.json(data);
};

export { redirect_dashboard, dashboard, dashboardLastQuarter, dashboardWeekReports, totalSalesStatistics, nbSalesStatistics, rnSalesStatistics, rwSalesStatistics, cnSalesStatistics, dashboardMetrics };