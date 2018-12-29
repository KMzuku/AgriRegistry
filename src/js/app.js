App = {
    web3Provider: null,
    contracts: {},
    account: 0x0,

    //initialise the contract
    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
        // initialize web3
        if (typeof web3 != undefined) {
            // reuse the provider of the web3 object injected by MetaMask
            App.web3Provider = web3.currentProvider;
        } else {
            // either create a new provider, here connecting to Ganache
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545')
                // instantiate a new web3 object
            web3 = new Web3(App.web3Provider);
            // or handle the case that the user does not have MetaMask by showing her a message asking her to install Metamask
        }
        // display current account information
       // App.displayAccountInfo();

        return App.initContract();
    },


    initContract: function() {
        //Conect to AssetRegistree Contract
        $.getJSON('AssetRegistree.json', function(AssetRegistreeArtifact) {
            // get the contract artifact file and use it to instantiate a truffle contract abstraction
            App.contracts.AssetRegistree = TruffleContract(AssetRegistreeArtifact);
            // set the provider for our contract
            App.contracts.AssetRegistree.setProvider(App.web3Provider);

             //reload information needed
            App.listenToEvents();
            App.reloadAssets(); 
            App.displayAccountInfo();
            // App.listenToEmployeeOrderEvents();
            // App.listenToChangAllowanceEvents();
            // App.reloadEmployeeOrders()
            // App.reloadEmployees();
            // App.getTotalEmployees();
            // App.getEmployeeWAddress();
            // App.listenToCompanyOnwershipAdd();
        });
    },


    //Register an Asset
    registerAsset: function() {
        var _asset_owner= $('#asset_owner').val();
        var _asset_name = $('#asset_name').val();
        var _asset_description = $('#asset_description').val();

        //getting the date

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) { 
            dd = '0'+dd
        } 

        if(mm<10) {
            mm = '0'+mm
        } 

        today = dd + '/' + mm + '/' + yyyy;
        //check if the date is correct
        console.log(today);

        //check that data has been inputed
        if (_asset_owner.trim() == '') {
            // we cannot create an employer
            console.log("Insert owner details ");
            return false;
        };
        App.contracts.AssetRegistree.deployed().then(function(instance) {
            console.log('Adding Asset...');
            instance.registerAsset(_asset_owner, _asset_name, _asset_description,
                today, {
                from: App.account,
                gas: 5000000
            }); 
        }).catch(function(error) {
            console.log(error);
        });

    },

    checkVerification: function(AssetOwner) {
    
        var contractInstance;

        App.contracts.AssetRegistree.deployed().then(function(instance) {
            contractInstance = instance;
           return contractInstance.assetVerifiedCheck(AssetOwner);
            }).then(function(boolean) {
                console.log(boolean);
                //show the button if the asset has not been verified
                if(boolean == false){
                    $('.btn-verify').show();
                } else {
                    $('.btn-verify').hide();
                }
                });
    },

    verifyAsset: function() {
        var contractInstance;

        //get metaData stored in button 
        var _assetID = event.target.getAttribute('data-assetID');
        console.log(_assetID)

        App.contracts.AssetRegistree.deployed().then(function(instance) {
            console.log('Verifying asset...');
            instance.verifyAsset(_assetID, {
                from: App.account,
                gas: 500000
            }); 
        //reload the assets
        App.reloadAssets();
        }).catch(function(error) {
            console.log(error);
        });


    },


    reloadAssets: function() {

        var contractInstance;

        App.contracts.AssetRegistree.deployed().then(function(instance) {
            contractInstance = instance;
            return contractInstance.getAllAssets();
        }).then(function(allAssets) {
            // retrieve the employee placeholder and clear it
            $('#assetsRow').empty();

            for (var i = 0; i < allAssets.length; i++) {
                // get the assetID
                var asset = allAssets[i];
                // use the ID to get the full Asset struct
                contractInstance.idToAsset(asset).then(function(thisAsset) {
                    //display the struct using the displayAsset function 
                    App.displayAssets(thisAsset[0],thisAsset[1], thisAsset[2], thisAsset[3], thisAsset[4]);

                    //check whether the asset is verified or not using the 
                    // checkVerification function
                   App.checkVerification(thisAsset[0]);
                });
                
            }
    
        }).catch(function(err) {
            console.error(err.message);
            
        });
    },

    displayAssets: function(owner,assetID,name, description, date) {
        var assetsRow = $('#assetsRow');
        var assetTemplate = $('#assetTemplate');
        assetTemplate.find('.card-title').text(name);
        assetTemplate.find('.asset-owner').text(owner);
        assetTemplate.find('.asset-date').text(date);
        assetTemplate.find('.asset-description').text(description);
        // assetTemplate.find('.asset-verified').text(verified);
        //next two lines of code store metadata of the panel in the button, 
        //so that the data can be accessed when "Adjust Allowed Tokens" btn is clicked
        // assetTemplate.find('.btn-buy').attr('data-employeeID', employeeID);
        // assetTemplate.find('.btn-buy').attr('data-employeeWallet', employeeWallet);

        //next two lines of code store metadata of the panel in the button, 
        //so that the data can be accessed when "Adjust Allowed Tokens" btn is clicked
        assetTemplate.find('.btn-verify').attr('data-assetID', assetID);

        // add this new employee
        assetsRow.append(assetTemplate.html());
    },

    listenToEvents: function() {

        //check for AssetRegistered Events
        App.contracts.AssetRegistree.deployed().then(function(instance) {
            instance.AssetRegistered({}, {
                fromBlock: 0,
                toBlock: 'lastest'
            }).watch(function(error, event) {
                if (!error) {
                    $("#events").append('<li class="list-group-item"> Asset ' + event.args._name + ' has just been added!</li>');
                } else {
                    console.error(error);
                }
            })
        });

        //check for verified events

        App.contracts.AssetRegistree.deployed().then(function(instance) {
                instance.AssetVerified({}, {
                    fromBlock: 0,
                    toBlock: 'lastest'
                }).watch(function(error, event) {
                    if (!error) {
                        $("#events").append('<li class="list-group-item"> Asset ' + event.args._assetID + ' has just been verified!</li>');
                    } else {
                        console.error(error);
                    }
                })
            });
    },

     //display account information
    displayAccountInfo: function() {
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                $("#events").append('<li class="list-group-item"> Successfull login for account '+ account + '!</li>');
                web3.eth.getBalance(account, function(err, balance) {
                    if (err === null) {
                        $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
                    }
                })
            }
        });
    },

















    //add an employee
    addEmployee: function() { //add event
        // get information from user
        var _allowedTokens = $('#allowed_tokens').val();
        var _employeeWallet = $('#employee_wallet').val();

        if (_allowedTokens.trim() == '') {
            return false;
        };
        App.contracts.Company.deployed().then(function(instance) {
            console.log('Adding Employee..');
            instance.addEmployee(_allowedTokens, _employeeWallet, {
                from: App.account,
                gas: 500000
            });
            $('#allowed_tokens').val('');
            $('#employee_wallet').val('');
        }).catch(function(error) {
            console.log(error);
        });
    },


   

    //employee makes a request for funds
    employeeRequest: function() {
         var _maxRate = $('#employee_rate').val();
         var _amount = $('#employee_amount').val();
        
        console.log("Max Rate:" + _maxRate + "\nAmount:" + _amount);

        App.contracts.Company.deployed().then(function(instance) {
            //get employee
            console.log('Requesting Funds..');
            instance.employeeRequest(_maxRate, _amount, {
                from: App.account,
                gas: 500000
            });
        }).catch(function(error) {
            console.log(error);
        });
    },

 //get the specific employee from template
    getEmployeeIdFromBtn: function() {
       // retrieves metadata from "Adjust Allowed Tokens" btn
        var _employeeID = event.target.getAttribute('data-employeeID'); 
         //check if the above worked
        console.log("retrieved data found: " + _employeeID);

        $('#AllowedTokenAdjust').ready(function() {
            var allowedTokenAdjust = $('#AllowedTokenAdjust');
            allowedTokenAdjust.find('.btn-submit').attr('data-_employeeID', _employeeID); //store metadata of employeeID in the modal "submit" btn
        });
    },

    //get the specific order from template
    getEmployeeOrderIdFromBtn: function() {

        var _orderID = event.target.getAttribute('data-orderID');
        var _employeeWallet = event.target.getAttribute('data-employeeWallet');
        var _amount = event.target.getAttribute('data-amount'); 
        var _rate = event.target.getAttribute('data-rate'); 

        console.log("orderID: " + _orderID +
                     "\nEmployee Wallet: " +_employeeWallet + 
                     "\nAmount: " + _amount +
                     "\nRate: " + _rate );

        App.contracts.Company.deployed().then(function(instance) {
            console.log('Accepting Order...' + _orderID
                + '\nAmount:' + _amount);
            //get employee allowed tokens and change them using employeeID
            instance.investorAcceptEmployeeOrder(_orderID, {
                from: App.account,
                value: _amount,
                gas: 500000

            });
       
        }).catch(function(error) {
            console.log(error);
        });
    },

    changeAllowance: function() {
        var _tokensAllowed = $('#Tokens_allowed').val();
        console.log("Tokens allocated: " + _tokensAllowed); //check if the above worked
        var _employeeID = event.target.getAttribute('data-_employeeID'); //retrieves ID from modal "submit" btn
        console.log("retrieved data found from submit btn: " + _employeeID); //check if the above worked

        App.contracts.Company.deployed().then(function(instance) {

            console.log('Changing Allowance...');

            //get employee allowed tokens and change them using employeeID
            instance.changeAllowance(_employeeID, _tokensAllowed, {
                from: App.account,
                gas: 500000
            });
        }).catch(function(error) {
            console.log(error);
        });
    },


    


    //get a specific employee using the address
    getEmployeeWAddress: function() {
        var companyInstance;
        App.contracts.Company.deployed().then(function(instance) {
            companyInstance = instance;
            return companyInstance.getEmployeeWAddress(App.account);
        }).then(function(employee) {
            $('#allowedTokens').text(employee[1]);
            $('#utilizedTokens').text(employee[2]);
        }).catch(function(err) {
            console.error(err.message);
        });
    },


    //get the project X balance of the current account
    getBalanceCompany: function() {
        App.contracts.Company.deployed().then(function(instance) {
           return instance.get_balance();
        }).then(function(balance) {
        $('#utilizedTokens').text(balance.toNumber() + "ETH");
        }).catch(function(err) {
            console.error(err.message);
        });
    },


    //get the total number of employees
    getTotalEmployees:function() {
         App.contracts.Company.deployed().then(function(instance) {
           return instance.getNumberofEmployees();
        }).then(function(employees) {
        $('#employeeCount').text(employees.toNumber());
        }).catch(function(err) {
            console.error(err.message);
        });

    },


    // load employee orders into templates
    reloadEmployeeOrders: function() {
        if (App.loading) {
            return;
        }
        App.loading = true;

        // refresh account information because the balance might have changed
        App.displayAccountInfo();

        var companyInstance;

        App.contracts.Company.deployed().then(function(instance) {
            companyInstance = instance;
            return companyInstance.getAllEmployeeOrders();
        }).then(function(orders) {

            // retrieve the employee placeholder and clear it
            $('#employeesRow').empty();

            for (var i = 0; i < orders.length; i++) {
                var employeeOrderID = orders[i];
                companyInstance.idToSellOrder(employeeOrderID.toNumber()).then(function(order) {
                    App.displayEmployeeOrders(order[0], order[1], order[2], order[3], order[4], order[5], order[6]);
                });
            }
            App.loading = false;
        }).catch(function(err) {
            console.error(err.message);
            App.loading = false;
        });
    },


    
    displayEmployeeOrders: function(employeeWallet, investorWallet, orderID, rate, ethAmount, timestamp, expiryTime) {
        var ordersRow = $('#ordersRow');
        var employeeOrderTemplate = $('#EmployeeOrderTemplate');
        var profileTemplate = $('#ProfileTemplate');

        //price 
         // var etherRate = web3.fromWei(rate, "ether");
         // var etherAmount = web3.fromWei(ethAmount, "ether");

        employeeOrderTemplate.find('.card-title').text( "Order ID: " + orderID);
        employeeOrderTemplate.find('.order-amount').text(ethAmount + "ETH");
        employeeOrderTemplate.find('.order-rate').text(rate + "ETH");
        employeeOrderTemplate.find('.order-seller').text(employeeWallet);
        employeeOrderTemplate.find('.order-buyer').text(investorWallet);


        employeeOrderTemplate.find('.btn-order').attr('data-orderID', orderID);
        employeeOrderTemplate.find('.btn-order').attr('data-employeeWallet', employeeWallet);
        employeeOrderTemplate.find('.btn-order').attr('data-amount', ethAmount);
        employeeOrderTemplate.find('.btn-order').attr('data-rate', rate);

        // conditions affecting html
        if (employeeWallet == App.account) {
          employeeOrderTemplate.find('.order-seller').text("You");
          employeeOrderTemplate.find('.btn-order').hide();
        } else {
          employeeOrderTemplate.find('.order-seller').text(employeeWallet);
          employeeOrderTemplate.find('.btn-order').show();
        }

        //if investor
        if(investorWallet == App.account) {
            App.getBalanceCompany();
             employeeOrderTemplate.find('.btn-order').hide();
             employeeOrderTemplate.find('.order-buyer').text("You")
             profileTemplate.find('#label_tokens').hide();
             profileTemplate.find('#label_utilized').text("Balance:");
             profileTemplate.find('#allowedTokens').hide();
             profileTemplate.find('#wallet').text("Investor Address:");
        }

        // add this new employeeOrder
        ordersRow.append(employeeOrderTemplate.html());
    },

    

    // listenToChangAllowanceEvents: function() {
    //     App.contracts.Company.deployed().then(function(instance) {
    //         instance.AllowanceChanged({}, {
    //             fromBlock: 0,
    //             toBlock: 'lastest'
    //         }).watch(function(error, event) {
    //             if (!error) {
    //                 $("#AddEmployeeEvents").append('<li class="list-group-item"> Employee ID ' + event.args.id + ' allowance has changed to ' + event.args.allowance + ' ETH</li>');
    //             } else {
    //                 console.error(error);
    //             }
    //             //  App.reloadArticles();
    //         })
    //     });
    // },

    // listenToEmployeeOrderEvents: function() {
    //     App.contracts.Company.deployed().then(function(instance) {
    //         instance.employeeOrderAdded({}, {
    //             fromBlock: 0,
    //             toBlock: 'lastest'
    //         }).watch(function(error, event) {
    //             if (!error) {
    //                 $("#events").append('<li class="list-group-item">  Employee ' + event.args.employeeWallet + ' has just ordered ' + event.args.ethAmount + ' ETH for ' + event.args.rate + " ETH in future. </li>");
    //             } else {
    //                 console.error(error);
    //             }
    //         })
    //     });
    // },

    // listenToCompanyOnwershipAdd: function() {
    //     App.contracts.Company.deployed().then(function(instance) {
    //         instance.ownership({}, {
    //             fromBlock: 0,
    //             toBlock: 'lastest'
    //         }).watch(function(error, event) {
    //             if (!error) {
    //                 $("#eventCompany").append('<li class="list-group-item"> Company Wallet ' +event.args._companyAddress + " ("+event.args.name +") " +" just created! </li>");
    //                 $("#eventCompany").append('<li class="list-group-item"> <a href="AddEmployee.html" class="btn btn-info" role="button" style="background-color:#06016f; border-color: #06016f">Manage Employees</a> </li>');

    //             } else {
    //                 console.error(error);
    //             }
    //         })
    //     });
    // },


};

//login functionality 
function validate(){
    var username= $('#UserRole').find(":selected").text();
    var password = $('#WalletAddress').text();

    if ( username == "Employee"){
        alert ("Employee successfully");
        window.location = "../Employee.html"; //redirecting to other page
    
    } else if( username == "Company") {
        alert ("Company successfully");
        window.location.href = "AddEmployee.html"; //redirecting to other page

    }
}

$(function() {
    $(window).load(function() {
        App.init();
    });
});



