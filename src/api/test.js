const {getAll} = require("../repositories/birthday");

module.exports = {
  execute(app) {
    app.get('/test', async (req, res) => {
      res.send({birthdays: await getAll(), test: "test"});
    });
  }
}