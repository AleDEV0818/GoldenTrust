import express from "express";
import { pool } from "../config/dbConfig.js";
const router = express.Router();

router.get('/gtidirectory', async (req, res) => { 
  try {
    const result = await pool.query(`
      SELECT
        u.display_name,
        u.job_title,
        u.department,
        l.alias AS agency,
        u.business_phone,
        u.ext
      FROM entra.users u
      LEFT JOIN qq.locations l ON u.location_id = l.location_id
      WHERE u.active = true
      ORDER BY u.display_name ASC
    `);
    res.render('gti_directory', {
      users: result.rows,
      user: req.user 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching directory');
  }
});

export default router;