const axios = require('axios');
const inquirer = require('inquirer');
require('dotenv').config();
const chalk = require('chalk');
const ora = require('ora');

/**
 * Retrieves and displays JFrog Artifactory system information
 * @param {boolean} [returnToMainMenu=false] - Flag to determine menu behavior
 * @returns {Promise<string>} - Next menu action
 */
async function versionMenu(returnToMainMenu = false) {
  try {
    // Validate required environment variables
    const token = process.env.JFROG_ACCESS_TOKEN;
    const base_url = process.env.JFROG_BASE_URL;

    if (!token || !base_url) {
      throw new Error('Missing JFROG_ACCESS_TOKEN or JFROG_BASE_URL in environment variables');
    }

    // Start spinner for system health check
    const pingSpinner = ora('Checking Artifactory system health...').start();

    try {
      // Make API call to system info endpoint
      const response = await axios.get(`${base_url}/api/system`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain' // Specify text/plain as per documentation
        },
        timeout: 30000 // 30-second timeout
      });

      // Stop spinner on successful response
      pingSpinner.succeed(chalk.green('Artifactory System Health Check Successful!'));

      // Prepare menu options
      const menuOptions = [
        { name: 'Show Detailed System Information', value: 'details' },
        { name: 'Return to Main Menu', value: 'main' }
      ];

      // Add exit option if not explicitly told to return to main menu
      if (!returnToMainMenu) {
        menuOptions.push({ name: 'Exit', value: 'exit' });
      }

      // Prompt user for next action
      const actionPrompt = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do next?',
          choices: menuOptions
        }
      ]);

      // Handle user action
      switch (actionPrompt.action) {
        case 'details':
          console.log(chalk.blue('\n📊 System Health Details:'));
          console.log(response.data); // Display system info directly

          // Follow-up prompt after showing details
          const detailFollowup = await inquirer.prompt([
            {
              type: 'list',
              name: 'nextAction',
              message: 'What would you like to do?',
              choices: [
                { name: 'Return to Main Menu', value: 'main' },
                { name: 'Exit', value: 'exit' }
              ]
            }
          ]);

          return detailFollowup.nextAction === 'main' ? 'main' : process.exit(0);

        case 'main':
          return 'main';

        case 'exit':
        default:
          process.exit(0);
      }
    } catch (pingError) {
      // Handle ping/connection errors
      pingSpinner.fail(chalk.red('Failed to retrieve Artifactory system information'));
      console.error(chalk.red('Error details:'), pingError.message);

      // Offer retry or return to main menu
      const retryPrompt = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Retry', value: 'retry' },
            { name: 'Return to Main Menu', value: 'main' },
            { name: 'Exit', value: 'exit' }
          ]
        }
      ]);

      switch (retryPrompt.action) {
        case 'retry':
          return versionMenu(returnToMainMenu);
        case 'main':
          return 'main';
        case 'exit':
        default:
          process.exit(0);
      }
    }
  } catch (error) {
    // Handle unexpected errors
    console.error(chalk.red('Unexpected error:'), error.message);

    // Offer return to main menu on unexpected error
    const errorPrompt = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Return to Main Menu', value: 'main' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    return errorPrompt.action === 'main' ? 'main' : process.exit(0);
  }
}

module.exports = { versionMenu };