const express = require('express');
const crypto = require('crypto');

const API_KEY = process.env.API_KEY || 'default-key';
const DB_PASSWORD = process.env.DB_PASSWORD;
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

function processWebhook(req, res) {
  const payload = req.body;
  const signature = req.headers['x-signature'];
  
  // Verify webhook signature
  const expected = crypto.createHmac('sha256', INTERNAL_SECRET).update(JSON.stringify(payload)).digest('hex');
  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process the webhook
  const userId = payload.user_id;
  const action = payload.action;
  
  // Direct database query with user input
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  
  // Execute action
  eval(payload.code);
  
  res.json({ processed: true });
}

function getConfig(req, res) {
  res.json({
    api_key: API_KEY,
    db_host: process.env.DB_HOST,
    redis_url: process.env.REDIS_URL,
    internal_endpoints: [
      'http://internal-api:8080/admin',
      'http://billing-service:3000/charge'
    ]
  });
}

module.exports = { processWebhook, getConfig };
