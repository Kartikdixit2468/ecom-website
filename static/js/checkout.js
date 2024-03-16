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

async function handlePayment(event) {
 
    event.preventDefault();

  const details = await fetch(`http://127.0.0.1:3000/getprice`, {
    method: "POST",
    body: JSON.stringify(JSON.parse(getcookies("cart-info"))),
    headers: { "Content-Type": "application/json" },
  });

  let finalDetails = await details.json();

  let response = await fetch(`http://127.0.0.1:3000/createorder`, {
    method: "POST",
    body: JSON.stringify(finalDetails),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  var options = {
    key: "rzp_test_lAd1U8tmNRI153", // Enter the Key ID generated from the Dashboard
    amount: data.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: data.currency,
    name: "Krishna Dress Store", //your business name
    order_id: details.order_id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    callback_url: "https://eneqd3r9zrjok.x.pipedream.net/",
    prefill: {
      //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
      name: "Kartik Dixit", //your customer's name
      email: "Kartik@example.com",
      contact: "8595872053", //Provide the customer's phone number for better conversion rates
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#399cc",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.on("payment.failed", function (response) {
    console.log("Error Time!!");
    console.log(response.error.code);
    console.log(response.error.description);
    console.log(response.error.source);
    console.log(response.error.step);
    console.log(response.error.reason);
    console.log(response.error.metadata.order_id);
    console.log(response.error.metadata.payment_id);
  });
  rzp1.open();
//   e.preventDefault();
}
