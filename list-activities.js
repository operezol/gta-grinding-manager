const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./activities.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
});

const query = `
  SELECT 
    at.id,
    at.name,
    COUNT(ar.id) as total_runs,
    AVG(ar.duration) as avg_duration,
    AVG(ar.money) as avg_money,
    SUM(ar.money) as total_money,
    CASE 
      WHEN AVG(ar.duration) > 0 THEN (AVG(ar.money) / AVG(ar.duration)) * 60
      ELSE 0
    END as money_per_hour
  FROM activity_types at
  LEFT JOIN activity_runs ar ON at.id = ar.activity_type_id
  GROUP BY at.id, at.name
  ORDER BY money_per_hour DESC
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    db.close();
    return;
  }

  console.log('\n=== LISTADO DE ACTIVIDADES ===\n');
  
  if (rows.length === 0) {
    console.log('No hay actividades registradas aún.\n');
  } else {
    rows.forEach((row, index) => {
      const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      console.log(`${rank} ${row.name}`);
      console.log(`   Total Runs: ${row.total_runs}`);
      if (row.total_runs > 0) {
        console.log(`   Avg Duration: ${row.avg_duration.toFixed(1)} min`);
        console.log(`   Avg Money: $${Math.round(row.avg_money).toLocaleString()}`);
        console.log(`   Money/Hour: $${Math.round(row.money_per_hour).toLocaleString()}/h`);
        console.log(`   Total Earned: $${Math.round(row.total_money).toLocaleString()}`);
      } else {
        console.log(`   (Sin runs registrados)`);
      }
      console.log('');
    });
  }

  db.close();
});
