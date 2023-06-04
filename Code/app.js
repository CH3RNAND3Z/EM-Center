const inquirer = require('inquirer');
const mysql = require('mysql2');
const { promisify } = require('util');

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.PASSWORD,
  database: 'employee_db',
});

// Convert callback-based functions to Promises
const query = promisify(connection.query).bind(connection);

// Connect to the MySQL server
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database!');
  startApp();
});


