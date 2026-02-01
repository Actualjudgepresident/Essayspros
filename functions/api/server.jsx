const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const Stripe = require("stripe");

const app = express();
app.use(cors());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const uploadDir = path.join(__dirname, "uploads");
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]/g, "");
    cb(null, Date.now() + "-" + safe);
  }
});
const upload = multer({ storage });

app.use(express.json());

const orders = []; // replace with a database in production

function sendAdminEmail(subject, text){
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
  });

  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_NOTIFY_EMAIL,
    subject,
    text
  });
}

app.post("/api/orders", upload.array("files", 20), async (req, res) => {
  try{
    const data = JSON.parse(req.body.data || "{}");
    const id = String(Date.now());

    const fileList = (req.files || []).map(f=>({
      originalName: f.originalname,
      storedName: f.filename
    }));

    const order = {
      id,
      createdAt: new Date().toISOString(),
      status: "created",
      paid: false,
      data,
      files: fileList,
      solutionFiles: []
    };

    orders.push(order);

    await sendAdminEmail(
      "New order created",
      "Order " + id + " was created. Subject: " + (data.subject || "None")
    );

    res.json({ ok:true, id });
  }catch(e){
    res.status(400).json({ ok:false, error: "Invalid order data" });
  }
});

app.post("/api/stripe/create-checkout-session", async (req, res) => {
  try{
    const { orderId, amountUsd } = req.body;
    const order = orders.find(o=>o.id === orderId);
    if(!order) return res.status(404).json({ ok:false });

    const cents = Math.round(Number(amountUsd) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "EssaysPros order " + orderId },
          unit_amount: cents
        },
        quantity: 1
      }],
      success_url: process.env.PUBLIC_BASE_URL + "/success.html?orderId=" + orderId,
      cancel_url: process.env.PUBLIC_BASE_URL + "/cancel.html?orderId=" + orderId,
      metadata: { orderId }
    });

    res.json({ ok:true, url: session.url });
  }catch(e){
    res.status(500).json({ ok:false });
  }
});

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try{
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }catch(err){
    return res.status(400).send("Webhook error");
  }

  if(event.type === "checkout.session.completed"){
    const session = event.data.object;
    const orderId = session.metadata && session.metadata.orderId;
    const order = orders.find(o=>o.id === orderId);
    if(order){
      order.paid = true;
      order.status = "paid";
      await sendAdminEmail("Order paid", "Order " + orderId + " has been paid.");
    }
  }

  res.json({ received: true });
});

app.get("/api/admin/orders", (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if(adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ ok:false });
  res.json({ ok:true, orders });
});

app.post("/api/admin/orders/:id/solution", (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];
  if(adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ ok:false });
  next();
}, upload.array("solutionFiles", 20), async (req, res) => {
  const order = orders.find(o=>o.id === req.params.id);
  if(!order) return res.status(404).json({ ok:false });

  const files = (req.files || []).map(f=>({
    originalName: f.originalname,
    storedName: f.filename
  }));

  order.solutionFiles.push(...files);
  order.status = "solutionUploaded";

  await sendAdminEmail("Solution uploaded", "Solution uploaded for order " + order.id);
  res.json({ ok:true });
});

app.use("/uploads", express.static(uploadDir));

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log("Server running on " + port));
