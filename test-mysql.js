const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'srv1098.hstgr.io',
      user: 'u406400049_knoos',
      password: 'Knoos7756@',
      database: 'u406400049_knoos',
      port: 3306,
      ssl: { rejectUnauthorized: false }
    });
    console.log("MySQL connection successful");
    await connection.end();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
}
test();
