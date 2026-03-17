const express = require("express");
const stripe = require("stripe")("TU_STRIPE_SECRET");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
product_data: {name: "Master"},
unit_amount: 40000
},
quantity: 1
}],
success_url: "http://localhost:3000/success.html",
cancel_url: "http://localhost:3000"
});
res.json({url: session.url});
});

// WEBHOOK
app.post("/webhook", bodyParser.raw({type: "application/json"}), async (req, res) => {
const sig = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(req.body, sig, "TU_WEBHOOK_SECRET");

if(event.type === "checkout.session.completed"){
const session = event.data.object;
await db.collection("students").add({
email: session.customer_email,
paid: true,
created: new Date()
});
}

res.sendStatus(200);
});

app.listen(3000, ()=>console.log("Server running"));
