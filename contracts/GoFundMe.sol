// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;


import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";


error GoFundMe__NotOwner();
error GoFundMe__DidNotFundEnough();
error GoFundMe__CallFailed();

/** @title A contract for crowd funding
*   @author Jason Schneider
*   @notice This contract is to demo a sample crowd funding contract
*   @dev This implements price feeds as our library
*/
contract GoFundMe {
    // Type declarations
    using PriceConverter for uint256;

    // State variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] private s_funders;
    address private immutable i_owner;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed;

    // Events

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner){
            revert GoFundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
    *   @notice This functions funds this contract
    */
    function fund() public payable {
        //require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You did not send enough ether. Need to send the minimum funding amount.");
        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD){
            revert GoFundMe__DidNotFundEnough();
        }

        if (s_addressToAmountFunded[msg.sender] == 0){
            s_funders.push(msg.sender);
        }
        s_addressToAmountFunded[msg.sender] = s_addressToAmountFunded[msg.sender] + msg.value;
    }

    /**
    *   @notice This functions allows the contract owner to withdraw the funds from the contract
    */
    function withdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (uint funderIndex = 0; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // reset the array
        s_funders = new address[](0);
        // withdraw the funds
        (bool callSuccess, ) = payable(msg.sender).call{ value: address(this).balance }("");
        //require(callSuccess, "Call failed!");
        if (!callSuccess){
            revert GoFundMe__CallFailed();
        }
    }

    function getOwner() public view returns(address){
        return i_owner;
    }

    function getFunder(uint256 index) public view returns(address){
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder) public view returns(uint256){
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns(AggregatorV3Interface){
        return s_priceFeed;
    }
}