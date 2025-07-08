-- FUNCTION: intranet.dashboard_producer_rw_location(date, date, integer)

-- DROP FUNCTION IF EXISTS intranet.dashboard_producer_rw_location(date, date, integer);

CREATE OR REPLACE FUNCTION intranet.dashboard_producer_rw_location(
	start_date date,
	end_date date,
	id_loc integer)
    RETURNS TABLE(producer_id integer, producer character varying, policies numeric, premium money) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
WITH
policy_producers AS (
    SELECT
        p.policy_id,
        unnest(p.producer_ids) AS producer_id,
        p.business_type,
        p.lob_id,
        p.policy_status,
        p.binder_date,
        p.premium,
        c.location_id AS customer_location_id
    FROM qq.policies p
    INNER JOIN qq.contacts c ON p.customer_id = c.entity_id
    WHERE p.binder_date >= start_date
      AND p.binder_date <= end_date
      AND c.location_id = id_loc
      AND p.premium > '$1.00'
      AND (p.policy_status = 'A' OR p.policy_status = 'C')
      AND p.lob_id <> 34 AND p.lob_id <> 40
),
renewed_producers AS (
    SELECT
        c.entity_id AS producer_id
    FROM qq.contacts c
    JOIN entra.users u ON c.display_name = u.display_name
    WHERE u.department = 'Renewed'
),
renewed_policies AS (
    SELECT
        pp.producer_id,
        pp.premium,
        pp.policy_id
    FROM policy_producers pp
    WHERE pp.producer_id IN (SELECT producer_id FROM renewed_producers)
      AND pp.business_type IN ('N','R','W')
),
rw_policies AS (
    SELECT
        pp.producer_id,
        pp.premium,
        pp.policy_id
    FROM policy_producers pp
    WHERE pp.producer_id NOT IN (SELECT producer_id FROM renewed_producers)
      AND pp.business_type IN ('R','W')
)
SELECT
    pp.producer_id,
    c.display_name AS producer,
    COUNT(*) AS policies,
    SUM(pp.premium) AS premium
FROM (
    SELECT * FROM renewed_policies
    UNION ALL
    SELECT * FROM rw_policies
) pp
JOIN qq.contacts c ON c.entity_id = pp.producer_id
GROUP BY pp.producer_id, c.display_name
ORDER BY SUM(pp.premium) DESC
$BODY$;

ALTER FUNCTION intranet.dashboard_producer_rw_location(date, date, integer)
    OWNER TO postgres;
