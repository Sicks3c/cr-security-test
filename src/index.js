const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/api/users", (req, res) => {
  res.status(501).json({
    error: "Not Implemented",
    message: "User API endpoint is not yet implemented"
  });
});

app.get("/search", (req, res) => {
  res.status(501).json({
    error: "Not Implemented",
    message: "Search endpoint is not yet implemented"
  });
});

app.listen(3000);