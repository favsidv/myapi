// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AaveMorphoOracle
 * @dev Smart contract pour utiliser les recommandations Aave vs Morpho attestées via FDC
 * Compatible avec Flare Coston2 testnet
 */

// Interface simplifiée pour FdcVerification
interface IFdcVerification {
    function verifyAttestation(
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof,
        bytes calldata data
    ) external view returns (bool);
}

contract AaveMorphoOracle {
    
    // Adresse du contrat FdcVerification sur Coston2
    IFdcVerification public immutable fdcVerification;
    
    // Structure pour stocker les recommandations vérifiées
    struct Recommendation {
        string suggestion;      // "AAVE", "MORPHO", ou "TIE"
        uint256 confidence;     // Confiance en millièmes (0-1000)
        uint256 aaveScore;      // Score Aave en millièmes
        uint256 morphoScore;    // Score Morpho en millièmes
        uint256 timestamp;      // Timestamp de la recommandation
        bool isValid;           // Indique si la recommandation est valide
        bytes32 attestationHash; // Hash de l'attestation pour référence
    }
    
    // Mapping des recommandations par timestamp
    mapping(uint256 => Recommendation) public recommendations;
    
    // Dernière recommandation valide
    Recommendation public latestRecommendation;
    
    // Événements
    event RecommendationUpdated(
        uint256 indexed timestamp,
        string suggestion,
        uint256 confidence,
        bytes32 attestationHash
    );
    
    event AttestationVerified(
        bytes32 indexed attestationHash,
        bool verified
    );
    
    // Modificateurs
    modifier onlyValidTimestamp(uint256 _timestamp) {
        require(_timestamp > 0, "Invalid timestamp");
        require(_timestamp <= block.timestamp + 300, "Future timestamp not allowed"); // 5 min tolerance
        _;
    }
    
    constructor(address _fdcVerification) {
        require(_fdcVerification != address(0), "Invalid FDC verification address");
        fdcVerification = IFdcVerification(_fdcVerification);
    }
    
    /**
     * @dev Met à jour la recommandation avec des données attestées vérifiées
     * @param _merkleRoot Racine Merkle du cycle d'attestation
     * @param _merkleProof Preuve Merkle
     * @param _attestationData Données de l'attestation (JSON encodé)
     * @param _timestamp Timestamp de la recommandation
     */
    function updateRecommendation(
        bytes32 _merkleRoot,
        bytes32[] calldata _merkleProof,
        bytes calldata _attestationData,
        uint256 _timestamp
    ) external onlyValidTimestamp(_timestamp) {
        
        // Vérifier l'attestation via FDC
        bool isVerified = fdcVerification.verifyAttestation(
            _merkleRoot,
            _merkleProof,
            _attestationData
        );
        
        require(isVerified, "Attestation verification failed");
        
        // Décoder les données JSON (version simplifiée)
        // Dans un vrai contrat, vous utiliseriez une bibliothèque JSON plus robuste
        Recommendation memory newRec = _parseRecommendationData(_attestationData, _timestamp);
        
        bytes32 attestationHash = keccak256(abi.encodePacked(_merkleRoot, _timestamp));
        newRec.attestationHash = attestationHash;
        
        // Stocker la recommandation
        recommendations[_timestamp] = newRec;
        
        // Mettre à jour la dernière recommandation si plus récente
        if (_timestamp > latestRecommendation.timestamp) {
            latestRecommendation = newRec;
        }
        
        emit RecommendationUpdated(
            _timestamp,
            newRec.suggestion,
            newRec.confidence,
            attestationHash
        );
        
        emit AttestationVerified(attestationHash, true);
    }
    
    /**
     * @dev Récupère la dernière recommandation valide
     * @return La structure Recommendation complète
     */
    function getLatestRecommendation() external view returns (Recommendation memory) {
        require(latestRecommendation.isValid, "No valid recommendation available");
        return latestRecommendation;
    }
    
    /**
     * @dev Récupère une recommandation par timestamp
     * @param _timestamp Timestamp de la recommandation
     * @return La structure Recommendation pour ce timestamp
     */
    function getRecommendation(uint256 _timestamp) external view returns (Recommendation memory) {
        require(recommendations[_timestamp].isValid, "Recommendation not found");
        return recommendations[_timestamp];
    }
    
    /**
     * @dev Vérifie si une recommandation doit être suivie selon des critères
     * @param _minConfidence Confiance minimale requise (0-1000)
     * @return shouldFollow Indique si la recommandation doit être suivie
     * @return suggestion La suggestion ("AAVE", "MORPHO", "TIE")
     */
    function shouldFollowRecommendation(uint256 _minConfidence) 
        external 
        view 
        returns (bool shouldFollow, string memory suggestion) 
    {
        require(latestRecommendation.isValid, "No valid recommendation");
        require(_minConfidence <= 1000, "Invalid confidence threshold");
        
        if (latestRecommendation.confidence >= _minConfidence) {
            return (true, latestRecommendation.suggestion);
        } else {
            return (false, "INSUFFICIENT_CONFIDENCE");
        }
    }
    
    /**
     * @dev Fonction utilitaire pour parser les données de recommandation
     * Version simplifiée - dans la réalité, utilisez une lib JSON plus robuste
     */
    function _parseRecommendationData(bytes calldata _data, uint256 _timestamp) 
        internal 
        pure 
        returns (Recommendation memory) 
    {
        // Cette implémentation est simplifiée pour la démonstration
        // Dans un vrai contrat, vous devriez parser le JSON correctement
        // ou recevoir les données déjà structurées
        
        // Pour cet exemple, nous assumons que les données sont déjà encodées
        // en format ABI avec les champs dans l'ordre attendu
        
        string memory suggestion = "AAVE"; // Par défaut
        uint256 confidence = 500; // 50% par défaut
        uint256 aaveScore = 600;
        uint256 morphoScore = 400;
        
        // Note: Dans une implémentation réelle, vous parseriez le JSON
        // ou recevriez les données dans un format structuré
        
        return Recommendation({
            suggestion: suggestion,
            confidence: confidence,
            aaveScore: aaveScore,
            morphoScore: morphoScore,
            timestamp: _timestamp,
            isValid: true,
            attestationHash: bytes32(0) // Sera défini par la fonction appelante
        });
    }
    
    /**
     * @dev Récupère l'âge de la dernière recommandation en secondes
     */
    function getRecommendationAge() external view returns (uint256) {
        if (!latestRecommendation.isValid) {
            return type(uint256).max; // Très ancien si pas de recommandation
        }
        
        if (block.timestamp >= latestRecommendation.timestamp) {
            return block.timestamp - latestRecommendation.timestamp;
        } else {
            return 0; // Recommandation future (ne devrait pas arriver)
        }
    }
    
    /**
     * @dev Vérifie si la recommandation est fraîche (moins de X secondes)
     * @param _maxAge Âge maximum accepté en secondes
     */
    function isRecommendationFresh(uint256 _maxAge) external view returns (bool) {
        if (!latestRecommendation.isValid) {
            return false;
        }
        
        uint256 age = block.timestamp - latestRecommendation.timestamp;
        return age <= _maxAge;
    }
}
