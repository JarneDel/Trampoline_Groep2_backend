@echo off
:: check if node exists
where node
if errorlevel 1 (
    echo node not found
    echo please install node: https://nodejs.org/en/download/ version 18 and try again
    pause
    exit
) else (
    echo node found
)
:: check if git exists
where git
if errorlevel 1 (
    echo git not found
    echo please install git: https://git-scm.com/downloads and try again
    pause
    exit
)
:: check if npm exists
where npm
if errorlevel 1 (
    echo npm not found
    echo please install npm: https://www.npmjs.com/get-npm and try again
    pause
    exit
)

echo pulling latest changes
git pull
echo installing node modules
call npm install
echo creating secrets file
:: check if argument 1 exists
if not defined 1 (
    echo argument 1 does not exist
    echo please provide a password for the database
    pause
    exit
)
echo SQL_PASSWORD=%1\n > .env
:: check if argument 2 exists
if not defined 2  (
    echo argument 2 does not exist
    echo please provide the database name for the mysql server
    pause
    exit
)
echo DB_NAME=%2 >> .env
echo starting server
call npm run start
pause