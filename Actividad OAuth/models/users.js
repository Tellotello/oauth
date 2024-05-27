const bcrypt = require("bcryptjs");
const users = [
  {
    id: "1",
    username: "user1",
    password: bcrypt.hashSync("password1", 10), // hashed password for bcrypt
  },
  {
    id: "2",
    username: "A01721735",
    password: bcrypt.hashSync("Tello123!", 10), // hashed password for bcrypt
  },
  {
    id: "3",
    username: "A444",
    password: bcrypt.hashSync("Tello123!", 10), // hashed password for bcrypt
  },
];

module.exports = { users };
