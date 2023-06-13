-- Create the database
CREATE DATABASE employee_db;
-- Use the database
USE employee_db;
-- Create the departments table
CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(255)
);
-- Create the roles table
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_title VARCHAR(255),
  salary DECIMAL(10, 2),
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
  ON DELETE CASCADE
);
-- Create the employees table
CREATE TABLE employees (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role_id INT,
  manager_id INT,
  FOREIGN KEY (role_id) REFERENCES roles(role_id),
  ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
  ON DELETE SET NULL
);