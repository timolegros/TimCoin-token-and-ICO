import './App.css';
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import { Tab, Tabs } from "react-bootstrap"
import Buy from "./Components/Buy";
import React, {useEffect, useState} from "react";
import contract from "@truffle/contract";
import tokenJson from "./build/contracts/token.json"
import tokenSaleJson from "./build/contracts/tokenSale.json"
import Loader from "react-loader-spinner";
import detectEthereumProvider from "@metamask/detect-provider";


function App() {
    const [tokenContract, setTokenContract] = useState(null)
    const [tokenSaleContract, setTokenSaleContract] = useState(null)
    const [loadApp, setLoadApp] = useState(false)
    const [addr, setAddr] = useState("")
    const [tokensSold, setTokensSold] = useState(null)
    const [tokenPrice, setTokenPrice] = useState(null)
    const [tokensRemaining, setTokensRemaining] = useState(null)
    const [accountBalance, setAccountBalance] = useState(null)

    let invalidAccount = false, wrongChain = false, disconnected = false
    let accountAddress

    let ethereum = window.ethereum
    if (ethereum) {
        // listens to the accountsChanged event - if a new account is set than change addr else alert
        ethereum.on("accountsChanged", accountsChanged)

        // listens to chainChanged event - if new chain is selected check if it is the ganache chain with id 1337
        ethereum.on("chainChanged", (chainId) => {
            if (chainId != "1337") {
                wrongChain = true
                alert("Please make sure MetaMask is using the Ganache Custom RPC Network and refresh")
            } else wrongChain = false
        })

        // listens for disconnection events and alerts the user if there is
        ethereum.on("disconnect", (error) => {
            disconnected = true
            alert("MetaMask is disconnected from the selected blockchain network")
            console.warn(error)
        })

        // listens for connection events
        ethereum.on("connect", (connectionInfo) => {
            disconnected = false
        })
    } else {
        alert("You need to install MetaMask to use this application!")
    }

    function accountsChanged(accounts) {
        if (accounts.length === 0) {
            invalidAccount = true
            alert("Please connect an account via MetaMask")
        }
        else if (accounts[0] !== accountAddress) {
            invalidAccount = false
            accountAddress = accounts[0]
            setAddr(accountAddress)
        }
    }

    function refreshValues(tokenContract, tokenSaleContract) {
        let promises = [tokenSaleContract.tokensSold(), tokenSaleContract.tokenPrice(), tokenContract.balanceOf(tokenSaleContract.address)]
        Promise.allSettled(promises).then((results) => {
            setTokensSold(results[0].value.toNumber())
            console.log("Tokens Sold:", results[0].value.toNumber())
            setTokenPrice(results[1].value.toNumber())
            console.log("Token Price:", results[1].value.toNumber())
            setTokensRemaining(results[2].value.toNumber())
            console.log("Tokens Remaining:", results[2].value.toNumber())
        })

        ethereum
            .request({ method: "eth_requestAccounts" })
            .then(accountsChanged) // save the address if it exists
            .then(() => { return tokenContract.balanceOf(accountAddress) })
            .then((balance) => { setAccountBalance(balance.toNumber()) })
            .catch((err) => {
                if (err.code === 4001) {
                    // User rejected the connection request
                    alert("Please allow MetaMask to connect")
                } else {
                    console.warn(err)
                }
            })
    }

    useEffect(() => {
        // the following code is the same as what follows but uses only web3 and not truffle
        // let tokenContract = new Contract(tokenJson["abi"], "0x2F132b1c16724393ec53241f4C1C40EAf8cCC219")
        // tokenContract.setProvider("http://127.0.0.1:7545")
        // tokenContract.methods.totalSupply().call().then((result) => {console.log(result)})
        // tokenContract.methods.totalSupply().send({ from: "0x31f6A5171B42CA63efFA5166dF8A7a5146F83c45"}).then((receipt) => {
        //     console.log(receipt)
        // })

        // loads the Token contract and sets a provider
        let TokenContract = contract(tokenJson)
        TokenContract.setProvider(window.ethereum || "http://127.0.0.1:7545")

        // loads the TokenSale contract and sets a provider
        let TokenSaleContract = contract(tokenSaleJson)
        TokenSaleContract.setProvider(window.ethereum || "http://127.0.0.1:7545")


        Promise.allSettled([TokenContract.deployed(), TokenSaleContract.deployed()])
        .then((results) => {
            if (results[0].status !== "fulfilled" || results[1].status !== "fulfilled") {
                alert("Cannot connect to the contracts. Please refresh, check contract deployment, or try again later.")
            } else {
                setTokenContract(results[0].value)
                setTokenSaleContract(results[1].value)

                refreshValues(results[0].value, results[1].value)
            }
        })

        // used as a timeout to give time for the app to retrieve the contracts and info
        let counter = 0
        let interval = setInterval(() => {
            counter = counter + 1
            if (counter === 1) {
                setLoadApp(true)
                clearInterval(interval)
            }
        }, 1000)
    }, [])


    if (!loadApp || !(typeof tokensSold === "number") || !(typeof tokenPrice === "number") ||
        !(typeof tokensRemaining === "number") || !(typeof accountBalance === "number") || invalidAccount || wrongChain || disconnected) {
        return (
            <div className="h-100 d-flex justify-content-center align-items-center">
                <Loader type="BallTriangle" color="#0275d8" height={100} width={100} />
            </div>
        )
    } else {
        return (
            <div className="App h-100">
                <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"/>
                <Container fluid >
                    <Row>
                        <Col/>
                        <Col className="text-center" md={8}>
                            <h1>TimCoin</h1>
                            <p>
                                TimCoin is an ERC-20 Token that I developed to practice programming in Solidity and using various
                                blockchain development tools like Truffle and Ganache. This front-end interface is built using
                                React and React-Bootstrap.
                            </p>
                            <br/>
                            <Tabs>
                                <Tab eventKey="buy" title="Buy">
                                    <Buy tokenContract={tokenContract} tokenSaleContract={tokenSaleContract}
                                         tokensSold={tokensSold} tokenPrice={tokenPrice}
                                         tokensRemaining={tokensRemaining} accountAddress={addr}
                                         refreshValues={refreshValues}/>
                                </Tab>
                                <Tab eventKey="wallet" title="Wallet">

                                </Tab>
                            </Tabs>
                        </Col>
                        <Col/>
                    </Row>

                </Container>
            </div>
        );
    }
}

export default App;
