require("dotenv").config();

const credentials = require("../data/credentials.js");
const express = require("express");
const Router = express.Router();
const Razorpay = require("razorpay");
const mysql = require("mysql2");
const cookies = require("cookie");
// const { itemAt } = require("handlebars-helpers/lib/array.js");

const key = process.env.RAZORPAY_ID_KEY;
const secret = process.env.RAZORPAY_SECRET_KEY;

function total_item(items) {
  let n = 0;
  items.forEach((item) => {
    n += parseInt(item.quantity);
  });
  return n;
}

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql
  .createPool({
    host: credentials["host"],
    user: credentials["user"],
    password: credentials["pass"],
    database: credentials["db"],
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  })
  .promise();

async function get_products() {
  const [rows, fields] = await pool.query("SELECT * FROM products_info");
  const raw_data = rows;
  return raw_data;
}

async function fetch_data() {
  const raw_data = await get_products();
  const data = raw_data.filter((data) => {
    if (data["size"] == 4) {
      return data;
    }
  });
  return data;
}

Router.get("/", async (req, res) => {
  let data = await fetch_data();
  res.render("home", {
    title: "Krishna Dress Store",
    notProductPage: true,
    products: data,
  });
});

Router.get("/about", (req, res) => {
  res.render("about", { title: "Krishna Dress Store", notProductPage: true });
});

Router.get("/policies", (req, res) => {
  res.send(`This is ${req.params.policy} Page.`);
});

Router.get("/collections", (req, res) => {
  res.render("collections", {
    title: "Krishna Dress Store",
    notProductPage: true,
  });
});

Router.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Krishna Dress Store | Reach Us",
    notProductPage: true,
  });
});

Router.post("/checkout", async (req, res) => {
  const raw_data = await get_products();
  const my_cookies = cookies.parse(req.headers.cookie || "");
  let cart_items = my_cookies["cart-info"];
  if (cart_items) {
    cart_items = JSON.parse(cart_items);
  } else {
    cart_items = [];
  }
  let n = total_item(cart_items);
  let mydata = JSON.parse(JSON.stringify(raw_data));
  let products = [];
  cart_items.forEach((element) => {
    mydata.filter((product) => {
      if (product.id == element.id) {
        product["quantity"] = element.quantity;
        product["total_price"] = element.quantity * product.price;
        products.push(product);
      }
    });
  });

  let total_price = 0;
  let ship_charge = 100;
  if (products.length <= 3) {
    ship_charge = 100;
  } else if (products.length > 3 && products.length <= 6) {
    ship_charge = 150;
  } else {
    ship_charge = 0;
  }
  products.forEach((element) => {
    total_price += element.total_price;
  });

  let payment_info = [ship_charge, total_price, ship_charge + total_price, n];

  res.render("checkoutpage", {
    title: "Krishna Dress Store | Reach Us",
    notProductPage: false,
    info: payment_info,
  });
});

Router.get("/shop", async (req, res) => {
  let data = await fetch_data();
  res.render("shop", {
    title: "Krishna Dress Store",
    notProductPage: true,
    products: data,
  });
});

Router.get("/track-orders", (req, res) => {
  res.render("tracking", {
    title: "Krishna Dress Store",
    notProductPage: true,
  });
});

Router.get("/product/:id", async (req, res) => {
  const raw_data = await get_products();
  const id = req.params.id;
  let product = raw_data.filter((product) => product["id"] == id);

  let differ_sizes_products = raw_data.filter((data) => {
    // console
    if (
      data["CATEGORY"] == product[0]["CATEGORY"] &&
      data["colour"] == product[0]["colour"]
    ) {
      return data;
    }
  });
  differ_sizes_products.sort((a, b) => {
    return a["size"] - b["size"];
  });

  res.render("product", {
    title: "Product | Krishna Dress Store ",
    notProductPage: false,
    product: product[0],
    product_size: product[0]["size"],
    other_items: differ_sizes_products,
  });
});

Router.get("/search", async (req, res) => {
  const { query } = req.query;

  try {
    const connection = await pool.getConnection();

    // Perform a basic search query on your products table
    const [results, fields] = await pool.query(
      "SELECT * FROM products_info WHERE (title LIKE ? OR description LIKE ?) AND size = 4",
      [`%${query}%`, `%${query}%`]
    );
    connection.release();

    if (results.length == 0) {
      res.render("search_items", {
        title: "Krishna Dress Store",
        notProductPage: true,
        products: 0,
        noproducts: true,
      });
    }

    res.render("search_items", {
      title: "Krishna Dress Store",
      notProductPage: true,
      products: results,
    });
  } catch (error) {
    console.error("Error executing search query:", error);
    res.status(500).send("Internal Server Error");
  }
});

Router.get("/track-orders/:orderid", (req, res) => {
  res.send(
    `This page is to track the specific orders. ID = ${req.params.orderid}`
  );
});

Router.get("/my-cart", async (req, res) => {
  const raw_data = await get_products();
  const my_cookies = cookies.parse(req.headers.cookie || "");
  let cart_items = my_cookies["cart-info"];
  if (cart_items) {
    cart_items = JSON.parse(cart_items);
  } else {
    cart_items = [];
  }
  let n = cart_items.length > 0 ? 1 : 0;
  let mydata = JSON.parse(JSON.stringify(raw_data));
  products = [];
  cart_items.forEach((element) => {
    mydata.filter((product) => {
      if (product.id == element.id) {
        product["quantity"] = element.quantity;
        product["total_price"] = element.quantity * product.price;
        products.push(product);
      }
    });
  });

  let total_price = 0;
  let ship_charge = 100;
  if (products.length <= 3) {
    ship_charge = 100;
  } else if (products.length > 3 && products.length <= 6) {
    ship_charge = 150;
  } else {
    ship_charge = 0;
  }
  products.forEach((element) => {
    total_price += element.total_price;
  });

  let payment_info = [ship_charge, total_price, ship_charge + total_price];

  res.render("cart", {
    title: "Krishna Dress Store | My Cart",
    notProductPage: true,
    products: products,
    payment: payment_info,
    any_product: n,
  });
});

Router.post("/getorder", async (req, res) => {
  const raw_data = await get_products();
  const my_cookies = cookies.parse(req.headers.cookie || "");
  let cart_items = my_cookies["cart-info"];
  if (cart_items) {
    cart_items = JSON.parse(cart_items);
  } else {
    cart_items = [];
  }
  let n = cart_items.length > 0 ? 1 : 0;
  let mydata = JSON.parse(JSON.stringify(raw_data));
  products = [];
  cart_items.forEach((element) => {
    mydata.filter((product) => {
      if (product.id == element.id) {
        product["quantity"] = element.quantity;
        product["total_price"] = element.quantity * product.price;
        products.push(product);
      }
    });
  });

  let total_price = 0;
  let ship_charge = 100;
  if (products.length <= 3) {
    ship_charge = 100;
  } else if (products.length > 3 && products.length <= 6) {
    ship_charge = 150;
  } else {
    ship_charge = 0;
  }
  products.forEach((element) => {
    total_price += element.total_price;
  });

  const info = {
    fname: req.body.fname,
    lname: req.body.lname,
    country: req.body.country,
    state: req.body.state,
    city: req.body.city,
    address: req.body.houseadd,
    aparment: req.body.apartment,
    phn: req.body.phone,
    email: req.body.email,
  };

  let details = {
    amount: ship_charge + total_price,
    currency: "INR",
    receipt: `${info.fname} ${info.lname}`,
  };

  res.render("payment", {
    title: "Krishna Dress Store | Payments",
    notProductPage: true,
    key: key,
    info: info,
    details: details,
  });
});

Router.post("/createorder", async (req, res) => {
  const razorpayInstance = new Razorpay({
    key_id: key,
    key_secret: secret,
  });

  const Option = req.body;
  const order = await razorpayInstance.orders.create(Option);
  res.send(order);
});

Router.post("/getprice", async (req, res) => {
  const raw_data = await get_products();
  const cartItems = req.body;

  let mydata = JSON.parse(JSON.stringify(raw_data));
  products = [];
  cartItems.forEach((element) => {
    mydata.filter((product) => {
      if (product.id == element.id) {
        product["quantity"] = element.quantity;
        product["total_price"] = element.quantity * product.price;
        products.push(product);
      }
    });
  });
  let total_price = 0;
  let ship_charge = 100;
  if (products.length <= 3) {
    ship_charge = 100;
  } else if (products.length > 3 && products.length <= 6) {
    ship_charge = 150;
  } else {
    ship_charge = 0;
  }
  products.forEach((element) => {
    total_price += element.total_price;
  });

  let details = {
    amount: (ship_charge + total_price) * 100,
    currency: "INR",
  };

  res.send(details);
});

Router.post("/add-order", (req, res) => {
  // const data = {
  //   id: response,
  //   userData: formData,
  //   orders: orders
  //   };
  let info = req.body;
  let id = info.id.razorpay_payment_id;
  let userData = info.userData;
  let orders = info.orders;

  if (id) {
    const queryString =
      "INSERT INTO `orders` (`payment_id`, `name`, `email`, `cart`, `contact Number`, `Alt Number`, `Address`, `date_time`, `pay_method`, `amount`) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)";
    const values = [
      id,
      userData.name,
      userData.email,
      orders,
      userData.phone,
      "none",
      userData.address,
      userData.payment_method,
      userData.amount,
    ];
    // console.log("I was here")
    
    pool.query(queryString, values);
    // console.log("here now")
    res.json('true')

  } else {
    res.json('false')
  }
});

Router.post("/success", (req, res) => {
  res.send("Your Order Was Successfull");
});

Router.post("/failed", (req, res) => {
  res.send("Your Order Was Failed");
});

// fetch_data();

module.exports = Router;
