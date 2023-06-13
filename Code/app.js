require('dotenv').config();
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

// Function to start the application
async function startApp() {
  try {
    const answer = await inquirer.prompt({
      name: 'action',
      type: 'list',
      message: 'Please select an option:',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Delete a department',
        'Delete a role',
        'Delete an employee',
        'Exit',
      ],
    });

    switch (answer.action) {
      case 'View all departments':
        await viewDepartments();
        break;
      case 'View all roles':
        await viewRoles();
        break;
      case 'View all employees':
        await viewEmployees();
        break;
      case 'Add a department':
        await addDepartment();
        break;
      case 'Add a role':
        await addRole();
        break;
      case 'Add an employee':
        await addEmployee();
        break;
      case 'Update an employee role':
        await updateEmployeeRole();
        break;
      case 'Delete a department':
        await deleteDepartment();
        break;
      case 'Delete a role':
        await deleteRole();
        break;
      case 'Delete an employee':
        await deleteEmployee();
        break;
      case 'Exit':
        connection.end();
        console.log('Goodbye!');
        break;
      default:
        console.log('Invalid option selected. Please try again.');
        await startApp();
    }
  } catch (err) {
    console.error('Error inquirer prompt: ', err);
  }
}

// Function to view all departments
async function viewDepartments() {
  try {
    const departments = await query('SELECT * FROM departments');
    console.log('--- Department List ---');
    console.table(departments);
    await startApp();
  } catch (err) {
    console.error('Error retrieving departments: ', err);
  }
}

// Function to view all roles
async function viewRoles() {
  try {
    const roles = await query(`
      SELECT roles.role_id, roles.role_title, roles.salary, departments.department_name
      FROM roles
      INNER JOIN departments ON roles.department_id = departments.department_id
    `);
    console.log('--- Roles List ---');
    console.table(roles);
    await startApp();
  } catch (err) {
    console.error('Error retrieving roles: ', err);
  }
}

// Function to view all employees
async function viewEmployees() {
  try {
    const employees = await query(`
      SELECT e.employee_id, e.first_name, e.last_name, r.role_title, d.department_name, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
      FROM employees AS e
      INNER JOIN roles AS r ON e.role_id = r.role_id
      INNER JOIN departments AS d ON r.department_id = d.department_id
      LEFT JOIN employees AS m ON e.manager_id = m.employee_id
    `);
    console.log('--- Employees List ---');
    console.table(employees);
    await startApp();
  } catch (err) {
    console.error('Error retrieving employees: ', err);
  }
}

// Function to add a department
async function addDepartment() {
  try {
    const answer = await inquirer.prompt({
      name: 'departmentName',
      type: 'input',
      message: 'Enter the name of the department:',
    });

    await query('INSERT INTO departments SET ?', { department_name: answer.departmentName });
    console.log('Department added successfully!');
    await startApp();
  } catch (err) {
    console.error('Error adding department: ', err);
  }
}

// Function to add a role
async function addRole() {
  try {
    // Fetch department choices
    const departments = await query('SELECT department_id, department_name FROM departments');

    const answer = await inquirer.prompt([
      {
        name: 'roleTitle',
        type: 'input',
        message: 'Enter the title of the role:',
      },
      {
        name: 'salary',
        type: 'input',
        message: 'Enter the salary for the role:',
      },
      {
        name: 'departmentId',
        type: 'list',
        message: 'Select the department for the role:',
        choices: departments.map((department) => ({
          name: department.department_name,
          value: department.department_id,
        })),
      },
    ]);

    await query('INSERT INTO roles SET ?', {
      role_title: answer.roleTitle,
      salary: answer.salary,
      department_id: answer.departmentId,
    });
    console.log('Role added successfully!');
    await startApp();
  } catch (err) {
    console.error('Error adding role: ', err);
  }
}

// Function to add an employee
async function addEmployee() {
  try {
    // Fetch role choices
    const roles = await query('SELECT role_id, role_title FROM roles');

    const answer = await inquirer.prompt([
      {
        name: 'firstName',
        type: 'input',
        message: "Enter the employee's first name:",
      },
      {
        name: 'lastName',
        type: 'input',
        message: "Enter the employee's last name:",
      },
      {
        name: 'roleId',
        type: 'list',
        message: "Select the employee's role:",
        choices: roles.map((role) => ({ name: role.role_title, value: role.role_id })),
      },
      {
        name: 'managerId',
        type: 'input',
        message: "Enter the manager's employee ID (leave empty if none):",
        default: '',
      },
    ]);
    
    // Convert empty string to null for manager ID
    const managerId = answer.managerId === '' ? null : answer.managerId; 

    await query('INSERT INTO employees SET ?', {
      first_name: answer.firstName,
      last_name: answer.lastName,
      role_id: answer.roleId,
      manager_id: managerId,
    });
    console.log('Employee added successfully!');
    await startApp();
  } catch (err) {
    console.error('Error adding employee: ', err);
  }
}

// Function to update an employee's role
async function updateEmployeeRole() {
  try {
    // Fetch employee choices
    const employees = await query('SELECT employee_id, CONCAT(first_name, " ", last_name) AS full_name FROM employees');

    // Fetch role choices
    const roles = await query('SELECT role_id, role_title FROM roles');

    const answer = await inquirer.prompt([
      {
        name: 'employeeId',
        type: 'list',
        message: 'Select an employee to update:',
        choices: employees.map((employee) => ({
          name: employee.full_name,
          value: employee.employee_id,
        })),
      },
      {
        name: 'roleId',
        type: 'list',
        message: 'Select the new role for the employee:',
        choices: roles.map((role) => ({ name: role.role_title, value: role.role_id })),
      },
    ]);

    await query('UPDATE employees SET role_id = ? WHERE employee_id = ?', [answer.roleId, answer.employeeId]);
    console.log('Employee role updated successfully!');
    await startApp();
  } catch (err) {
    console.error('Error updating employee role: ', err);
  }
}

// Function to delete a department
async function deleteDepartment() {
  try {
    const departments = await query('SELECT * FROM departments');
    const answer = await inquirer.prompt({
      name: 'departmentId',
      type: 'list',
      message: 'Select the department to delete:',
      choices: departments.map((department) => ({
        name: department.department_name,
        value: department.department_id,
      })),
    });

    await query('DELETE FROM departments WHERE department_id = ?', answer.departmentId);
    console.log('Department deleted successfully!');
    await startApp();
  } catch (err) {
    console.error('Error deleting department: ', err);
  }
}

// Function to delete a role
async function deleteRole() {
  try {
    const roles = await query('SELECT * FROM roles');
    const answer = await inquirer.prompt({
      name: 'roleId',
      type: 'list',
      message: 'Select the role to delete:',
      choices: roles.map((role) => ({
        name: role.role_title,
        value: role.role_id,
      })),
    });

    await query('DELETE FROM roles WHERE role_id = ?', answer.roleId);
    console.log('Role deleted successfully!');
    await startApp();
  } catch (err) {
    console.error('Error deleting role: ', err);
  }
}

// Function to delete an employee
async function deleteEmployee() {
  try {
    const employees = await query('SELECT * FROM employees');
    const answer = await inquirer.prompt({
      name: 'employeeId',
      type: 'list',
      message: 'Select the employee to delete:',
      choices: employees.map((employee) => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.employee_id,
      })),
    });

    await query('DELETE FROM employees WHERE employee_id = ?', answer.employeeId);
    console.log('Employee deleted successfully!');
    await startApp();
  } catch (err) {
    console.error('Error deleting employee: ', err);
  }
}