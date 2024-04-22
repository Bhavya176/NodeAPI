var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var imgSchema = require("./models/imageModel");
const connectDb = require("./config/dbConnection");
var multer = require("multer");
var fs = require("fs");
var path = require("path");
app.set("view engine", "ejs");
require("dotenv").config();

connectDb();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    return cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

var upload = multer({ storage: storage });

app.get("/", (req, res) => {
  imgSchema.find({}).then((data, err) => {
    if (err) {
      console.log(err);
    }
    res.render("imagepage", { items: data });
  });
});

app.post("/", upload.single("image"), (req, res, next) => {
  console.log(req.body);
  console.log(req.file);
  // return res.redirect("/");
  var obj = {
    name: req.body.name,
    desc: req.body.desc,
    img: {
      data: fs.readFileSync(path.join("./uploads/" + req.file.filename)),
      contentType: "image/png",
    },
  };
  imgSchema.create(obj).then((err, item) => {
    if (err) {
      console.log("bhavya", err);
      return res.redirect("/");
    } else {
      // item.save();
      return res.redirect("/");
    }
  });
});

var port = process.env.PORT || "3000";
app.listen(port, (err) => {
  if (err) throw err;
  console.log("Server listening on port", port);
});
