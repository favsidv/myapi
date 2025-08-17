const express = require('express');
const flareController = require('../controllers/flareController');

const router = express.Router();

// Route pour soumettre une recommandation au FDC
router.post('/submit-recommendation', flareController.submitRecommendationToFDC);

// Route pour récupérer les données attestées
router.get('/attested-recommendation', flareController.getAttestedRecommendation);

// Route pour vérifier une attestation avec preuve Merkle
router.post('/verify-attestation', flareController.verifyAttestation);

// Route pour obtenir le statut du réseau Flare
router.get('/network-status', flareController.getFlareNetworkStatus);

// Route pour le workflow complet (génération + soumission)
router.post('/generate-and-submit', flareController.generateAndSubmitRecommendation);

// Route pour l'historique des attestations
router.get('/attestation-history', flareController.getAttestationHistory);

// Routes pour interagir avec le contrat smart contract
router.get('/contract/recommendation', flareController.getContractRecommendation);
router.get('/contract/should-follow', flareController.shouldFollowContractRecommendation);
router.get('/contract/recommendation-age', flareController.getRecommendationAge);
router.get('/contract/is-fresh', flareController.isRecommendationFresh);
router.get('/contract/history', flareController.getContractRecommendationHistory);
router.get('/contract/info', flareController.getContractInfo);

// Route pour le workflow complet (génération → FDC → contrat)
router.post('/complete-workflow', flareController.generateSubmitAndUpdateContract);

// Documentation des routes Flare
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    title: 'Flare Data Connector API',
    description: 'API endpoints for interacting with Flare blockchain and FDC',
    endpoints: [
      {
        path: '/flare/submit-recommendation',
        method: 'POST',
        description: 'Submit a recommendation to FDC for attestation',
        body: {
          apiUrl: 'string (optional) - URL of the API to attest',
          jqTransform: 'string (optional) - JQ transformation to apply'
        }
      },
      {
        path: '/flare/attested-recommendation',
        method: 'GET',
        description: 'Retrieve attested data from FDC',
        query: {
          apiUrl: 'string (required) - Original API URL',
          timestamp: 'number (required) - Timestamp of the attestation',
          jqTransform: 'string (optional) - JQ transformation used'
        }
      },
      {
        path: '/flare/verify-attestation',
        method: 'POST',
        description: 'Verify an attestation using Merkle proof',
        body: {
          merkleRoot: 'string (required) - Merkle root of the attestation cycle',
          merkleProof: 'array (required) - Merkle proof path',
          data: 'string (required) - Data to verify'
        }
      },
      {
        path: '/flare/network-status',
        method: 'GET',
        description: 'Get Flare network status and connection info'
      },
      {
        path: '/flare/generate-and-submit',
        method: 'POST',
        description: 'Complete workflow: generate recommendation and submit to FDC'
      },
      {
        path: '/flare/attestation-history',
        method: 'GET',
        description: 'Get attestation history for a given API URL',
        query: {
          apiUrl: 'string (required) - API URL to check history for'
        }
      },
      {
        path: '/flare/contract/recommendation',
        method: 'GET',
        description: 'Get latest recommendation from smart contract'
      },
      {
        path: '/flare/contract/should-follow',
        method: 'GET',
        description: 'Check if recommendation should be followed based on confidence',
        query: {
          minConfidence: 'number (optional) - Minimum confidence threshold (0-1000, default: 500)'
        }
      },
      {
        path: '/flare/contract/recommendation-age',
        method: 'GET',
        description: 'Get age of latest recommendation in seconds/minutes/hours'
      },
      {
        path: '/flare/contract/is-fresh',
        method: 'GET',
        description: 'Check if recommendation is fresh (within max age)',
        query: {
          maxAge: 'number (optional) - Maximum age in seconds (default: 3600)'
        }
      },
      {
        path: '/flare/contract/history',
        method: 'GET',
        description: 'Get recommendation history from contract events',
        query: {
          fromBlock: 'number (optional) - Starting block number',
          toBlock: 'number|string (optional) - Ending block number or "latest"'
        }
      },
      {
        path: '/flare/contract/info',
        method: 'GET',
        description: 'Get contract and network connection information'
      },
      {
        path: '/flare/complete-workflow',
        method: 'POST',
        description: 'Complete workflow: generate → submit to FDC → update contract'
      }
    ],
    networks: {
      supported: 'Flare Coston2 Testnet',
      chainId: 114,
      fdcSupport: 'JsonApi attestation type'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
