require("dotenv").config();

const credentials = require("../data/credentials.js");
const express = require("express");
const Razorpay = require("razorpay");
const mysql = require("mysql2");
const cookies = require("cookie");
const crypto = require("crypto");
// const CryptoJS = require('crypto-js');
// const fs = require('fs');

const Router = express.Router();

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
  let userData = info.userData;
  let orders = info.orders;

  if (info.payment_method == 'cod'){

    const queryString =
      "INSERT INTO `orders` (`payment_id`, `name`, `email`, `cart`, `contact Number`, `Alt Number`, `Address`, `date_time`, `pay_method`, `amount`) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)";
    const values = [
      "none",
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

  }
  else if (info.payment_method == 'prepaid'){
  let razorpay_payment_id = info.id.razorpay_payment_id;
  let main_orderid = info.orderid;
  // let razorpay_order_id = info.id.razorpay_order_id;
  let razorpay_signature = info.id.razorpay_signature;

  // const generated_signature = CryptoJS.HmacSHA256(main_orderid + "|" + razorpay_payment_id, secret);

  let hmac = crypto.createHmac('sha256', secret);  
  
  // Passing the data to be hashed 
  hmac.update(main_orderid + "|" + razorpay_payment_id); 
    
  // Creating the hmac in the required format 
  const generated_signature = hmac.digest('hex'); 


  if (generated_signature == razorpay_signature) {
    const queryString =
      "INSERT INTO `orders` (`payment_id`, `name`, `email`, `cart`, `contact Number`, `Alt Number`, `Address`, `date_time`, `pay_method`, `amount`) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)";
    const values = [
      razorpay_payment_id,
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
}
else {
  res.json('false')
}
});

Router.post("/success", async(req, res) => {
  // res.send("Your Order Was Successfull");
  try{
    if (req.body.payment_method == 'prepaid'){
    const payment_id = req.body["payment-id"];
    let [rows, fields] =   await pool.query(`SELECT * FROM orders WHERE payment_id="${payment_id}"`);
    const my_order = rows;
    let order_id = my_order[0].order_id;

    res.render("success", {
      title: "Krishna Dress Store | Payments",
      notProductPage: false,
      order_id: order_id
    });
    }
    
    else if (req.body.payment_method == 'cod'){

      
      let name = req.body.name;
      let orders = req.body.orders;

      let [rows, fields] =   await pool.query(`SELECT * FROM orders WHERE payment_id="none" AND name='${name}' AND cart='${orders}'`);
      const my_order = rows;
      let order_id = my_order[0].order_id;

      res.render("success", {
        title: "Krishna Dress Store | Payments",
        notProductPage: false,
        order_id: order_id
      });
    }

    }
  catch{
      res.status(500).send("Invalid Request")
  }
});

Router.post("/failed", (req, res) => {
  res.send("Your Order Was Failed | False Payment detected");
});

Router.get('/3gFj7LsPm4W9eZ8rT2E9gKp6Nc4WqS', async (req, res) => {

  try {
    // Query orders data from MySQL
    const [rows, fields] = await pool.query('SELECT * FROM orders');
    
    // Convert rows to CSV format
    const csvData = rows.map(row => Object.values(row).join(','));

    // Create CSV content
    const csvContent = 'payment_id,name,email,cart,contact_number,alt_number,address,date_time,pay_method,amount\n' + csvData.join('\n');

    // Send CSV as attachment
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).send('Internal Server Error');
  }
});

// fetch_data();

module.exports = Router;

