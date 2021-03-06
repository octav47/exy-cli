#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const program = require('commander');
const { prompt } = require('inquirer');
const shell = require('shelljs');
const Spinner = require('cli-spinner').Spinner;

const questions = require('./questions');
const getTemplatePath = template => `src/${template}`;

clear();

console.log(
  chalk.green(
    figlet.textSync('EXY  CLI', { horizontalLayout: 'full' })
  )
);


program
  .version('0.0.1')
  .description('EXY CLI');

program
  .command('init')
  .action(prompt(questions).then(answers => {
    const packagePath = path.resolve(__dirname, getTemplatePath(answers.template), 'package.json');

    fs.readFile(packagePath, 'utf8', (err, data) => {
      const baseConfig = JSON.parse(data);
      const packageJSONBaseConfig = {
        ...baseConfig,
        ...answers
      };

      const templatePath = getTemplatePath(answers.template);

      copyFolderRecursiveSync(path.resolve(__dirname, templatePath), process.cwd());

      fs.renameSync(path.resolve(__dirname, answers.template), path.resolve(__dirname, answers.name));

      const spinner = new Spinner('Installing dependencies.. %s');
      spinner.setSpinnerString('|/-\\');
      spinner.start();

      fs.writeFile(`${answers.name}/package.json`, JSON.stringify(packageJSONBaseConfig, null, 2), (err) => {
        if (err) {
          console.log(err);
        }


        shell.cd(answers.name);
        const install = shell.exec('npm install', { async: true });

        install.stdout.on('data', () => {
          spinner.stop();
        });

      });
    });


  }));

program.parse(process.argv);


function copyFileSync(source, target) {

  let targetFile = target;

  //if target is a directory a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
  let files = [];

  //check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}
