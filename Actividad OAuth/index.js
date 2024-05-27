// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const oauth2orize = require("oauth2orize");
const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;
const ClientPasswordStrategy =
  require("passport-oauth2-client-password").Strategy;
const bcrypt = require("bcryptjs");
const { users } = require("./models/users");
const { clients } = require("./models/clients");
const { tokens } = require("./models/tokens");
const cors = require("cors");
const session = require("express-session");

// Configure the server
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "keyboard cat", // Use a secret key to sign the session cookie
    resave: false, // Prevent session save if unmodified
    saveUninitialized: true, // Save uninitialized session
    cookie: { secure: false }, // Set to true for HTTPS in production
  })
);

// Create OAuth2 server
const server = oauth2orize.createServer();

// Serialize and deserialize tokens
server.serializeClient((client, done) => {
  console.log("Serializing client:", client);
  done(null, client.id);
});

server.deserializeClient((id, done) => {
  console.log("Deserializing client with id:", id);
  const client = clients.find((client) => client.id === id);
  if (!client) {
    console.log("Client not found:", id);
  }
  return done(null, client);
});

// Password strategy
passport.use(
  new BasicStrategy((username, password, done) => {
    console.log("Authenticating user:", username);
    const user = users.find((user) => user.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      console.log("User not found or password mismatch:", username);
      return done(null, false);
    }
    return done(null, user);
  })
);

passport.use(
  new ClientPasswordStrategy((clientId, clientSecret, done) => {
    console.log("Authenticating client:", clientId);
    const client = clients.find((client) => client.clientId === clientId);
    if (!client || client.clientSecret !== clientSecret) {
      console.log("Client not found or secret mismatch:", clientId);
      return done(null, false);
    }
    return done(null, client);
  })
);

// Grant code
server.grant(
  oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
    console.log("Granting code for client:", client.clientId);
    const code = "code-" + Date.now();
    tokens.push({
      code,
      clientId: client.clientId,
      redirectUri,
      userId: user.id,
    });
    done(null, code);
  })
);

// Exchange code for token
server.exchange(
  oauth2orize.exchange.code((client, code, redirectUri, done) => {
    console.log("Exchanging code for token:", code);
    const tokenInfo = tokens.find(
      (token) =>
        token.code === code &&
        token.clientId === client.clientId &&
        token.redirectUri === redirectUri
    );
    if (!tokenInfo) {
      console.log("Token info not found or mismatch:", code);
      return done(null, false);
    }
    const token = "token-" + Date.now();
    tokens.push({ token, userId: tokenInfo.userId, clientId: client.clientId });
    done(null, token);
  })
);

app.get("/", (req, res) => {
  console.log("Root endpoint accessed");
  res.send("OAuth2 server corriendo! Bien https sss");
});

// Endpoints
app.get(
  "/authorize",
  passport.authenticate("basic", { session: false }),
  server.authorize((clientId, redirectUri, done) => {
    console.log(
      "Authorize request for client:",
      clientId,
      "with redirectUri:",
      redirectUri
    );
    const client = clients.find((client) => client.clientId === clientId);
    if (!client) {
      console.log("Client not found during authorization:", clientId);
      return done(null, false);
    }
    if (client.redirectUris.indexOf(redirectUri) === -1) {
      console.log("Redirect URI mismatch for client:", clientId);
      return done(null, false);
    }
    return done(null, client, redirectUri);
  }),
  (req, res) => {
    console.log("Authorization successful, sending decision form");
    res.send(
      `<form method="post" action="/decision"><input type="hidden" name="transaction_id" value="${req.oauth2.transactionID}"><button type="submit">Allow</button></form>`
    );
  }
);

app.post(
  "/decision",
  passport.authenticate("basic", { session: false }),
  (req, res, next) => {
    console.log("Decision endpoint accessed, user authenticated");
    next();
  },
  server.decision()
);

app.post(
  "/token",
  passport.authenticate(["basic", "oauth2-client-password"], {
    session: false,
  }),
  (req, res, next) => {
    console.log("Token endpoint accessed, client authenticated");
    next();
  },
  server.token(),
  server.errorHandler()
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth2 server listening on port ${PORT}`);
});
