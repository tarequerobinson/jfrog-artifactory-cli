const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');
require('dotenv').config(); // Load environment variables

async function updateRepository() {
    try {
        // Token and base URL validation
        const token = process.env.JFROG_ACCESS_TOKEN;
        const base_url = process.env.JFROG_BASE_URL;

        if (!token) {
            console.error(chalk.red('Error: Please login with an admin account first.'));
            return;
        }

        // Fetch existing repositories to select from
        const reposResponse = await axios.get(`${base_url}/artifactory/api/repositories`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        // Prepare repository selection
        const { selectedRepo } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedRepo',
                message: 'Select repository to update:',
                choices: reposResponse.data.map(repo => ({
                    name: `${repo.key} (${repo.type})`,
                    value: repo
                }))
            }
        ]);

        // Comprehensive update options
        const updateOptions = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'configOptions',
                message: 'Select configuration options to update:',
                choices: [
                    'Description',
                    'URL (for remote repositories)',
                    'Package Type',
                    'Environment Settings',
                    'Authentication',
                    'Proxy Settings',
                    'Advanced Repository Settings'
                ]
            }
        ]);

        // Prepare configuration update
        const updatedConfig = { ...selectedRepo };

        // Conditional updates based on selected options
        if (updateOptions.configOptions.includes('Description')) {
            const { description } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'description',
                    message: 'Enter new repository description:',
                    default: selectedRepo.description
                }
            ]);
            updatedConfig.description = description;
        }

        // URL update for remote repositories
        if (updateOptions.configOptions.includes('URL (for remote repositories)') && selectedRepo.type === 'remote') {
            const { url } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'url',
                    message: 'Enter new remote repository URL:',
                    default: selectedRepo.url,
                    validate: input => /^https?:\/\//.test(input) || 'Please enter a valid URL'
                }
            ]);
            updatedConfig.url = url;
        }

        // Package Type update
        if (updateOptions.configOptions.includes('Package Type')) {
            const { packageType } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'packageType',
                    message: 'Select new package type:',
                    choices: [
                        'bower', 'cargo', 'chef', 'cocoapods', 'composer', 
                        'conan', 'cran', 'debian', 'docker', 'gems', 
                        'gitlfs', 'go', 'gradle', 'helm', 'ivy', 
                        'maven', 'nuget', 'opkg', 'p2', 'pub', 
                        'puppet', 'pypi', 'rpm', 'sbt', 'swift', 
                        'terraform', 'vagrant', 'yum', 'generic'
                    ],
                    default: selectedRepo.packageType
                }
            ]);
            updatedConfig.packageType = packageType;
        }

        // Environment Settings
        if (updateOptions.configOptions.includes('Environment Settings')) {
            const { environments } = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'environments',
                    message: 'Select environments:',
                    choices: ['DEV', 'PROD', 'TEST', 'STAGING'],
                    default: selectedRepo.environments || []
                }
            ]);
            updatedConfig.environments = environments;
        }

        // Authentication Settings
        if (updateOptions.configOptions.includes('Authentication')) {
            const authDetails = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'enableAuthentication',
                    message: 'Enable token authentication?',
                    default: false
                },
                {
                    type: 'input',
                    name: 'username',
                    message: 'Enter username (optional):',
                    when: (answers) => answers.enableAuthentication
                },
                {
                    type: 'password',
                    name: 'password',
                    message: 'Enter password (optional):',
                    when: (answers) => answers.enableAuthentication
                }
            ]);

            if (authDetails.enableAuthentication) {
                updatedConfig.enableTokenAuthentication = true;
                if (authDetails.username) updatedConfig.username = authDetails.username;
                if (authDetails.password) updatedConfig.password = authDetails.password;
            }
        }

        // Proxy Settings
        if (updateOptions.configOptions.includes('Proxy Settings')) {
            const proxySettings = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'useProxy',
                    message: 'Enable proxy?',
                    default: false
                },
                {
                    type: 'input',
                    name: 'proxyUrl',
                    message: 'Enter proxy URL:',
                    when: (answers) => answers.useProxy,
                    validate: input => /^https?:\/\//.test(input) || 'Please enter a valid URL'
                }
            ]);

            if (proxySettings.useProxy) {
                updatedConfig.proxy = proxySettings.proxyUrl;
                updatedConfig.disableProxy = false;
            } else {
                updatedConfig.disableProxy = true;
            }
        }

        // Advanced Repository Settings
        if (updateOptions.configOptions.includes('Advanced Repository Settings')) {
            const advancedSettings = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'xrayIndex',
                    message: 'Enable Xray indexing?',
                    default: false
                },
                {
                    type: 'confirm',
                    name: 'blockMismatchingMimeTypes',
                    message: 'Block mismatching MIME types?',
                    default: true
                }
            ]);

            updatedConfig.xrayIndex = advancedSettings.xrayIndex;
            updatedConfig.blockMismatchingMimeTypes = advancedSettings.blockMismatchingMimeTypes;
        }

        // Send the PUT request to update repository
        const response = await axios.post(
            `${base_url}/artifactory/api/repositories/${selectedRepo.key}`, 
            updatedConfig, 
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                }
            }
        );

        // Display success message
        console.log(chalk.green('🎉 Repository Updated Successfully! 🎉'));
        console.log(chalk.blue('Updated Repository Details:'));
        console.log(chalk.yellow('Key:'), selectedRepo.key);
        console.log(chalk.yellow('Type:'), selectedRepo.type);
        console.log(chalk.yellow('Updated Configuration:'));
        console.log(JSON.stringify(updatedConfig, null, 2));

        return updatedConfig;

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
                    console.error(chalk.yellow('❌ Invalid repository configuration.'));
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

module.exports = { updateRepository };