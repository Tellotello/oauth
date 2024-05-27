const express = require("express");
const request = require("request");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.get("/", (req, res) => {
  res.send(
    "Hello World! Funcionando. Ir a /login para iniciar sesión. Username: user1 Password: password1 o Username: A01721735 Password: Tello123! o Username: A444 Password: Tello123"
  );
});

app.get("/login", (req, res) => {
  const authUrl =
    "https://oauthback.azurewebsites.net/authorize?response_type=code&client_id=client1&redirect_uri=https://authtello.azurewebsites.net/callback";
  res.redirect(authUrl);
});

app.get("/callback", (req, res) => {
  const authCode = req.query.code;
  const tokenUrl = "https://oauthback.azurewebsites.net/token";
  const params = {
    code: authCode,
    client_id: "client1",
    client_secret: "secret1",
    redirect_uri: "https://authtello.azurewebsites.net/callback",
    grant_type: "authorization_code",
  };

  request.post({ url: tokenUrl, form: params }, (err, response, body) => {
    if (err) {
      res.send(`Error: ${err.message}`);
      return;
    }
    const token = JSON.parse(body).access_token;
    res.send(`Access Token: ${token}`);
  });
});

app.listen(port, () => {
  console.log(`Backend app listening at http://localhost:${port}`);
});
