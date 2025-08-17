#!/bin/bash

# Script de démarrage pour l'API avec environnement Python virtuel
# Usage: ./start-with-python.sh

echo "🐍 Activation de l'environnement Python virtuel..."

# Vérifier si l'environnement virtuel existe
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel Python..."
    python3 -m venv venv
    
    echo "📥 Installation des dépendances Python..."
    source venv/bin/activate
    pip install requests
else
    echo "✅ Environnement virtuel trouvé"
fi

# Activer l'environnement virtuel
source venv/bin/activate

echo "🐍 Python activé dans l'environnement virtuel"
echo "Version Python: $(python --version)"
echo "Packages installés:"
pip list | grep -E "(requests|certifi)"

echo ""
echo "🚀 Démarrage de l'API Node.js..."
echo "L'API utilisera automatiquement l'environnement Python virtuel"
echo ""

# Démarrer l'API Node.js
if [ "$1" = "dev" ]; then
    echo "🔧 Mode développement"
    npm run dev
else
    echo "🏭 Mode production"
    npm start
fi
