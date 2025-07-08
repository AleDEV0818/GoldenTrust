-- FUNCTION: intranet.get_corporate_nb_sales_by_date(date, integer)

-- DROP FUNCTION IF EXISTS intranet.get_corporate_nb_sales_by_date(date, integer);

CREATE OR REPLACE FUNCTION intranet.get_corporate_nb_sales_by_date(
	input_date date DEFAULT CURRENT_DATE,
	location_id_param integer DEFAULT NULL::integer)
    RETURNS TABLE(sales_date date, location_name character varying, total_premium money) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    v_location_type integer;
    v_location_alias varchar;
BEGIN
    -- Obtener el tipo y alias del location_id_param
    SELECT loc.location_type, loc.alias
      INTO v_location_type, v_location_alias
      FROM qq.locations loc
     WHERE loc.location_id = location_id_param;

    IF v_location_type = 1 THEN
        -- CORPORATIVO: mostrar solo los 3 alias corporativos Y el total
        RETURN QUERY
        SELECT 
            input_date AS sales_date,
            loc.alias::VARCHAR AS location_name,
            COALESCE(SUM(p.premium), '$0.00'::MONEY) AS total_premium
        FROM qq.policies p
        JOIN qq.contacts c ON p.customer_id = c.entity_id
        JOIN qq.locations loc ON c.location_id = loc.location_id
        WHERE
            p.business_type = 'N'
            AND p.policy_status = 'A'
            AND p.premium > '$1.00'::money
            AND p.binder_date::DATE = input_date
            AND loc.alias IN ('Bent Tree', 'Headquarters', 'Hialeah')
        GROUP BY loc.alias

        UNION ALL

        SELECT 
            input_date AS sales_date,
            'Total'::VARCHAR AS location_name,
            COALESCE(SUM(p.premium), '$0.00'::MONEY) AS total_premium
        FROM qq.policies p
        JOIN qq.contacts c ON p.customer_id = c.entity_id
        JOIN qq.locations loc ON c.location_id = loc.location_id
        WHERE
            p.business_type = 'N'
            AND p.policy_status = 'A'
            AND p.premium > '$1.00'::money
            AND p.binder_date::DATE = input_date
            AND loc.alias IN ('Bent Tree', 'Headquarters', 'Hialeah');

    ELSE
        -- FRANQUICIA: mostrar solo el location/alias de ese location_id_param
        RETURN QUERY
        SELECT
            input_date AS sales_date,
            loc.alias::VARCHAR AS location_name,
            COALESCE(SUM(p.premium), '$0.00'::MONEY) AS total_premium
        FROM qq.policies p
        JOIN qq.contacts c ON p.customer_id = c.entity_id
        JOIN qq.locations loc ON c.location_id = loc.location_id
        WHERE
            p.business_type = 'N'
            AND p.policy_status = 'A'
            AND p.premium > '$1.00'::money
            AND p.binder_date::DATE = input_date
            AND loc.location_id = location_id_param
        GROUP BY loc.alias;
    END IF;
END;
$BODY$;

ALTER FUNCTION intranet.get_corporate_nb_sales_by_date(date, integer)
    OWNER TO postgres;
