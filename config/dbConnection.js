const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.DBHOST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(
      "Database connected: ",
      connect.connection.host,
      connect.connection.name
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
mongoose.set("strictQuery", true);
module.exports = connectDb;
