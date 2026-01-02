@echo off
echo Updating App.css with new styles...
copy /Y frontend\src\App-new.css frontend\src\App.css
echo Done! App.css updated with dark mode support.
del frontend\src\App-new.css
echo Temporary file removed.
pause
