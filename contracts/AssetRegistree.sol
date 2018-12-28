pragma solidity ^0.4.23;

contract AssetRegistree {
  

    // Owner of the asset 
    address owner;        
    
    // Person who verifies the asset
    address verifier;
    address[] public verifiers;

    // Fund users
    address grantor;
    address[] public grantors;
    
    // Asset Description
    struct Asset {
      address asset_owner;
      uint assetID;
      string name;   // name of asset
      string description; // asset description
      string date_of_acquisition; // when the asset was bought
    }
    // array of assets
    Asset[] public assets;
    Asset[] public verifiedAssets;
    Asset[] public unverifiedAssets;
    

    // Assign owner to asset 
    mapping(address => Asset) public ownerAddressToAsset;
    // Assign assetCounter to owner
    mapping (uint => address) public idToOwnerAddress;
    //check if asset exists for a specific owner
    mapping (address => bool) public assetCheck;
    // assetID to Asset
    mapping(uint => Asset) public idToAsset;
    //check if the asset has been verified or not
    mapping (uint => bool) public assetVerifiedCheck;

    
    // Assign contract to the onwer of the asset
    constructor() public {
        //creator of the asset
        owner = msg.sender;
    }
    
    // Permissions
     modifier onlyOwner() {
         require(msg.sender == owner, "Only the owner of the asset can perform this function");
         _;
    }

    //track the number of assets
    uint public assetCounter = 0;

    //register Asset event

    event AssetRegistered(address indexed _asset_owner, address _registerar, 
                          string _name, string _date_of_acquisition);

    // Anyone can register Asset
    function registerAsset(
      address _asset_owner,
      string _name,
      string _description,
      string _date_of_acquisition) public {
       //incrememnt assetCounter
      assetCounter++;
      //fill asset with information

      Asset memory thisAsset = Asset(
        _asset_owner, 
        assetCounter,
        _name, 
        _description, 
        _date_of_acquisition);
      //uint assetID = assets.push(Asset(owner, _name, _description, _date_of_acquisition,false));
      // Push asset to all assets
      assets.push(thisAsset);
      // Push asset to unverified list
      unverifiedAssets.push(thisAsset);
      // Map the assetID to the owner
      idToOwnerAddress[assetCounter] = _asset_owner;
      // Map owner address to asset
      ownerAddressToAsset[_asset_owner] = thisAsset;
      // specific address owns an asset
      assetCheck[_asset_owner] = true;
      // specifies that the asset is not verified yet
      assetVerifiedCheck[assetCounter] = false;
      //ID to asset
      idToAsset[assetCounter] = thisAsset;
      //omit and show asset has been registererd
      emit AssetRegistered(_asset_owner, msg.sender, _name, _date_of_acquisition);
   
    }

    //get number of assets registered in the whole platform
    function getAssetsRegistered() external view returns(uint) {
        //require there to be songs
        require(assets.length > 0 , "no assets registered");
        //get number of songs registered
        
        //create a counter
        uint counter = 0;
        // for each asset in the asset array
        for (uint i = 0; i < assets.length; i++){
            //increment the counter
            counter++;
        }
        //return the total count
        return counter;
    }
    
    //get number of assets registered in the whole platform
    function getUnverifiedAssets() external view returns(uint) {
        //require there to be songs
        require(unverifiedAssets.length  > 0, "no assets unverified");
        //get number of songs registered
        
        //create a counter
        uint counter = 0;
        // for each asset in the asset array
        for (uint i = 0; i < unverifiedAssets.length; i++){
            //increment the counter
            counter++;
        }
        //return the total count
        return counter;
    }
    
    //event to verify asset
    event AssetVerified(uint indexed _assetID, address _owner);
     
    // Verify Asset by Third Party
    function verifyAsset(uint _assetID) public {
        require(ownerAddressToAsset[msg.sender].asset_owner != msg.sender, "Owner cannot verify asset");
        //return the specific asset
         verifiedAssets.push(unverifiedAssets[_assetID]);
         //uint index = unverifiedAssets[_assetID];
         if (unverifiedAssets.length > 1) {
         unverifiedAssets[_assetID] = unverifiedAssets[unverifiedAssets.length-1];
         }
         unverifiedAssets.length--; // Implicitly recovers gas from last element storage
        // specifies that the asset is verified 
        assetVerifiedCheck[assetCounter] = true;
        emit AssetVerified(_assetID, msg.sender);
     }
     
     //get number of assets registered in the whole platform
    function getVerifiedAssets() external view returns(uint) {
        //require there to be songs
        require(verifiedAssets.length > 0, "no assets verified");
        
        //create a counter
        uint counter = 0;
        // for each asset in the asset array
        for (uint i = 0; i < verifiedAssets.length; i++){
            //increment the counter
            counter++;
        }
        //return the total count
        return counter;
    }
    
     function getAllAssets() public view returns (uint[]) {
       // prepare output array
       uint[] memory assetIds = new uint[](assetCounter);

       uint numberOfAssets = 0;
       // iterate over articles
       for(uint i = 1; i <= assetCounter;  i++) {

         assetIds[numberOfAssets] = idToAsset[i].assetID;
         numberOfAssets++;
       }
       return assetIds;
     }


     // Find Farmer by ID
    //  function findAssetById(uint _assetID) public returns(address){
    //   return idToOwnerAddress[_assetID];
    //  }
    
    // // Use asset as collatoral
    // function useAsset() public{
      
    // }
    
    // // Use asset as collatoral
    // function useAsset() public{

    // }
    
    // // Owner of asset verify collateral 
    // function verifyCollateral() public{

    // }
    
    // // Release collateral from contract
    // function releaseCollateral() public{

    // }
    
    // // Remove collateral 
    // function removeCollateral() public{

    // }
    

}
