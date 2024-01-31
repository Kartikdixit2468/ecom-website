// let product_price = 399;
// let product_title = "New Product"
// let product_description = "🌟 #Snowman (SNOW), the official meme coin of @ice_blockchain, released as a fair launch on #Uniswap Trade Now: https://dexscreener.com/ethereum/0xd1f3d2f5c12a205fc912358878b089eae48a557 🙌 Join me on #Ice kartikdixit"
// let product_mrp =  999;
// let product_discount = 40;
// let product_image1 = "/images/dresses/cotton/1";
// let product_image2 = "/images/dresses/cotton/2";
// num_product = 20;

const credentials = require("../data/credentials.js");
const express = require("express");
const Router = express.Router();
const mysql = require("mysql2");

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
  const data = rows;
  return data;
}

async function fetch_data() {
  const data = await get_products();
  // console.log(data);
  // return data;

  Router.get("/", (req, res) => {
    res.render("home", {
      title: "Krishna Dress Store",
      notProductPage: true,
      products: data,
    });
  });

  Router.get("/about", (req, res) => {
    res.render("about", { title: "Krishna Dress Store", notProductPage: true });
  });

  Router.get("/policy/:policy", (req, res) => {
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
      title: "Krishna Dress Store",
      notProductPage: true,
    });
  });

  Router.get("/shop", (req, res) => {
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
  Router.get("/product/:id", (req, res) => {
    const id = req.params.id;
    let product = data.filter((product) => product["id"] == id);
    console.log(product);

    res.render("product", {
      title: "Product | Krishna Dress Store",
      notProductPage: false,
      product: product[0],
    });
  });

  Router.get("/search", async (req, res) => {
    // res.send("Working")
    const { query } = req.query;

    try {
      const connection = await pool.getConnection();

      // Perform a basic search query on your products table
      const [results, fields] = await pool.query(
        "SELECT * FROM products_info WHERE title LIKE ? OR description LIKE ?",
        [`%${query}%`, `%${query}%`]
      );
      connection.release();

      // res.render('search-results', { results, query });
      let obj = [results, query];
      // let obj = [results, results2, query]
      // res.send(results);
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

  // Router.get("/data", (req, res) => {
  //   res.send(data)
  // });

  Router.get("/track-orders/:orderid", (req, res) => {
    res.send(
      `This page is to track the specific orders. ID = ${req.params.orderid}`
    );
  });
}

fetch_data();

// const products = await get_products()
// console.log(products)

// async function fetch_data(func){
//   data = await func();
//   console.log(data)
// }
// fetch_data(get_products)

// console.log(data)

module.exports = Router;
