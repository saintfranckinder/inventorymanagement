@echo off
rem Lance le serveur local et ouvre l'application dans le navigateur.
rem Pour arreter : fermer cette fenetre.
title Gestion de stock - serveur local
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0outils\serveur-local.ps1"
if errorlevel 1 pause
