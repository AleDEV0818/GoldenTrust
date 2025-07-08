-- FUNCTION: intranet.dashboard_sales_month_total_by_type_tkg(date, date)

-- DROP FUNCTION IF EXISTS intranet.dashboard_sales_month_total_by_type_tkg(date, date);

CREATE OR REPLACE FUNCTION intranet.dashboard_sales_month_total_by_type_tkg(
	start_date date,
	end_date date)
    RETURNS TABLE(business_type text, premium money, policies bigint) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
select business_type,
premium,
policies
from
(select 'New Business'  as Business_Type,
sum (premium) as premium,
count (binder_date) as policies
from qq.policies
where binder_date >= start_date and binder_date <= current_date and business_type = 'N' AND premium >= '$1.00'::money AND policy_status::text !~~ '%D%'::text AND policy_status::text !~~ '%V%'::text AND lob_id <> 34 AND lob_id <> 40
union
select 'Renewal'  as Business_Type,
sum (premium),
count (binder_date)
from qq.policies
where binder_date >= start_date and binder_date <= current_date and business_type = 'R' AND premium >= '$1.00'::money AND policy_status::text !~~ '%D%'::text AND policy_status::text !~~ '%V%'::text AND lob_id <> 34 AND lob_id <> 40
union
select 'Rewrite'  as Business_Type,
sum (premium),
count (binder_date)
from qq.policies
where binder_date >= start_date and binder_date <= current_date and business_type = 'W' AND premium >= '$1.00'::money AND policy_status::text !~~ '%D%'::text AND policy_status::text !~~ '%V%'::text AND lob_id <> 34 AND lob_id <> 40
union
select 'TOTAL'  as Business_Type, 
sum (premium),
count (binder_date)
from qq.policies
where binder_date >= start_date and binder_date <= current_date  AND premium >= '$1.00'::money AND policy_status::text !~~ '%D%'::text AND policy_status::text !~~ '%V%'::text AND lob_id <> 34 AND lob_id <> 40) a1
$BODY$;

ALTER FUNCTION intranet.dashboard_sales_month_total_by_type_tkg(date, date)
    OWNER TO postgres;
