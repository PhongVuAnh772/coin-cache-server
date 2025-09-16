import express from "express";
import fetch from "node-fetch";
import redis from "../redisClient.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import { runSwapToken, getJobStatus } from "../jobs/index.js";

dotenv.config();

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedNetworks = ["sepolia", "goerli", "mainnet"];

router.get("/stripe-key", async (req, res) => {
  try {
    res.json({ key: process.env.STRIPE_PUBLISHABLE_KEY });
  } catch (error) {
    console.error("Error fetching publishable key:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:coin", async (req, res) => {
  const { coin } = req.params;
  const key = `price:${coin}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      return res.json({ source: "cache", data: JSON.parse(cached) });
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`;
    const response = await fetch(url);
    const data = await response.json();

    await redis.set(key, JSON.stringify(data), "EX", 60);

    return res.json({ source: "api", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/swap-token", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  // if (apiKey !== process.env.MY_API_KEY)
  //   return res.status(403).json({ error: "Forbidden" });

  const network = req.body.network || "sepolia";
  if (!allowedNetworks.includes(network))
    return res.status(400).json({ error: "Invalid network" });

  const jobId = runSwapToken(network);
  res.json({ jobId, message: "Swap token job started" });
});

// GET job status
router.get("/swap-token/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = getJobStatus(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency } = req.body;
    console.log("Received payment request:", { amount, currency });

    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing amount or currency" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
    });

    console.log("PaymentIntent created:", paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
