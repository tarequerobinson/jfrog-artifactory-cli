#!/usr/bin/env node

// Author: Tareque Robinson
const inquirer = require('inquirer');
const chalk = require('chalk');
const { pingMenu } = require('../src/cmds/ping');
const { versionMenu } = require('../src/cmds/version');

const { login } = require('../src/cmds/login');
const { allusers } = require('../src/cmds/allUsers');
const { createUser } = require('../src/cmds/createUser');
const { deleteUser } = require('../src/cmds/deleteUser');
const { allRepositories } = require('../src/cmds/allRepositories');
const { createRepository } = require('../src/cmds/createRepository');
const { updateRepository } = require('../src/cmds/updateRepository');



// Emoji Helper Function
const emoji = {
  users: '👥',
  showall: '📜',
  repos: '📦',
  help: '❓',
  create: '➕',
  delete: '❌',
  update: '📝',
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  health: '🩺',
  version: '📆'
};


// Main Menu Function
async function mainMenu() {
  console.clear();
  console.log(chalk.bold.blue('===== Tareque Robinson Artifactory Management CLI ====='));

  try {
    const { mainChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mainChoice',
        message: 'Select an option:',
        choices: [
          `${emoji.users} Users`,
          `${emoji.repos} Repositories`,
          `${emoji.help} Help`,
          // `${emoji.health} Ping`,
          // `${emoji.version} System Version`,
          'Exit'
        ]
      }
    ]);

    //Switch cases on how to handle each selection by triggering the relevant function
    switch (mainChoice) {
      case `${emoji.users} Users`:
        await usersMenu();
        break;
      case `${emoji.repos} Repositories`:
        await repositoriesMenu();
        break;
      case `${emoji.help} Help`:
        await helpMenu();
        break;
      case `${emoji.health} Ping`:
        await pingMenu();
        break;
      case `${emoji.version} System Version`:
        await versionMenu();
        break;
  
  
      case 'Exit':
        console.log(chalk.green('Goodbye! 👋'));
        process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red(`${emoji.error} An error occurred: ${error.message}`));
    await mainMenu();
  }
}


//Definition of Menu Functions: Users, Repositories, Help, Ping , System Info

// Users Menu Function
async function usersMenu() {
  console.clear();
  console.log(chalk.bold.blue(`${emoji.users} Users Management`));

  try {
    const { userAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'userAction',
        message: 'Select a user action:',
        choices: [
          `${emoji.create} Create User`,
          `${emoji.showall} Show All Users`,
          `${emoji.delete} Delete User`,
          // `${emoji.update} Update User`,
          'Back to Main Menu'
        ]
      }
    ]);

    switch (userAction) {
      case `${emoji.create} Create User`:

        await createUser();
        break;
      case `${emoji.showall} Show All Users`:
        await allusers();
        break;
      case `${emoji.delete} Delete User`:
        await deleteUser();
        break;

      // case `${emoji.update} Update User`:
      //   await updateUser();
      //   break;
      case 'Back to Main Menu':
        await mainMenu();
        return;
    }

    // Return to users menu after action
      await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Do you want to perform another user action?',
          default: true
        }
      ]).then(async (answers) => {
        if (answers.continue) {
          await usersMenu();
        } else {
          await mainMenu();
        }
      });



  } catch (error) {
    console.error(chalk.red(`${emoji.error} An error occurred: ${error.message}`));
    await mainMenu();
  }
}

// Repositories Menu Function
async function repositoriesMenu() {
  console.clear();
  console.log(chalk.bold.blue(`${emoji.repos} Repositories Management`));

  try {
    const { repoAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'repoAction',
        message: 'Select a repository action:',
        choices: [
          `${emoji.create} Create Repository`,
          `${emoji.showall} List All Repositories`,
          `${emoji.update} Update Repository`,
          'Back to Main Menu'
        ]
      }
    ]);

    switch (repoAction) {
      case `${emoji.create} Create Repository`:
        await createRepository();
        break;
      case `${emoji.showall} List All Repositories`:
        await allRepositories();
        break;

      case `${emoji.update} Update Repository`:
        await updateRepository();
        break;
      
      case 'Back to Main Menu':
        await mainMenu();
        return;
    }

    // Return to repositories menu after action
    await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to perform another repository action?',
        default: true
      }
    ]).then(async (answers) => {
      if (answers.continue) {
        await repositoriesMenu();
      } else {
        await mainMenu();
      }
    });



  } catch (error) {
    console.error(chalk.red(`${emoji.error} An error occurred: ${error.message}`));
    // await mainMenu();
  }
}

// Help Menu Function
async function helpMenu() {
  console.clear();
  console.log(chalk.bold.blue(`${emoji.help} Help & Documentation`));

  try {
    const { helpAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'helpAction',
        message: 'Select help option:',
        choices: [
          'CLI Usage Guide',
          'About Artifactory CLI',
          'Back to Main Menu'
        ]
      }
    ]);

    switch (helpAction) {
      case 'CLI Usage Guide':
        console.log(chalk.green(`
          ${emoji.info} CLI Usage Guide:
          - Navigate through menus using arrow keys
          - Press Enter to select an option
          ${emoji.info} APIs Implemented:
          - Create User
          - Get All Users
          - Delete User
          - Create Repository
          - Update Repository by repokey
          - List Repositories

        `));
        break;
        case 'About Artifactory CLI': 
        console.log(chalk.green(` 
          ${emoji.info} About Artifactory CLI: 
          - Version: 1.0.0 
          - Purpose: Manage Artifactory SaaS Instance 
          - Features: User & Repository Management 
          - Link to my Design Doc/Just me documenting challenges faced and how I resolved them: \x1b[4m\x1b[34mhttps://docs.google.com/document/d/1mI-_2oTG38yiQgCSwgY2OwPFQzx1HY_8OD2LufgXsXo/edit?usp=sharing\x1b[0m 
          `)); 
        break;
        case 'Back to Main Menu':
        await mainMenu();
        return;
    }

    // Return to help menu after action
    await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to see another help option?',
        default: true
      }
    ]).then(async (answers) => {
      if (answers.continue) {
        await helpMenu();
      } else {
        await mainMenu();
      }
    });
  } catch (error) {
    console.error(chalk.red(`${emoji.error} An error occurred: ${error.message}`));
    await mainMenu();
  }
}

// Start the CLI
async function startCLI() {
  console.clear();
  console.log(chalk.bold.blue('Tareque Robinson Artifactory Saas Instance CLI Tool 🚀'));

  try {
    // Attempt login first
    await login();

    // If login is successful, proceed to main menu
    await mainMenu();
  } catch (error) {
    console.error(chalk.red(`${emoji.error} Login failed. Exiting...`));
    process.exit(1);
  }
}

// Execute the CLI
startCLI();

module.exports = { startCLI, mainMenu };