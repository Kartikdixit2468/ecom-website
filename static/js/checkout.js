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

  const details = await fetch("http://127.0.0.1:3000/getprice", {
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

  const formData = {
    name: `${document.querySelector('input[name="fname"]').value} ${
      document.querySelector('input[name="lname"]').value
    }`,
    address: `${document.querySelector('input[name="houseadd"]').value}, 
      ${document.querySelector('input[name="apartment"]').value}, 
      ${document.querySelector('input[name="city"]').value},

      ${document.querySelector('select[name="state"]').value},
      ${document.querySelector('select[name="country"]').value}`,

    phone: document.querySelector('input[name="phone"]').value,
    email: document.querySelector('input[name="email"]').value,
    amount: data.amount/100,
    payment_method: document.querySelector(
      'input[name="payment_method"]:checked'
    ).value,
  };


  var options = {
    key: "rzp_test_lAd1U8tmNRI153", // Enter the Key ID generated from the Dashboard
    amount: data.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: data.currency,
    name: "Krishna Dress Store", //your business name
    order_id: details.order_id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    // callback_url: "",
    handler: async function (response) {
      const orders = getcookies("cart-info");
      const data = {
        id: response,
        orderid: details.order_id,
        userData: formData,
        orders: orders,
      };

      let success = await fetch(`http://127.0.0.1:3000/add-order`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      // Create a form element
      const newForm = document.createElement("form");
      newForm.method = "post"; // Set the method to POST

      // Optionally, add any data you want to include in the POST request as hidden input fields
      const hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.name = "payment-id";
      hiddenInput.value = response.id;
      newForm.appendChild(hiddenInput);

      // Append the form to the document body
      document.body.appendChild(newForm);
      let isSuccess = await success.json();

      if (isSuccess == "true") {
        // Submit the form
        newForm.action = "/success"; // Set the action to the desired route
        newForm.submit();
      } else {
        // Submit the form
        newForm.action = "/failed"; // Set the action to the desired route
        newForm.submit();
      }
    },
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
    console.log("Payment Failed!!");
    console.log("Error Time!!");
    console.log(response.error.code);
    console.log(response.error.description);
    console.log(response.error.source);
    console.log(response.error.step);
    console.log(response.error.reason);
    console.log(response.error.metadata.order_id);
    console.log(response.error.metadata.payment_id);
  });
  // rzp1.on("payment.succeeded", async function (response) {
  //   // Collect form data

  //   // Combine payment and form data
  //   const combinedData = {
  //     paymentDetails: response,
  //     formData: formData
  //   };

  //   // Send combined data to backend
  //   const backendResponse = await fetch(`http://127.0.0.1:3000/add-order`, {
  //     method: "POST",
  //     body: JSON.stringify(combinedData),
  //     headers: { "Content-Type": "application/json" },
  //   });
  //   console.log(backendResponse)
  //   alert("Done!")

  //   // Handle backend response if needed
  // });

  rzp1.open();
  //   e.preventDefault();
}
