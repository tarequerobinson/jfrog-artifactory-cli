const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');

async function login() {
  try {
    const credentials = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter your username:',
        validate: input => !!input.trim() || 'Username cannot be empty'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        mask: '*',
        validate: input => !!input.trim() || 'Password cannot be empty'
      }
    ]);

    console.log(chalk.yellow('\nAuthenticating...'));

    // Temporary hardcoded login
    if (credentials.username === 'user' && credentials.password === '1234') {
      console.log(chalk.green('✅ Login successful!'));      
      return true;
    } else {
      console.log(chalk.red('❌ Login failed: Invalid credentials'));
      
      // Prompt to retry
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: 'Would you like to try logging in again?',
          default: true
        }
      ]);

      if (retry) {
        return login(); // Recursive retry
      } else {
        console.log(chalk.yellow('Exiting CLI...'));
        process.exit(0);
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Login error:'), error.message);
    throw error;
  }
}

module.exports = { login };