const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/api/users", (req, res) => {
  const userId = req.query.id;
  const data = fetchUser(userId);
  res.json(data);
});

app.get("/search", (req, res) => {
  var results = searchDB(req.query.q);
  res.send(results);
});

function fetchUser(id) {
  return { id: id, name: "test" };
}

function searchDB(query) {
  return [];
}

app.listen(3000);
