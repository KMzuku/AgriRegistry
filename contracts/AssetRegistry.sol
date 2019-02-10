pragma solidity >=0.4.22 <0.6.0;

contract AssetRegistry {

    // Owner of the asset
    address owner;

    // Person who has the ability to verify an asset
    address verifier;
    // A list of verfiers
    address[] public verifiers;

    // A financial provider
    address grantor;
    // A list of financial providers
    address[] public grantors;

    // A struct containing information-
    // about the asset which will be used as collateral
    struct Asset {
      // The Owner of the asset
      address asset_owner;
      // A unique identifier of the asset
      uint assetID;
      // The name which will be displayed on the
      // asset registry platform
      string name;
      // The description of the asset
      // The description needs to describe in-
      // detail what the asset looks like and its current-
      // condition.
      string description;
      // when the asset was bought or -
      // when the individual became the owenr of the asset
      string date_of_acquisition;
    }
    // Array of assets
    Asset[] public assets;
    // Array of assets that have been verified-
    // by a trusted party
    Asset[] public verifiedAssets;
    // Array if assets which have NOT been verified
    Asset[] public unverifiedAssets;


    // Assign owner to asset
    mapping(address => Asset) public ownerAddressToAsset;
    // Assign assetCounter to owner
    mapping (uint => address) public idToOwnerAddress;
    // To check if asset exists for a specific owner
    mapping (address => bool) public assetCheck;
    // AssetID to Asset
    mapping(uint => Asset) public idToAsset;
    // To check if the asset has been verified or not
    mapping (uint => bool) public assetVerifiedCheck;
    // To map each asset to a verifier
    mapping (address => Asset) public verifierToAsset;

    // Assign contract to the onwer of the asset
    constructor() public {
        //creator of the asset
        owner = msg.sender;
    }

    // Permissions
     modifier onlyOwner() {
         require(msg.sender == owner,
           "Only the owner of the asset can perform this function");
         _;
    }

    //track the number of assets
    uint public assetCounter = 0;

    //register Asset event

    event AssetRegistered(address indexed _asset_owner,
                          address _registerar,
                          string _name,
                          string _date_of_acquisition);

    // Anyone can register Asset
    function registerAsset(
      address _asset_owner,
      string memory _name,
      string memory _description,
      string memory _date_of_acquisition) public {
        // check whether the sender of the transaction
        // is the creator of the contract
      require(
        msg.sender == owner,
        "This address is not authorized."
        );
       // Incrememnt assetCounter
      assetCounter++;

      //fill asset with information
      Asset memory thisAsset = Asset(
          _asset_owner,
          assetCounter,
          _name,
          _description,
          _date_of_acquisition);

      // Checks if the asset already exists
      require(
          thisAsset.assetCounter != assets[thisAsset],
          "Asset already exists."
          );
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
      emit AssetRegistered(_asset_owner, msg.sender,
        _name, _date_of_acquisition);

    }

    // Get number of assets registered in the whole platform
    function getAssetsRegistered() external view returns(uint) {
        //require there to be assets
        require(assets.length > 0 , "no assets registered");
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
        //require there to be unverified assets
        require(unverifiedAssets.length  > 0, "no assets unverified");
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
        require(ownerAddressToAsset[msg.sender].asset_owner != msg.sender,
          "Owner cannot verify asset");
        // store the address of the verifier
        verifiers.push(msg.sender);
        // return the specific asset
         verifiedAssets.push(unverifiedAssets[_assetID]);
         // uint index = unverifiedAssets[_assetID];
         if (unverifiedAssets.length > 1) {
         unverifiedAssets[_assetID] =
         unverifiedAssets[unverifiedAssets.length-1];
         }
         // Implicitly recovers gas from last element storage
         unverifiedAssets.length--;
        // specifies that the asset is verified
        assetVerifiedCheck[assetCounter] = true;
        // notifies user of verification
        emit AssetVerified(_assetID, msg.sender);
     }

     //get number of assets registered in the whole platform
    function getVerifiedAssets() external view returns(uint) {
        //require there to be verified assets
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

    // Get all assets
     function getAllAssets() public view returns (uint[]) {
      // prepare output array
      uint[] memory assetIds = new uint[](assetCounter);
      uint numberOfAssets = 0;
      // iterate over articles
      for(uint i = 1; i <= assetCounter;  i++) {
         assetIds[numberOfAssets] = idToAsset[i].assetID;
         numberOfAssets++;
      }
      //return all asset IDs
      return assetIds;
     }

    // Struct to store details about collateral
    struct Collateral
    {
        // A unique identifier of the collateral
        uint collateralID;
        // the asset ID created in the
        // asset registration
        uint assetID;
        // the owner of the asset
        address asset_owner;
        // the financial provider who has
        // agreed to accept the asset
        // as collateral
        address grantor;
        // the trusted party who has verified
        // the asset
        address verifier;
    }
    // CollateralCounter
    uint public collateralCounter = 0;
    // an array of collateral
    Collateral[] public collaterals;
    // Map each collateral to address
    mapping (uint => address) public collateralIDTOwnerAddress;
    // Map ID to collateral
    mapping(uint => Collateral) public idToCollateral;

    // Event to verify asset
    event collateralCreated(address indexed _asset_owner,
      address indexed _grantor);

    // Use asset as collatoral
    function createCollateral(
      uint _assetID,
      address _asset_owner,
      address _grantor,
      address _verifier) public {
      require(msg.sender == _grantor,
        "Only the fund provider can create collateral");
      //increase counter
      collateralCounter++;
      //store the new data into the struct collateral
      Collateral memory thisCollateral = Collateral(
       collateralCounter,
       _assetID,
        _asset_owner,
        _grantor,
        _verifier);
      // Checks if the asset already exists
      require(
            thisCollateral.collateralCounter != collaterals[thisCollateral],
            "Collateral already exists!"
            );
      //push new collateral into array
      collaterals.push(thisCollateral);
      //map the collateral id to the owner address
      collateralIDTOwnerAddress[collateralCounter] = _asset_owner;
      //map id to collateral
      idToCollateral[collateralCounter] = thisCollateral;
      //emit event that the asset has been created
      emit collateralCreated(_asset_owner, _grantor);
    }

    // Event to show the collateral has been removed
    event collateralRemoved(uint indexed collateralID_,
      address indexed _grantor);
    // Remove collateral
    function removeCollateral(uint _collateralID) public{
      require(idToCollateral[_collateralID].grantor == msg.sender,
        "only the grantor can remove collateral" );
      //remove the collateral from the collaterals list
      delete collaterals[idToCollateral[_collateralID].collateralID];
      //emit event that the asset has been created
      emit collateralRemoved(_collateralID, msg.sender);
    }


}
