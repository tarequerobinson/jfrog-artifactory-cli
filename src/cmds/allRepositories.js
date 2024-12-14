const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { table } = require('table');
require('dotenv').config(); // Load environment variables

async function allRepositories() {
    try {
        const token = process.env.JFROG_ACCESS_TOKEN;
        const base_url = process.env.JFROG_BASE_URL;

        if (!token) {
            console.error(chalk.red('Error: Please login with an admin account first.'));
            return null;
        }

        // Advanced filtering options
        const filterChoices = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'filters',
                message: 'Select repository filtering options:',
                choices: [
                    'Filter by Repository Type',
                    'Filter by Package Type',
                    'Filter by Project'
                ]
            }
        ]);

        // Prepare query parameters
        const queryParams = new URLSearchParams();

        // Repository Type filtering
        if (filterChoices.filters.includes('Filter by Repository Type')) {
            const { repoType } = await inquirer.prompt([{
                type: 'list',
                name: 'repoType',
                message: 'Select Repository Type:',
                choices: ['local', 'remote', 'virtual', 'federated', 'distribution']
            }]);
            queryParams.append('type', repoType);
        }

        // Package Type filtering
        if (filterChoices.filters.includes('Filter by Package Type')) {
            const { packageType } = await inquirer.prompt([{
                type: 'list',
                name: 'packageType',
                message: 'Select Package Type:',
                choices: [
                    'bower', 'cargo', 'chef', 'cocoapods', 'composer', 
                    'conan', 'cran', 'debian', 'docker', 'gems', 
                    'gitlfs', 'go', 'gradle', 'helm', 'ivy', 
                    'maven', 'nuget', 'opkg', 'p2', 'pub', 
                    'puppet', 'pypi', 'rpm', 'sbt', 'swift', 
                    'terraform', 'vagrant', 'yum', 'generic'
                ]
            }]);
            queryParams.append('packageType', packageType);
        }

        // Project filtering
        if (filterChoices.filters.includes('Filter by Project')) {
            const { projectKey } = await inquirer.prompt([{
                type: 'input',
                name: 'projectKey',
                message: 'Enter Project Key:',
                validate: input => input.trim() ? true : 'Project key cannot be empty'
            }]);
            queryParams.append('project', projectKey);
        }

        // Construct full URL with query parameters
        const url = `${base_url}/artifactory/api/repositories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        // Make the API call
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        // Prepare table data
        const tableData = [
            [
                chalk.bold.blue('Repository Key'), 
                chalk.bold.blue('Type'), 
                chalk.bold.blue('Package Type'), 
                chalk.bold.blue('Description')
            ]
        ];

        // Process and display repositories
        response.data.forEach(repo => {
            tableData.push([
                chalk.green(repo.key),
                chalk.cyan(repo.type || 'N/A'),
                chalk.magenta(repo.packageType || 'N/A'),
                chalk.white(repo.description || 'No description')
            ]);
        });

        // Display repositories in a table
        console.log(chalk.bold.blue('\n📋 Repository List:'));
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

        return response.data;

    } catch (error) {
        // Comprehensive error handling
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

module.exports = { allRepositories };