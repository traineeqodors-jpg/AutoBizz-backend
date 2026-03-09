"use strict";
const bcrypt = require("bcrypt");


const hashPassword = async (password) => {
  const saltRounds = 12; 
  return await bcrypt.hash(password,saltRounds)
}


const comparePassword = async (password, storedHash) => {
  return await bcrypt.compare(password,storedHash)
};

module.exports = { hashPassword, comparePassword };
