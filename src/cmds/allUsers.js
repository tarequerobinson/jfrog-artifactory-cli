const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { table } = require('table');
require('dotenv').config(); // Load environment variables


async function allusers() {
    try {
        const token = process.env.JFROG_ACCESS_TOKEN ; 
        const base_url = process.env.JFROG_BASE_URL            

        if (!token) {
            console.error(chalk.red('Error: Please login with an admin account first.'));
            return null;
        }

        // Show loading spinner
        const loadingSpinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        const spinnerInterval = setInterval(() => {
            process.stdout.write(`\r${loadingSpinner[i]} ${chalk.yellow('Fetching users...')}`);
            i = (i + 1) % loadingSpinner.length;
        }, 100);

        const response = await axios.get(`${base_url}/access/api/v2/users?limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        // Clear spinner
        clearInterval(spinnerInterval);
        process.stdout.write('\r');

        // Check if users list is empty
        if (!response.data.users || response.data.users.length < 1) {
            console.log(chalk.yellow('🚫 No users found.'));
            return;
        }

        // Prepare table data
        const tableData = [
            [
                chalk.bold.blue('Username'), 
                chalk.bold.blue('Email'), 
                chalk.bold.blue('Admin'), 
                chalk.bold.blue('Groups')
            ]
        ];

        response.data.users.forEach(user => {
            tableData.push([
                chalk.green(user.username || 'N/A'),
                chalk.cyan(user.email || 'N/A'),
                user.admin ? chalk.red('Yes') : chalk.green('No'),
                chalk.magenta(user.groups ? user.groups.join(', ') : 'N/A')
            ]);
        });

        // Display users in a table
        console.log(chalk.bold.blue('\n📋 User List:'));
        console.log(table(tableData, {
            border: {
                topBody: `─`,
                topJoin: `┬`,
                topLeft: `┌`,
                topRight: `┐`,
                bottomBody: `─`,
                bottomJoin: `┴`,
                bottomLeft: `└`,
                bottomRight: `┘`,
                bodyLeft: `│`,
                bodyRight: `│`,
                bodyJoin: `│`
            }
        }));


    } catch (error) {
        // Error handling with colorful output
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.error(chalk.red('🔒 Authentication failed. Check your access token and admin privileges.'));
                    break;
                case 403:
                    console.error(chalk.red('🚫 Insufficient permissions. Ensure you have admin access.'));
                    break;
                case 400:
                    console.error(chalk.red('❌ Invalid input or request parameters.'));
                    break;
                default:
                    console.error(chalk.red('❗ Unexpected error:'), error.response.data);
            }
        } else if (error.request) {
            console.error(chalk.red('🌐 No response received from the server.'));
        } else {
            console.error(chalk.red('❗ Error setting up the request:'), error.message);
        }
        throw error;
    }
}

module.exports = { allusers };