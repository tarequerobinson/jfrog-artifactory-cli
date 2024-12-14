const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { allusers } = require('./allUsers');
require('dotenv').config();

async function deleteUser() {
    try {
        const token = process.env.JFROG_ACCESS_TOKEN;
        const base_url = process.env.JFROG_BASE_URL;

        if (!token) {
            console.error(chalk.red('Error: Please login with an admin account first.'));
            return null;
        }

        // Prompt for username to delete
        const { confirmUsername } = await inquirer.prompt([
            {
                type: 'input',
                name: 'confirmUsername',
                message: 'Enter the username of the user you want to delete:',
                validate: input => input.trim() !== '' ? true : 'Username cannot be empty'
            }
        ]);

        // Pre-request validation: Check if user exists
        try {
            await axios.get(`${base_url}/access/api/v2/users/${confirmUsername}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (validationError) {
            if (validationError.response) {
                switch (validationError.response.status) {
                    case 404:
                        // Provide more interactive options when user doesn't exist
                        const { userNotExistsAction } = await inquirer.prompt([
                            {
                                type: 'list',
                                name: 'userNotExistsAction',
                                message: chalk.yellow(`User ${confirmUsername} does not exist. What would you like to do?`),
                                choices: [
                                    'Search for a different user',
                                    'View existing users',
                                    'Return to Main Menu'
                                ]
                            }
                        ]);

                        switch (userNotExistsAction) {
                            case 'Search for a different user':
                                return deleteUser(); // Restart the deletion process
                            case 'View existing users':
                                return allusers();
                            case 'Return to Main Menu':
                                return mainMenu();
                        }
                        break;
                    case 401:
                        console.error(chalk.red('🔒 Authentication failed. Check your access token and admin privileges.'));
                        return mainMenu();
                    case 403:
                        console.error(chalk.red('🚫 Insufficient permissions to check user existence.'));
                        return mainMenu();
                    default:
                        console.error(chalk.red('❗ Unexpected error during user validation:'), validationError.response.data);
                        return mainMenu();
                }
            } else {
                console.error(chalk.red('🌐 No response received from the server during user validation.'));
                return mainMenu();
            }
        }


        // Additional confirmation
        const { confirmDelete } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmDelete',
                message: `Are you sure you want to delete the user ${chalk.red(confirmUsername)}? This action cannot be undone.`,
                default: false
            }
        ]);

        if (!confirmDelete) {
            console.log(chalk.yellow('❌ User deletion cancelled.'));
            return null;
        }

        // Show loading spinner
        const loadingSpinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        const spinnerInterval = setInterval(() => {
            process.stdout.write(`\r${loadingSpinner[i]} ${chalk.yellow(`Deleting user ${confirmUsername}...`)}`);
            i = (i + 1) % loadingSpinner.length;
        }, 100);

        // Perform delete request
        const response = await axios.delete(`${base_url}/access/api/v2/users/${confirmUsername}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        // Clear spinner
        clearInterval(spinnerInterval);
        process.stdout.write('\r');

        // Success message
        console.log(chalk.green(`✅ User ${chalk.bold(confirmUsername)} successfully deleted.`));


    } catch (error) {
        // Error handling for delete request
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.error(chalk.red('🔒 Authentication failed. Check your access token and admin privileges.'));
                    break;
                case 403:
                    console.error(chalk.red('🚫 Insufficient permissions. Ensure you have admin access.'));
                    break;
                case 404:
                    console.error(chalk.red(`❌ User not found (deletion failed).`));
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
        
        return mainMenu();
    }
}

module.exports = { deleteUser };