const fs = require('fs').promises;

module.exports = (pool) => {
  return fs
  //sets the file we're looking for when running setup command
    .readFile(`${__dirname}/../sql/setup.sql`, { encoding: 'utf-8' })
    .then((sql) => pool.query(sql))
    //then posts to console if it was successful
    .then(() => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Database setup complete!');
      }
    })
    //otherwise posts in console that an error occurred for X reasons
    .catch((error) => {
      const dbNotFound = error.message.match(/database "(.+)" does not exist/i);

      if (dbNotFound) {
        const [err, db] = dbNotFound;
        console.error('❌ Error: ' + err);
        console.info(
          `Try running \`createdb -U postgres ${db}\` in your terminal`
        );
      } else {
        console.error(error);
        console.error('❌ Error: ' + error.message);
      }
    });
};
