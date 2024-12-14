const axios = require('axios');
const inquirer = require('inquirer');
require('dotenv').config();

const chalk = require('chalk');
const ora = require('ora');

async function pingMenu() {
    try {
        const token = process.env.JFROG_ACCESS_TOKEN; 
        const base_url = process.env.JFROG_BASE_URL;            

        if (!token) {
            console.error(chalk.red('Error: Please login with an admin account first.'));
            return null;
        }

        // Perform ping
        const pingSpinner = ora('Checking Artifactory system health...').start();
        
        try {
            const response = await axios.get(`${base_url}/api/system/ping`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10-second timeout
            });

            pingSpinner.succeed(chalk.green('Artifactory System Health Check Successful!'));
            
            // Offer detailed information and menu options
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do next?',
                    choices: [
                        'Show Detailed System Information',
                        'Return to Main Menu',
                        ...(returnToMainMenu ? [] : ['Exit'])
                    ]
                }
            ]);

            switch (action) {
                case 'Show Detailed System Information':
                    console.log(chalk.blue('\n📊 System Health Details:'));
                    console.log(JSON.stringify(response.data, null, 2));
                    
                    // Follow-up after showing details
                    const { nextAction } = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'nextAction',
                            message: 'What would you like to do?',
                            choices: [
                                'Return to Main Menu',
                                ...(returnToMainMenu ? [] : ['Exit'])
                            ]
                        }
                    ]);

                    switch (nextAction) {
                        case 'Return to Main Menu':
                            return 'main';
                        case 'Exit':
                            process.exit(0);
                    }
                    break;

                case 'Return to Main Menu':
                    return 'main';

                case 'Exit':
                    process.exit(0);
            }

        } catch (pingError) {
            pingSpinner.fail(chalk.red('Failed to ping Artifactory'));
            
            // Detailed error handling
            if (pingError.response) {
                switch (pingError.response.status) {
                    case 401:
                        console.error(chalk.red('🔒 Authentication failed. Check your access token and admin privileges.'));
                        break;
                    case 403:
                        console.error(chalk.red('🚫 Insufficient permissions to perform system ping.'));
                        break;
                    case 404:
                        console.error(chalk.red('❌ Ping endpoint not found.'));
                        break;
                    default:
                        console.error(chalk.red('❗ Unexpected server error:'), pingError.response.data);
                }
            } else if (pingError.request) {
                console.error(chalk.red('🌐 No response received from the server.'));
            } else {
                console.error(chalk.red('❗ Error setting up the request:'), pingError.message);
            }

            // Offer retry or return to main menu
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        'Retry Ping',
                        'Return to Main Menu',
                        ...(returnToMainMenu ? [] : ['Exit'])
                    ]
                }
            ]);

            switch (action) {
                case 'Retry Ping':
                    return pingMenu();
                case 'Return to Main Menu':
                    return 'main';
                case 'Exit':
                    process.exit(0);
            }
        }
    } catch (error) {
        console.error(chalk.red('Unexpected error:'), error.message);
        
        // Offer return to main menu on unexpected error
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',                
                message: 'What would you like to do?',
                choices: [
                    'Return to Main Menu',
                    ...(returnToMainMenu ? [] : ['Exit'])
                ]
            }
        ]);

        switch (action) {
            case 'Return to Main Menu':
                return 'main';
            case 'Exit':
                process.exit(0);
        }
    }
}

module.exports = { pingMenu };