const { Client } = require('pg');
require('dotenv').config();
const { hash, compare } = require('bcryptjs');
const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function main() {
  await client.connect();

  // Get all users
  const users = await client.query('SELECT u.username, u.email, u."isActive", u."roleId" FROM users u');
  console.log('=== USERS ===');
  console.log(JSON.stringify(users.rows, null, 2));

  // Get reader specifically with password hash
  const reader = await client.query('SELECT u.username, u.email, u."isActive", u."passwordHash", u."roleId" FROM users u WHERE u.username = $1', ['reader']);
  const r = reader.rows[0];
  if (r) {
    console.log('\n=== READER DETAIL ===');
    console.log('username:', r.username);
    console.log('email:', r.email);
    console.log('role:', r.role);
    console.log('isActive:', r.isActive);
    console.log('passwordHash (first 50):', r.passwordHash ? r.passwordHash.substring(0, 50) : 'NULL');

    // Try testing password '123456'
    try {
      const valid = await compare('123456', r.passwordHash);
      console.log('Password 123456 valid?', valid);
    } catch(e) {
      console.log('bcrypt error:', e.message);
    }
  }

  // Check if librarian exists
  const lib = await client.query('SELECT username, email, role, "isActive" FROM users u WHERE u.username = $1', ['librarian']);
  if (lib.rows[0]) console.log('\nLIBRARIAN:', JSON.stringify(lib.rows[0]));

  // Check admin
  const adm = await client.query('SELECT username, email, role, "isActive" FROM users u WHERE u.username = $1', ['admin']);
  if (adm.rows[0]) console.log('ADMIN:', JSON.stringify(adm.rows[0]));

  await client.end();
}
main().catch(e => { console.error(e); process.exit(1); });
