import { INSERT } from './symbols';
import rethinkdb from 'rethinkdb';
import rethinkdbInit from 'rethinkdb-init';
rethinkdbInit(rethinkdb);

export default class DatabaseDriver {
  constructor(options = {}) {
    this.config = options.config;
    this.tableConfig = options.tableConfig;
    this.sessionTable = options.sessionTable || 'sessions';
    this.userTable = options.userTable || 'users';
  }

  init() {
    return rethinkdb.init(this.config, this.tableConfig)
      .then((connection) => {
        this.connection = connection;
        this.connection.use(this.config.db);
      });
  }

  [INSERT](options = {}) {
    const table = options.table;
    const data = options.data;
    return new Promise((resolve, reject) => {
      rethinkdb.table(table)
        .insert(data)
        .run(this.connection, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
    });
  }

  storeToken(data) {
    return this[INSERT]({ table: this.sessionTable, data });
  }

  deleteToken(options = {}) {
    const userId = options.userId;
    const refreshToken = options.refreshToken;
    return new Promise((resolve, reject) => {
      rethinkdb.table(this.sessionTable)
        .filter({ userId, refreshToken })
        .delete()
        .run(this.connection, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
    });
  }

  userExists(options = {}) {
    const userId = options.userId;
    return new Promise((resolve, reject) => {
      rethinkdb.table(this.userTable)
        .get(userId)
        .run(this.connection, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result !== null);
          }
        });
    });
  }

  tokenExists(options = {}) {
    const userId = options.userId;
    const refreshToken = options.refreshToken;
    return new Promise((resolve, reject) => {
      rethinkdb.table(this.sessionTable)
        .filter({ userId, refreshToken })
        .count()
        .run(this.connection, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result > 0);
          }
        });
    });
  }
}
