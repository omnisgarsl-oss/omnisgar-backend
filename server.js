const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_dummy");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: ["https://omnisgaracademy.es", "https://www.omnisgaracademy.es"],
  methods: ["GET", "POST"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Omnisgar funcionando");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("STRIPE KEY LOADED:", !!process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Master en Hipnosis Clínica"
            },
            unit_amount: 40000
          },
          quantity: 1
        }
      ],
      success_url: "https://omnisgaracademy.es/success.html",
      cancel_url: "https://omnisgaracademy.es/curso.html"
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      error: error.message || "Error interno en Stripe"
    });
  }
});

app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
