import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import env from '../config/env.js';

const resolvedDbPath = path.resolve(process.cwd(), env.dbPath);
fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(resolvedDbPath);

db.run('PRAGMA foreign_keys = ON');

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve({ id: this.lastID, changes: this.changes });
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });

export const close = () =>
  new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
