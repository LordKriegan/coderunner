#!/usr/bin/env node
const { prompt } = require('inquirer');
const { writeFile, existsSync, mkdirSync } = require('fs');
const childProcess = require('child_process');
const { join } = require('path');
const rimraf = require('rimraf');
/*
https://stackoverflow.com/questions/22646996/how-do-i-run-a-node-js-script-from-within-another-node-js-script
function written by fshost
*/

const runScript = (scriptPath, callback) => {
    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;
    var process = childProcess.fork(scriptPath);
    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });
    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}

const installDependencies = (dependencies) => {
    const codeDir = join(__dirname, '/code')
    if (!existsSync(codeDir)) mkdirSync(codeDir)
    if (!dependencies) return;
    childProcess.execSync("npm install --prefix ./code " + dependencies, { stdio: [0, 1, 2] });
}

const promptCode = () => {
    prompt([{
        name: "dependencies",
        type: "input",
        message: "Enter a space seperated list of dependencies"
    }, {
        name: "code",
        type: "editor",
        message: "Write some Code"
    }])
        .then(({ code, dependencies }) => {
            const path = join(__dirname, '/code/code.js');
            installDependencies(dependencies);
            writeFile(path, code, err => {
                if (err) throw err;
                runScript(path, err => {
                    if (err) throw err;
                    rimraf(join(__dirname, '/code'), err => {
                        if (err) throw err;
                        main()
                    });
                });
            });
        });
}

const main = () => {
    prompt([{
        name: "main",
        type: "list",
        message: "What would you like to do?",
        choices: ["Write Code", "Exit"]
    }])
        .then(({ main }) => {
            switch (main) {
                case "Write Code":
                    promptCode();
                    break;
                case "Exit":
                default:
                    console.log("Goodbye!");
                    process.exit();
                    break;
            }
        });
}

main();