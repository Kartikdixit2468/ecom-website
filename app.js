// Jai Shree Ram
require("dotenv").config();

const express = require("express");
const exphbs = require("express-handlebars");
const handlebarsHelpers = require("handlebars-helpers")();
const main_router = require("./router/main_routes.js");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

// Some Middlewares
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));
app.use(cors());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

const handlebars = exphbs.create({
  helpers: {
    ...handlebarsHelpers,
    sliceString: function (str, start, end) {
      return str.slice(start, end);
    },
    getStringLength: function (str) {
      return str.length;
    },
    eq: function (a, b) {
      return a === b;
    },
  },
});

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");

// handlebars.registerHelper('sliceString', function (str, start, end) {
//     return str.slice(start, end);
//   });

// handlebars.registerHelper('getStringLength', function (str) {
//     return str.length;
//   });

// Seperate Router
app.use("/", main_router);

app.listen(port, () => {
  console.log(
    `Server started successfully\nRunning at http://127.0.0.1:${port}`
  );
});
