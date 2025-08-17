const flareService = require('../services/flareService');
const contractService = require('../services/contractService');

class FlareController {
  
  /**
   * Soumet la recommandation Aave/Morpho au FDC pour attestation
   */
  async submitRecommendationToFDC(req, res, next) {
    try {
      const { apiUrl, jqTransform } = req.body;
      
      if (!apiUrl) {
        return res.status(400).json({
          success: false,
          error: 'API URL is required'
        });
      }

      // Par défaut, utiliser l'URL de la recommandation locale
      const targetUrl = apiUrl || `${req.protocol}://${req.get('host')}/api/aave-morpho-recommendation`;
      const transform = jqTransform || '.data'; // Extraire seulement les données de recommandation

      console.log('Submitting recommendation to FDC:', targetUrl);

      const result = await flareService.submitDataToFDC(targetUrl, transform);

      res.json({
        success: result.success,
        message: result.success ? 'Recommendation submitted to FDC successfully' : 'Failed to submit to FDC',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les données attestées depuis le FDC
   */
  async getAttestedRecommendation(req, res, next) {
    try {
      const { apiUrl, timestamp, jqTransform } = req.query;
      
      if (!apiUrl || !timestamp) {
        return res.status(400).json({
          success: false,
          error: 'API URL and timestamp are required'
        });
      }

      const transform = jqTransform || '.data';
      const result = await flareService.getAttestedData(apiUrl, parseInt(timestamp), transform);

      res.json({
        success: result.success,
        message: result.proved ? 'Attested data retrieved successfully' : 'Attestation not yet finalized',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie une attestation avec une preuve Merkle
   */
  async verifyAttestation(req, res, next) {
    try {
      const { merkleRoot, merkleProof, data } = req.body;
      
      if (!merkleRoot || !merkleProof || !data) {
        return res.status(400).json({
          success: false,
          error: 'Merkle root, merkle proof, and data are required'
        });
      }

      const result = await flareService.verifyAttestationData(merkleRoot, merkleProof, data);

      res.json({
        success: result.success,
        verified: result.verified,
        message: result.verified ? 'Attestation verified successfully' : 'Attestation verification failed',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère le statut du réseau Flare
   */
  async getFlareNetworkStatus(req, res, next) {
    try {
      const result = await flareService.getNetworkStatus();

      res.json({
        success: result.success,
        network: result.success ? 'Flare Coston2 Testnet' : 'Unknown',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Workflow complet : génère une recommandation et la soumet au FDC
   */
  async generateAndSubmitRecommendation(req, res, next) {
    try {
      // 1. Générer la recommandation via le modèle Python
      const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
      const recommendationUrl = `${apiBaseUrl}/api/aave-morpho-recommendation`;
      
      console.log('Generating recommendation...');
      
      // 2. Soumettre au FDC
      const fdcResult = await flareService.submitDataToFDC(recommendationUrl, '.data');
      
      if (!fdcResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to submit recommendation to FDC',
          details: fdcResult.error
        });
      }

      res.json({
        success: true,
        message: 'Recommendation generated and submitted to FDC successfully',
        data: {
          recommendationUrl: recommendationUrl,
          fdcSubmission: fdcResult,
          retrievalInfo: {
            apiUrl: recommendationUrl,
            timestamp: fdcResult.timestamp,
            jqTransform: '.data'
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère l'historique des attestations pour une URL donnée
   */
  async getAttestationHistory(req, res, next) {
    try {
      const { apiUrl } = req.query;
      
      if (!apiUrl) {
        return res.status(400).json({
          success: false,
          error: 'API URL is required'
        });
      }

      // Dans un vrai environnement, vous interrogeriez l'indexeur FDC ou le DA Layer
      // Pour cet exemple, nous retournons un placeholder
      res.json({
        success: true,
        message: 'Attestation history retrieved',
        data: {
          apiUrl: apiUrl,
          attestations: [
            {
              timestamp: Date.now() - 3600000, // 1 hour ago
              status: 'finalized',
              blockNumber: 12345
            }
          ],
          totalCount: 1
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère la dernière recommandation depuis le contrat smart contract
   */
  async getContractRecommendation(req, res, next) {
    try {
      const result = await contractService.getLatestRecommendation();

      res.json({
        success: result.success,
        message: result.success ? 'Latest recommendation retrieved from contract' : 'Failed to get recommendation',
        data: result.data || null,
        error: result.error || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si la recommandation doit être suivie selon un seuil de confiance
   */
  async shouldFollowContractRecommendation(req, res, next) {
    try {
      const { minConfidence } = req.query;
      const confidence = minConfidence ? parseInt(minConfidence) : 500; // 50% par défaut

      const result = await contractService.shouldFollowRecommendation(confidence);

      res.json({
        success: result.success,
        data: result.success ? {
          shouldFollow: result.shouldFollow,
          suggestion: result.suggestion,
          minConfidenceThreshold: result.minConfidenceThreshold
        } : null,
        error: result.error || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère l'âge de la dernière recommandation
   */
  async getRecommendationAge(req, res, next) {
    try {
      const result = await contractService.getRecommendationAge();

      res.json({
        success: result.success,
        data: result.success ? {
          ageInSeconds: result.ageInSeconds,
          ageInMinutes: result.ageInMinutes,
          ageInHours: result.ageInHours
        } : null,
        error: result.error || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifie si la recommandation est fraîche
   */
  async isRecommendationFresh(req, res, next) {
    try {
      const { maxAge } = req.query;
      const maxAgeSeconds = maxAge ? parseInt(maxAge) : 3600; // 1 heure par défaut

      const result = await contractService.isRecommendationFresh(maxAgeSeconds);

      res.json({
        success: result.success,
        data: result.success ? {
          isFresh: result.isFresh,
          maxAgeSeconds: result.maxAgeSeconds
        } : null,
        error: result.error || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère l'historique des recommandations depuis le contrat
   */
  async getContractRecommendationHistory(req, res, next) {
    try {
      const { fromBlock, toBlock } = req.query;
      
      const result = await contractService.getRecommendationHistory(
        fromBlock ? parseInt(fromBlock) : 0,
        toBlock || 'latest'
      );

      res.json({
        success: result.success,
        data: result.data || null,
        count: result.count || 0,
        error: result.error || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Informations sur le contrat et la connexion
   */
  async getContractInfo(req, res, next) {
    try {
      const result = await contractService.getContractInfo();

      res.json({
        success: result.success,
        data: result.success ? {
          contractAddress: result.contractAddress,
          network: result.network,
          walletConnected: result.walletConnected,
          walletAddress: result.walletAddress
        } : null,
        error: result.error || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Workflow complet avec mise à jour du contrat
   */
  async generateSubmitAndUpdateContract(req, res, next) {
    try {
      // 1. Générer et soumettre au FDC
      const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
      const recommendationUrl = `${apiBaseUrl}/api/aave-morpho-recommendation`;
      
      console.log('🔄 Workflow complet: génération → FDC → contrat');
      
      const fdcResult = await flareService.submitDataToFDC(recommendationUrl, '.data');
      
      if (!fdcResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to submit recommendation to FDC',
          details: fdcResult.error
        });
      }

      // 2. Attendre la finalisation (simulation)
      console.log('⏳ Attente de la finalisation de l\'attestation...');
      
      // Dans un vrai workflow, vous attendriez que l'attestation soit finalisée
      // et récupéreriez les preuves Merkle depuis le DA Layer
      
      // 3. Simulation de mise à jour du contrat
      const mockMerkleRoot = '0x' + Math.random().toString(16).substr(2, 64);
      const mockMerkleProof = ['0x' + Math.random().toString(16).substr(2, 64)];
      
      // Note: Dans un environnement réel, vous récupéreriez ces données du DA Layer
      
      res.json({
        success: true,
        message: 'Complete workflow initiated successfully',
        data: {
          step1_fdcSubmission: fdcResult,
          step2_waitingFinalization: {
            status: 'pending',
            estimatedTime: '5-10 minutes',
            checkUrl: `${apiBaseUrl}/flare/attested-recommendation?apiUrl=${encodeURIComponent(recommendationUrl)}&timestamp=${fdcResult.timestamp}`
          },
          step3_contractUpdate: {
            status: 'ready',
            merkleRoot: mockMerkleRoot,
            merkleProof: mockMerkleProof
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FlareController();
