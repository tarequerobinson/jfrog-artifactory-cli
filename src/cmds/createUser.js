const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');
require('dotenv').config();

async function createUser(mainMenu, usersMenu) {
    try {
        // Token for authentication
        const token = process.env.JFROG_ACCESS_TOKEN; 
        const base_url = process.env.JFROG_BASE_URL;
        
        if (!token) {
            console.error(chalk.red('Error: Please login with an admin account first.'));
            return await mainMenu();
        }

        // Prompt for user details with exit option
        const userDetails = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'User Creation Menu:',
                choices: [
                    'Enter New User Details',
                    'Return to Main Menu'
                ]
            }
        ]);

        // Handle menu navigation choices
        switch (userDetails.action) {
            case 'Return to Main Menu':
                return await mainMenu();
            case 'Enter New User Details':
                break;
            default:
                return await mainMenu();
        }

        // Prompt for username
        const usernamePrompt = await inquirer.prompt([
            {
                type: 'input',
                name: 'username',
                message: 'Enter username:',
                validate: (input) => !!input.trim() || 'Username cannot be empty'
            }
        ]);

        // Prompt for password
        const passwordPrompt = await inquirer.prompt([
            {
                type: 'password',
                name: 'password',
                message: 'Enter password:',
                mask: '*',
                validate: (input) => {
                    // Password validation rules
                    if (input.length < 8) return 'Password must be at least 8 characters long.';
                    if (!/[A-Z]/.test(input)) return 'Password must contain at least one uppercase letter.';
                    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(input)) return 'Password must contain at least one symbol.';
                    return true;
                }
            }
        ]);

        // Prompt for email
        const emailPrompt = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Enter email:',
                validate: (input) => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(input) || 'Invalid email format. Please enter a valid email address.';
                }
            }
        ]);

        // Create the payload for the POST request
        const userPayload = {
            username: usernamePrompt.username,
            password: passwordPrompt.password,
            email: emailPrompt.email,
            groups: ["readers"],
            admin: false,
            profile_updatable: true,
            internal_password_disabled: false,
            disable_ui_access: false
        };

        // Send the POST request to create a user
        const response = await axios.post(`${base_url}/access/api/v2/users`, userPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(chalk.green('User created successfully:'));
        console.log(response.data);



    } catch (error) {
        if (error.response) {
            // Handle response errors
            switch (error.response.status) {
                case 401:
                    console.error(chalk.red('Authentication failed. Check your access token and admin privileges.'));
                    break;
                case 403:
                    console.error(chalk.red('Insufficient permissions. Ensure you have admin access.'));
                    break;
                case 400:
                    console.error(chalk.red('Invalid input or request parameters.'));
                    break;
                default:
                    console.error(chalk.red('Unexpected error:'), error.response.data);
            }
        } else if (error.request) {
            console.error(chalk.red('No response received from the server.'));
        } else {
            console.error(chalk.red('Error setting up the request:'), error.message);
        }
        return await mainMenu(); // Default fallback
    }
}

module.exports = { createUser };