const { ethers } = require('ethers');
const axios = require('axios');

class FlareService {
  constructor() {
    // Configuration pour Flare Coston2 testnet (compatible avec FDC JsonApi)
    this.rpcUrl = process.env.FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/bc/C/rpc';
    this.chainId = 114; // Coston2 testnet
    
    // Adresses des contrats FDC sur Coston2 (avec checksum automatique)
    this.fdcHubAddress = ethers.getAddress('0x3d1b2b8bd43c8e50a33e2a1e32c23e0c8b76a7c5'); // Adresse FdcHub Coston2
    this.fdcVerificationAddress = ethers.getAddress('0x8f5f5b7d5a3b8c2e3a9f1c2e3d4a5b6c7d8e9f0a'); // Adresse FdcVerification Coston2
    
    // ABI simplifié pour FdcHub
    this.fdcHubAbi = [
      "function requestAttestation(bytes32 _attestationType, bytes32 _sourceId, bytes calldata _requestBody) external returns (bool)",
      "function getAttestation(bytes32 _attestationType, bytes32 _sourceId, uint64 _timestamp, bytes calldata _requestBody) external view returns (bool _proved, bytes calldata _data)",
      "event AttestationRequest(address indexed _sender, uint64 indexed _timestamp, bytes32 indexed _attestationType, bytes32 _sourceId, bytes _requestBody)"
    ];
    
    // ABI simplifié pour FdcVerification
    this.fdcVerificationAbi = [
      "function verifyAttestation(bytes32 _merkleRoot, bytes32[] calldata _merkleProof, bytes calldata _data) external view returns (bool)",
      "function getAttestationData(bytes32 _requestId) external view returns (bytes calldata _data, bool _verified)"
    ];
    
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.wallet = null;
    this.fdcHubContract = null;
    this.fdcVerificationContract = null;
    
    this.initializeContracts();
  }

  async initializeContracts() {
    try {
      if (process.env.PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.fdcHubContract = new ethers.Contract(this.fdcHubAddress, this.fdcHubAbi, this.wallet);
        this.fdcVerificationContract = new ethers.Contract(this.fdcVerificationAddress, this.fdcVerificationAbi, this.wallet);
      } else {
        // Mode lecture seule
        this.fdcHubContract = new ethers.Contract(this.fdcHubAddress, this.fdcHubAbi, this.provider);
        this.fdcVerificationContract = new ethers.Contract(this.fdcVerificationAddress, this.fdcVerificationAbi, this.provider);
      }
    } catch (error) {
      console.error('Error initializing Flare contracts:', error);
    }
  }

  /**
   * Soumet des données JSON au FDC pour attestation
   * @param {string} apiUrl - URL de l'API contenant les données JSON
   * @param {string} jqTransform - Transformation JQ pour extraire les données
   * @returns {Object} Résultat de la soumission
   */
  async submitDataToFDC(apiUrl, jqTransform = '.') {
    try {
      if (!this.wallet) {
        throw new Error('Private key required for submitting attestations');
      }

      // Type d'attestation JsonApi (disponible sur Coston/Coston2)
      const attestationType = ethers.keccak256(ethers.toUtf8Bytes('JsonApi'));
      
      // Source ID basé sur l'URL
      const sourceId = ethers.keccak256(ethers.toUtf8Bytes(apiUrl));
      
      // Préparer le corps de la requête pour JsonApi
      const requestBody = {
        url: apiUrl,
        jq: jqTransform,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      const encodedRequestBody = ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'string', 'uint64'],
        [requestBody.url, requestBody.jq, requestBody.timestamp]
      );

      console.log('Submitting attestation request...');
      console.log('API URL:', apiUrl);
      console.log('JQ Transform:', jqTransform);
      
      // Soumettre la requête d'attestation
      const tx = await this.fdcHubContract.requestAttestation(
        attestationType,
        sourceId,
        encodedRequestBody
      );
      
      console.log('Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        attestationType: attestationType,
        sourceId: sourceId,
        requestBody: requestBody,
        timestamp: requestBody.timestamp
      };
      
    } catch (error) {
      console.error('Error submitting data to FDC:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupère les données attestées depuis le FDC
   * @param {string} apiUrl - URL de l'API originale
   * @param {number} timestamp - Timestamp de la requête
   * @param {string} jqTransform - Transformation JQ utilisée
   * @returns {Object} Données attestées
   */
  async getAttestedData(apiUrl, timestamp, jqTransform = '.') {
    try {
      const attestationType = ethers.keccak256(ethers.toUtf8Bytes('JsonApi'));
      const sourceId = ethers.keccak256(ethers.toUtf8Bytes(apiUrl));
      
      const encodedRequestBody = ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'string', 'uint64'],
        [apiUrl, jqTransform, timestamp]
      );
      
      console.log('Retrieving attested data...');
      console.log('API URL:', apiUrl);
      console.log('Timestamp:', timestamp);
      
      const [proved, data] = await this.fdcHubContract.getAttestation(
        attestationType,
        sourceId,
        timestamp,
        encodedRequestBody
      );
      
      if (proved) {
        // Décoder les données attestées
        const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(['string'], data);
        
        return {
          success: true,
          proved: true,
          data: JSON.parse(decodedData[0]),
          timestamp: timestamp,
          sourceUrl: apiUrl
        };
      } else {
        return {
          success: false,
          proved: false,
          message: 'Attestation not yet available or finalized'
        };
      }
      
    } catch (error) {
      console.error('Error retrieving attested data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vérifie les données attestées avec une preuve Merkle
   * @param {string} merkleRoot - Racine Merkle du cycle d'attestation
   * @param {Array} merkleProof - Preuve Merkle
   * @param {string} data - Données à vérifier
   * @returns {boolean} Résultat de la vérification
   */
  async verifyAttestationData(merkleRoot, merkleProof, data) {
    try {
      const isValid = await this.fdcVerificationContract.verifyAttestation(
        merkleRoot,
        merkleProof,
        ethers.toUtf8Bytes(data)
      );
      
      return {
        success: true,
        verified: isValid
      };
      
    } catch (error) {
      console.error('Error verifying attestation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupère les informations de l'attestation depuis le Data Availability Layer
   * @param {string} requestId - ID de la requête d'attestation
   * @returns {Object} Données et statut de vérification
   */
  async getAttestationFromDA(requestId) {
    try {
      // Dans un environnement réel, vous devriez utiliser l'API DA Layer
      // Pour cet exemple, nous utilisons une approche simplifiée
      const daLayerUrl = process.env.FLARE_DA_URL || 'https://da-layer.flare.network/api/v1';
      
      const response = await axios.get(`${daLayerUrl}/attestation/${requestId}`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.attestation,
          merkleProof: response.data.merkleProof,
          merkleRoot: response.data.merkleRoot
        };
      } else {
        return {
          success: false,
          message: 'Attestation not found in DA Layer'
        };
      }
      
    } catch (error) {
      console.error('Error fetching from DA Layer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Méthode utilitaire pour obtenir le statut du réseau Flare
   */
  async getNetworkStatus() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      
      return {
        success: true,
        chainId: Number(network.chainId),
        blockNumber: blockNumber,
        rpcUrl: this.rpcUrl
      };
      
    } catch (error) {
      console.error('Error getting network status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new FlareService();
