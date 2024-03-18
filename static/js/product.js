const imgs = document.querySelectorAll(".img-select a");
const imgBtns = [...imgs];
let imgId = 1;

imgBtns.forEach((imgItem) => {
  imgItem.addEventListener("click", (event) => {
    event.preventDefault();
    imgId = imgItem.dataset.id;
    slideImage();
  });
});

function slideImage() {
  const displayWidth = document.querySelector(
    ".img-showcase img:first-child"
  ).clientWidth;

  document.querySelector(".img-showcase").style.transform = `translateX(${
    -(imgId - 1) * displayWidth
  }px)`;
}

window.addEventListener("resize", slideImage);


function add_product(product_id) {
  const cookiename = "cart-info";
  const item_count = document.getElementById("item-quantity").value;
  if (item_count <= 0) {
    alert("Please select a valid quantity of item.");
  } else if (item_count >= 11) {
    alert("You can only order maximum 10 pieces of this item at.");
  } else {
    let cookies = getcookies(`${cookiename}`);

    if (cookies) {
      try {
        cookies = JSON.parse(cookies);
      } catch {
        cookies = [];
      }
    } else {
      cookies = [];
    }
    let current_item = {
      id: product_id,
      quantity: item_count,
    };

    let item_added = false
    if (cookies.length > 0) {
      cookies.filter((product) => {
        if (product.id == product_id) {

          product.quantity = parseInt(product.quantity) + parseInt(item_count);
          item_added = true;
        } 
        return product
      });
      if (item_added == false){
        cookies.push(current_item);
      }
    }
    else {
      cookies.push(current_item);
    }


    setCookie(cookiename, JSON.stringify(cookies), 365);
    alert("Product added to cart");
  }
}

function getcookies(name) {
  let cookies = `; ${document.cookie}`;
  let part = cookies.split(`; ${name}=`);

  if (part.length == 2) {
    let value = part.pop().split(";").shift();
    return value;
  } else {
    return "";
  }
}

function setCookie(name, value, days) {
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function remove_product(id) {
  let cookies = getcookies("cart-info");
  let products = JSON.parse(cookies);
  console.log(`${products.length} id is ${id}`);
  let new_products = products.filter((product) => {
    if (product.id != id) {
      console.log(product.id);
      return product;
    }
  });
  console.log(new_products.length);
  setCookie("cart-info", JSON.stringify(new_products), 365);
}

module.exports = getcookies;
