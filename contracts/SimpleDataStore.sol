// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleDataStore
 * @dev Contrat simple pour stocker et récupérer des données JSON
 * Démontre la capacité de stockage on-chain sur Flare
 */
contract SimpleDataStore {
    
    struct DataEntry {
        string jsonData;
        uint256 timestamp;
        address submitter;
        bool exists;
    }
    
    // Mapping pour stocker les données par ID
    mapping(uint256 => DataEntry) public dataStore;
    mapping(address => uint256[]) public userEntries;
    
    uint256 public nextId = 1;
    uint256 public totalEntries = 0;
    
    // Événements
    event DataStored(uint256 indexed id, address indexed submitter, uint256 timestamp);
    event DataUpdated(uint256 indexed id, address indexed updater, uint256 timestamp);
    
    /**
     * @dev Stocke des données JSON on-chain
     * @param _jsonData Les données JSON à stocker
     * @return id L'ID unique de l'entrée
     */
    function storeData(string memory _jsonData) external returns (uint256 id) {
        require(bytes(_jsonData).length > 0, "JSON data cannot be empty");
        require(bytes(_jsonData).length <= 8192, "JSON data too large (max 8KB)");
        
        id = nextId++;
        
        dataStore[id] = DataEntry({
            jsonData: _jsonData,
            timestamp: block.timestamp,
            submitter: msg.sender,
            exists: true
        });
        
        userEntries[msg.sender].push(id);
        totalEntries++;
        
        emit DataStored(id, msg.sender, block.timestamp);
        
        return id;
    }
    
    /**
     * @dev Récupère des données JSON par ID
     * @param _id L'ID de l'entrée à récupérer
     * @return jsonData Les données JSON
     * @return timestamp Le timestamp de stockage
     * @return submitter L'adresse qui a soumis les données
     */
    function getData(uint256 _id) external view returns (
        string memory jsonData,
        uint256 timestamp,
        address submitter
    ) {
        require(dataStore[_id].exists, "Data entry does not exist");
        
        DataEntry storage entry = dataStore[_id];
        return (entry.jsonData, entry.timestamp, entry.submitter);
    }
    
    /**
     * @dev Met à jour des données existantes (seulement par le propriétaire original)
     * @param _id L'ID de l'entrée à mettre à jour
     * @param _newJsonData Les nouvelles données JSON
     */
    function updateData(uint256 _id, string memory _newJsonData) external {
        require(dataStore[_id].exists, "Data entry does not exist");
        require(dataStore[_id].submitter == msg.sender, "Only original submitter can update");
        require(bytes(_newJsonData).length > 0, "JSON data cannot be empty");
        require(bytes(_newJsonData).length <= 8192, "JSON data too large (max 8KB)");
        
        dataStore[_id].jsonData = _newJsonData;
        dataStore[_id].timestamp = block.timestamp;
        
        emit DataUpdated(_id, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Stocke une recommandation Aave/Morpho formatée
     * @param _suggestion "AAVE", "MORPHO", ou "TIE"
     * @param _confidence Niveau de confiance (0-1000)
     * @param _aaveScore Score Aave (0-1000)
     * @param _morphoScore Score Morpho (0-1000)
     * @param _btcDominance Dominance BTC en centièmes de %
     * @param _defiTvl TVL DeFi en wei
     * @return id L'ID de l'entrée créée
     */
    function storeRecommendation(
        string memory _suggestion,
        uint256 _confidence,
        uint256 _aaveScore,
        uint256 _morphoScore,
        uint256 _btcDominance,
        uint256 _defiTvl
    ) external returns (uint256 id) {
        // Validation des inputs
        require(
            keccak256(bytes(_suggestion)) == keccak256(bytes("AAVE")) ||
            keccak256(bytes(_suggestion)) == keccak256(bytes("MORPHO")) ||
            keccak256(bytes(_suggestion)) == keccak256(bytes("TIE")),
            "Invalid suggestion"
        );
        require(_confidence <= 1000, "Confidence must be <= 1000");
        require(_aaveScore <= 1000 && _morphoScore <= 1000, "Scores must be <= 1000");
        
        // Créer le JSON formaté
        string memory jsonData = string(abi.encodePacked(
            '{"suggestion":"', _suggestion,
            '","confidence":', uint2str(_confidence),
            ',"aaveScore":', uint2str(_aaveScore),
            ',"morphoScore":', uint2str(_morphoScore),
            ',"btcDominance":', uint2str(_btcDominance),
            ',"defiTvl":', uint2str(_defiTvl),
            ',"timestamp":', uint2str(block.timestamp),
            ',"blockNumber":', uint2str(block.number),
            ',"submitter":"', toAsciiString(msg.sender), '"}'
        ));
        
        return storeData(jsonData);
    }
    
    /**
     * @dev Récupère la dernière recommandation d'un utilisateur
     * @param _user L'adresse de l'utilisateur
     * @return id L'ID de la dernière entrée
     * @return jsonData Les données JSON
     * @return timestamp Le timestamp
     */
    function getLatestUserRecommendation(address _user) external view returns (
        uint256 id,
        string memory jsonData,
        uint256 timestamp
    ) {
        uint256[] storage entries = userEntries[_user];
        require(entries.length > 0, "User has no entries");
        
        id = entries[entries.length - 1];
        DataEntry storage entry = dataStore[id];
        
        return (id, entry.jsonData, entry.timestamp);
    }
    
    /**
     * @dev Récupère le nombre d'entrées d'un utilisateur
     * @param _user L'adresse de l'utilisateur
     * @return count Le nombre d'entrées
     */
    function getUserEntryCount(address _user) external view returns (uint256 count) {
        return userEntries[_user].length;
    }
    
    /**
     * @dev Récupère toutes les entrées d'un utilisateur
     * @param _user L'adresse de l'utilisateur
     * @return ids Les IDs des entrées
     */
    function getUserEntries(address _user) external view returns (uint256[] memory ids) {
        return userEntries[_user];
    }
    
    /**
     * @dev Vérifie si des données existent pour un ID
     * @param _id L'ID à vérifier
     * @return exists True si les données existent
     */
    function dataExists(uint256 _id) external view returns (bool exists) {
        return dataStore[_id].exists;
    }
    
    // Fonction utilitaire pour convertir uint en string
    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    // Fonction utilitaire pour convertir adresse en string
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(abi.encodePacked("0x", s));
    }
    
    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
