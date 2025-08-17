#!/usr/bin/env python3
"""
Script de test pour le modèle Aave vs Morpho
Simule des données CoinGecko pour tester le modèle sans API
"""

import json
import sys
import os
from datetime import datetime, timezone

# Ajouter le répertoire courant au path pour importer le modèle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from model import run, compute_regime, score_protocols, recommend
except ImportError as e:
    print(f"Erreur d'import du modèle: {e}")
    sys.exit(1)

def create_mock_data():
    """Crée des données factices au format attendu par le modèle"""
    return {
        "btc_dominance": {"value": 52.3},
        "defi_tvl": {"value": 120000000000},  # 120B USD
        "volumes": {
            "cex_24h_btc": 45000,  # Volume CEX en BTC
            "dex_24h_btc": 5000    # Volume DEX en BTC
        },
        "stablecoins": {
            "usdt": {"deviation": "0.12%"},  # Légère déviation
            "usdc": {"deviation": "-0.08%"}
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def test_model_components():
    """Test les composants individuels du modèle"""
    print("🧪 Test des composants du modèle...")
    
    mock_data = create_mock_data()
    
    try:
        # Test 1: Calcul du régime
        regime = compute_regime(mock_data)
        print(f"✅ Régime calculé:")
        print(f"   Risk-off: {regime.risk_off:.3f}")
        print(f"   Activité on-chain: {regime.onchain_activity:.3f}")
        print(f"   Stabilité peg: {regime.peg_stability:.3f}")
        
        # Test 2: Scores des protocoles
        scores = score_protocols(regime)
        print(f"✅ Scores calculés:")
        print(f"   Aave: {scores.aave:.3f}")
        print(f"   Morpho: {scores.morpho:.3f}")
        
        # Test 3: Recommandation finale
        recommendation = recommend(scores)
        print(f"✅ Recommandation: {recommendation['suggestion']}")
        print(f"   Confiance: {recommendation['confidence']:.1%}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur dans les composants: {e}")
        return False

def test_full_model():
    """Test du modèle complet en mode simulation"""
    print("\n🎯 Test du modèle complet...")
    
    try:
        # Créer un fichier temporaire avec des données factices
        mock_data = {
            "success": True,
            "data": create_mock_data()
        }
        
        # Simuler l'appel du modèle avec des données factices
        import tempfile
        import http.server
        import socketserver
        import threading
        import time
        
        # Créer un serveur HTTP temporaire pour servir les données
        class MockHandler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(mock_data).encode())
            
            def log_message(self, format, *args):
                return  # Supprimer les logs
        
        # Démarrer le serveur sur un port libre
        port = 9999
        with socketserver.TCPServer(("", port), MockHandler) as httpd:
            # Démarrer le serveur dans un thread
            server_thread = threading.Thread(target=httpd.serve_forever)
            server_thread.daemon = True
            server_thread.start()
            
            print(f"📡 Serveur mock démarré sur port {port}")
            
            # Attendre que le serveur soit prêt
            time.sleep(0.5)
            
            # Tester le modèle avec l'URL mock
            mock_url = f"http://localhost:{port}/api/mock-data"
            result = run(mock_url)
            
            # Arrêter le serveur
            httpd.shutdown()
            
            print("✅ Modèle exécuté avec succès!")
            print("📊 Résultat:")
            print(json.dumps(result, indent=2))
            
            return True
            
    except Exception as e:
        print(f"❌ Erreur dans le test complet: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Fonction principale de test"""
    print("🧪 Test du modèle Python Aave vs Morpho\n")
    
    # Test des imports
    print("📦 Vérification des imports...")
    try:
        import requests
        print("✅ requests importé")
    except ImportError:
        print("❌ requests manquant")
        return False
    
    try:
        import json
        print("✅ json disponible")
    except ImportError:
        print("❌ json manquant")
        return False
    
    # Test des composants
    if not test_model_components():
        return False
    
    # Test complet
    if not test_full_model():
        return False
    
    print("\n🎉 Tous les tests passés!")
    print("Le modèle Python est opérationnel.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
