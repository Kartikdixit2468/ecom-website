// Jai Shree Ram

const express = require('express');
const exphbs = require('express-handlebars');
const handlebarsHelpers = require('handlebars-helpers')();
const main_router = require('./router/main_routes.js')
const path = require('path');
const port = 3000;
const app = express();

// Some Middlewares
app.use(express.static(path.join(__dirname, 'static')))

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
    }
  });

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


// handlebars.registerHelper('sliceString', function (str, start, end) {
//     return str.slice(start, end);
//   });

// handlebars.registerHelper('getStringLength', function (str) {
//     return str.length;
//   });

// Seperate Router | To handle mess 
app.use('/', main_router)


app.listen(port, () => {
    console.log(`Server started successfully\nRunning at http://127.0.0.1:${port}`)
})
