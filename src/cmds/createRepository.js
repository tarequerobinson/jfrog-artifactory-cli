const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');
require('dotenv').config(); // Load environment variables

async function createRepository() {
    try {
        // Token for authentication 
        const token = process.env.JFROG_ACCESS_TOKEN ; 
        const base_url = process.env.JFROG_BASE_URL            
                    
        if (!token) {
            console.error(chalk.red('Error: Please login with an admin account first.'));
            return;
        }

        // Prompt for repository details with validation
        const repoDetails = await inquirer.prompt([
            {
                type: 'list',
                name: 'repoType',
                message: 'Select repository type:',
                choices: ['remote']
            },
            {
                type: 'input',
                name: 'repoKey',
                message: 'Enter repository key:',
                validate: (input) => !!input.trim() || 'Repository key cannot be empty'
            },
            {
                type: 'list',
                name: 'packageType',
                message: 'Select package type:',
                choices: ['npm']
            },
            {
                type: 'input',
                name: 'url',
                message: 'Enter remote repository URL:',
                default: 'https://registry.npmjs.org/',

                validate: (input) => /^https?:\/\//.test(input) || 'Please enter a valid URL'
            }
        ]);

        // Comprehensive repository configuration template
        const jsonConfig = {
            key: repoDetails.repoKey,
            projectKey: "",
            rclass: "remote",
            packageType: repoDetails.packageType,
            url: repoDetails.url,
            environments: ["DEV"],
            username: "",
            password: "",
            proxy: "",
            disableProxy: false,
            description: `${repoDetails.repoKey} ${repoDetails.packageType} remote repository`,
            notes: "Configured via automated script",
            includesPattern: "**/*",
            excludesPattern: "",
            repoLayoutRef: "maven-2-default",
            remoteRepoLayoutRef: "",
            remoteRepoChecksumPolicyType: "generate-if-absent",
            handleReleases: true,
            handleSnapshots: true,
            maxUniqueSnapshots: 0,
            suppressPomConsistencyChecks: false,
            hardFail: false,
            offline: false,
            blackedOut: false,
            storeArtifactsLocally: true,
            socketTimeoutMillis: 15000,
            localAddress: "",
            retrievalCachePeriodSecs: 7200,
            missedRetrievalCachePeriodSecs: 1800,
            unusedArtifactsCleanupPeriodHours: 0,
            assumedOfflinePeriodSecs: 300,
            fetchJarsEagerly: false,
            fetchSourcesEagerly: false,
            shareConfiguration: false,
            synchronizeProperties: false,
            blockMismatchingMimeTypes: true,
            xrayIndex: false,
            propertySets: [],
            allowAnyHostAuth: false,
            enableCookieManagement: false,
            enableTokenAuthentication: false,
            forceNugetAuthentication: false,
            forceP2Authentication: false,
            forceConanAuthentication: false,
            metadataRetrievalTimeoutSecs: 60,
            bowerRegistryUrl: "https://registry.bower.io",
            gitRegistryUrl: "https://github.com/rust-lang/crates.io-index",
            composerRegistryUrl: "https://packagist.org",
            pyPIRegistryUrl: "https://pypi.org",
            vcsType: "GIT",
            vcsGitProvider: "GITHUB",
            vcsGitDownloadUrl: "",
            bypassHeadRequests: false,
            clientTlsCertificate: "",
            externalDependenciesEnabled: false,
            externalDependenciesPatterns: [],
            downloadRedirect: false,
            cdnRedirect: false,
            feedContextPath: "api/v2",
            downloadContextPath: "api/v2/package",
            v3FeedUrl: "https://api.nuget.org/v3/index.json",
            contentSynchronisation: {
                enabled: false,
                statistics: {
                    enabled: false
                },
                properties: {
                    enabled: false
                },
                source: {
                    originAbsenceDetection: false
                }
            },
            blockPushingSchema1: false,
            priorityResolution: false,
            disableUrlNormalization: false
        };

        // Send the PUT request to create a repository
        const response = await axios.put(
            `${base_url}/artifactory/api/repositories/${repoDetails.repoKey}`, 
            jsonConfig, 
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                }
            }
        );

        // Display detailed success message
        console.log(chalk.green('🎉 Repository Created Successfully! 🎉'));
        console.log(chalk.blue('Repository Details:'));
        console.log(chalk.yellow('Key:'), repoDetails.repoKey);
        console.log(chalk.yellow('Type:'), 'remote');
        console.log(chalk.yellow('Package Type:'), repoDetails.packageType);
        console.log(chalk.yellow('URL:'), repoDetails.url);
        
        // Print full response data with formatting
        console.log(chalk.blue('\nFull Response:'));
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.response) {
            // Handle response errors
            switch (error.response.status) {
                case 401:
                    console.error(chalk.purple('Authentication failed. Check your access token and admin privileges.'));
                    break;
                case 403:
                    console.error(chalk.red('Insufficient permissions. Ensure you have admin access.'));
                    break;
                case 400:
                    console.error(chalk.orange('Invalid repository configuration or repository already exists.'));
                    break;
                default:
                    console.error(chalk.red('Unexpected error:'), error.response.data);
            }
        } else if (error.request) {
            console.error(chalk.red('No response received from the server.'));
        } else {
            console.error(chalk.red('Error setting up the request:'), error.message);
        }
        throw error;
    }
}

module.exports = { createRepository };