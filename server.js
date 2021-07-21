const fs = require("fs");
const http = require("http");
const https = require("https");

const express = require("express");
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const PORT = process.env.PORT || 8443;
// your express configuration here
if (process.env.NODE_ENV === "development") {
  const privateKey = fs.readFileSync("./server.key", "utf8");
  const certificate = fs.readFileSync("./server.crt", "utf8");
  const credentials = { key: privateKey, cert: certificate };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(PORT);
} else {
  app.listen(PORT, (error) => {
    if (error) {
      console.error(error);
    } else {
      console.log(`App is running`);
    }
  });
}

app.get("/", (req, res) => {
  res.render("index");
});
