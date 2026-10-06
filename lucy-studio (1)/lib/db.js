import Database from 'better-sqlite3';
const g = globalThis;
export const db = (g.__db ||= (() => {
  const d = new Database(process.env.DB_PATH || 'data.db');
  d.pragma('journal_mode=WAL');
  d.exec(`create table if not exists clients(
    id integer primary key autoincrement, username text unique not null, pass text not null,
    balance real not null default 0, revoked integer not null default 0,
    obs_token text not null, last_beat integer, created integer not null);
  create table if not exists ledger(
    id integer primary key autoincrement, client_id integer not null,
    delta real not null, reason text, at integer not null);`);
  return d;
})());
