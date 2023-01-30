@echo 2
if not exist Trampoline_Groep2_backend (
    echo cloning repo
    git clone --single-branch -b main https://github.com/JarneDel/Trampoline_Groep2_backend.git
)
cd Trampoline_Groep2_backend
echo pulling latest changes
git pull
echo installing node modules
call npm install
echo creating secrets file
echo SQL_PASSWORD=%1\n > .env
echo DB_NAME=%2 >> .env
echo starting server
call npm run start
pause