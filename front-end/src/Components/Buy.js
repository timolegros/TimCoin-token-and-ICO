import Form from "react-bootstrap/Form"
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import {Button} from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar"
import {useEffect, useState} from "react";


const Buy = ({ tokenContract, tokenSaleContract, tokensSold, tokenPrice, tokensRemaining, accountAddress, refreshValues }) => {
    const [isLoading, setLoading] = useState(false)
    const [validated, setValidated] = useState(false)
    const [numberOfTokens, setNumberOfTokens] = useState(1)


    const handleSubmit = (event) => {
        if (!isLoading) setLoading(true)
        console.log(numberOfTokens)

        const form = event.currentTarget
        if (form.checkValidity() === false) {
            event.preventDefault()
            event.stopPropagation()
        } else {
            event.preventDefault()
            tokenSaleContract.buyTokens(numberOfTokens, {from: accountAddress, value: numberOfTokens * tokenPrice}).then(() => {
                refreshValues(tokenContract, tokenSaleContract)
            }).catch((error) => {
                if (error.code === 4001) {
                    console.warn("Transaction Rejected")
                }
            })

            setLoading(false)
        }

        setValidated(true)

    }

    const handleChange = (event) => setNumberOfTokens(Number(event.target.value))

        return (
            <div>
                <Col md={{ span: 8, offset: 2 }}>
                    <p>Current Account Address: {accountAddress}</p>
                    <Row>
                        <Form noValidate validated={validated} onSubmit={handleSubmit} className="mx-auto mt-4">
                            <Form.Row>
                                <Form.Group>
                                    <Form.Label htmlFor="inlineFormInput" srOnly>Name</Form.Label>
                                    <Form.Control id="numberOfToken" placeholder="1" type="number" min="1" required
                                                  onChange={handleChange} defaultValue="1"/>
                                    <Form.Control.Feedback type="invalid">
                                        Please enter a whole number
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group >
                                    <Button type="submit" variant="primary" disabled={isLoading}>
                                        { isLoading ? "Loading..." : "Buy Tokens" }
                                    </Button>
                                </Form.Group>
                            </Form.Row>
                        </Form>
                    </Row>
                    <Row className="justify-content-center">
                        <Col xs={7}>
                            <ProgressBar animated now={(tokensSold/tokensRemaining) * 100} />
                            <p>{tokensSold}/{tokensRemaining + tokensSold} Tokens Sold</p>
                        </Col>
                    </Row>
                </Col>
            </div>
        )

}

export default Buy