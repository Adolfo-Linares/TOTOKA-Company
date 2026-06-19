const { randomBytes, timingSafeEqual, scrypt: scryptCallback } = require('crypto');
const { promisify } = require('util');
const { Pool } = require('pg');

const scrypt = promisify(scryptCallback);
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

let pool;

function getPool(){
  if(!connectionString){
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  if(!pool){
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }

  return pool;
}

async function ensureUsersTable(){
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    )
  `);
}

function normalizeEmail(email){
  return String(email || '').trim().toLowerCase();
}

function getDisplayName(email){
  return normalizeEmail(email).split('@')[0] || 'Usuario';
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')){
  const hash = await scrypt(String(password), salt, 64);
  return { salt, hash: hash.toString('hex') };
}

async function verifyPassword(password, savedHash, savedSalt){
  const { hash } = await hashPassword(password, savedSalt);
  const current = Buffer.from(hash, 'hex');
  const saved = Buffer.from(savedHash, 'hex');
  return current.length === saved.length && timingSafeEqual(current, saved);
}

function parseBody(req){
  if(!req.body) return {};
  if(typeof req.body === 'string'){
    try{
      return JSON.parse(req.body);
    }catch(error){
      return {};
    }
  }
  return req.body;
}

module.exports = async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, message:'Metodo no permitido.' });
  }

  const body = parseBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if(!email || !email.includes('@') || password.length < 4){
    return res.status(400).json({ ok:false, message:'Correo o contrasena no validos.' });
  }

  try{
    await ensureUsersTable();

    const existing = await getPool().query(
      'SELECT id, email, username, password_hash, password_salt FROM users WHERE email = $1',
      [email]
    );

    if(existing.rowCount === 0){
      const username = getDisplayName(email);
      const { salt, hash } = await hashPassword(password);
      const created = await getPool().query(
        `INSERT INTO users (email, username, password_hash, password_salt, last_login_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING email, username`,
        [email, username, hash, salt]
      );

      return res.status(201).json({
        ok:true,
        created:true,
        user: created.rows[0]
      });
    }

    const user = existing.rows[0];
    const validPassword = await verifyPassword(password, user.password_hash, user.password_salt);

    if(!validPassword){
      return res.status(401).json({ ok:false, message:'La contrasena no coincide con este correo.' });
    }

    await getPool().query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    return res.status(200).json({
      ok:true,
      created:false,
      user: {
        email: user.email,
        username: user.username
      }
    });
  }catch(error){
    if(error.message === 'DATABASE_NOT_CONFIGURED'){
      return res.status(500).json({
        ok:false,
        message:'Falta configurar POSTGRES_URL o DATABASE_URL en Vercel.'
      });
    }

    return res.status(500).json({ ok:false, message:'No se pudo iniciar sesion.' });
  }
};
