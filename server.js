const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");
const bodyParser = require("body-parser");
const app = express();

app.use(express.json());
app.use(express.static("../frontend"));

// STRIPE CHECKOUT
app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur",
        product_data: { name: "Master" },
        unit_amount: 40000
      },
      quantity: 1
    }],
    success_url: "https://omnisgaracademy.es/success.html",
    cancel_url: "https://omnisgaracademy.es"
  });

  res.json({ url: session.url });
});

// WEBHOOK
app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET || "test"
);

  if (event.type === "checkout.session.completed") {
    console.log("Pago recibido");
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
