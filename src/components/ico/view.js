import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col, Panel } from 'react-bootstrap';
import { FormGroup, FormControl, HelpBlock, ControlLabel, Button } from 'react-bootstrap';
import { BuyTokenModal } from '../transaction/modals';
import { generateBuyIco } from '../../store/tokenActions';
import OpenWallet from '../wallet/open';
import { sendTransaction } from '../../store/transactionActions';
import { toFiat, toEther } from '../../lib/etherUnits';
import { decimalToHex } from '../../lib/convert';
import { fetchIco, getBalanceOf } from '../../store/icoActions';
import logo from '../../img/logo.png';

const DefaultGas = 21000;

class RenderIco extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalShow: false, 
      showTx: false,
      gas: decimalToHex(DefaultGas),
      tx: {},
      id: this.props.match.params.id,
      amount: 1,
    };
  }

  componentWillMount() {
    this.props.dispatch(fetchIco(this.state.id));
  }

  handleChange = (e) => 
    this.setState({ [e.target.id]: e.target.value });


  buyIco = () => {
    const data = {
      amount: this.state.amount,
      gasLimit: this.state.gas,
    }
    this.setState({ modalShow: true, 
                    showTx: false
                  });
    this.props.buyIco(data, this.props.wallet)
      .then((result) => {
        this.setState({ modalShow: true,
                        showTx: true,
                        tx: result
                      });
      })
  }


  submitTx = () => 
    this.props.sendTransaction(
        this.state.tx.signedTx, 
        this.state,
        this.props.wallet.getAddressString()
        ).then((result) => {
          this.setState({ modalShow: false, showTx: false, amount: 0 })
      })


  render() {
    
    let modalClose = () => this.setState({ modalShow: false });
    let cost = this.props.price * this.state.amount;
    let costUSD = (this.props.usdRate && cost) ? toFiat(cost, "ether", this.props.usdRate.rate) : "0.00";
    let fundingGoalUSD = (this.props.usdRate && this.props.fundingGoal) ? 
      toFiat(this.props.fundingGoal, "ether", this.props.usdRate.rate) : "0.00";
    let amountRaisedUSD = (this.props.usdRate && this.props.amountRaised) ? 
      toFiat(this.props.amountRaised, "ether", this.props.usdRate.rate) : "0.00";
    let priceUSD = (this.props.usdRate && this.props.price) ? 
      toFiat(this.props.price, "ether", this.props.usdRate.rate) : "0.00";

    return (
      <Grid>
        <Row>
          <Col sm={6}>
            <a href="/">
              <img className="col-md-6 col-sm-8" src={logo} alt="TokenMint"  />
            </a>
          </Col>
        </Row>
        {this.props.ico && <Row>
          <Col>
            <h1>{this.props.ico.get("tokenName")}({this.props.ico.get("symbol")})</h1>

            <Panel bsStyle="info" 
              header={`${this.props.amountRaised} ETC Raised (${amountRaisedUSD})`} > 
          
              <Row>
                <Col sm={4}>Funding Goal</Col>
                <Col sm={8}>{this.props.fundingGoal} ETC (${fundingGoalUSD})</Col>
              </Row>
              <Row>
                <Col sm={4}>Token Price</Col>
                <Col sm={8}>{this.props.price} ETC (${priceUSD}) </Col>
              </Row>
              <hr />
              <Row>
                <Col sm={4}>Number of Tokens Available</Col>
                <Col sm={8}>{this.props.ico.get("initialSupply")} {this.props.ico.get("symbol")}</Col>
              </Row>                        
              <Row>
                <Col sm={4}>Token Contract</Col>
                <Col sm={8}>
                  <a href={`http://gastracker.io/addr/${this.props.ico.get("tokenAddress")}`} 
                    rel="noopener noreferrer"
                    target="_blank">
                    {this.props.ico.get("tokenAddress")}
                    {`Sale Address: ${this.state.id}`}
                  </a>
                </Col>
              </Row>
              <Row>
                <Col sm={4}>Crowdsale Address</Col>
                <Col sm={8}>
                  <a href={`http://gastracker.io/addr/${this.state.id}`} 
                    rel="noopener noreferrer"
                    target="_blank">
                    {this.state.id}
                  </a>
                </Col>
              </Row>
            </Panel>


          </Col>
        </Row>}
        {!this.props.ico && <Row>
          <Col>
            <h1>Loading...</h1>
          </Col>
        </Row>}


        <Panel bsStyle="success" header="Buy Tokens" footer={`Total cost: ${cost} ETC  ($${costUSD} USD)`}>
            <FormGroup
              controlId="amount"
            >
              <ControlLabel>Number of Tokens to Buy</ControlLabel>
              <FormControl
                type="number"
                placeholder="1"
                onChange={this.handleChange}
              />
              <HelpBlock>You will be able to withdraw your payment at any time before the funding goal is reached.</HelpBlock>
            </FormGroup>

          {this.props.wallet &&
            <FormGroup>
              <Button 
                bsStyle="primary"
                onClick={this.buyIco} >
                BUY {this.props.ico.get('symbol')}
              </Button>
            </FormGroup>}
          </Panel>
          {this.props.wallet && 
            <Panel bsStyle="success">
              {this.props.ico.get('tokenName')} Tokens Owned: 
              {this.props.balance} 
              <Button 
                bsStyle="danger"
                onClick={this.props.getBalance(this.props.ico.get('tokenAddress'), this.props.wallet)}
                bsSize="xs" >
                Check Balance
              </Button>
            </Panel>}

            {!this.props.wallet && 
              <Panel header="Please unlock your account to continue">
                OR, pay with Bitcoin!
                <OpenWallet />
              </Panel>}

        
        <BuyTokenModal 
          show={this.state.modalShow} 
          close={modalClose} 
          showTx={this.state.showTx}
          rawTx={this.state.tx.rawTx}
          signedTx={this.state.tx.signedTx}
          submitTx={this.submitTx}
          />

      </Grid>
    );

  }
}

const ViewIco = connect(
    (state, ownProps) => {
      const rates = state.wallet.get('rates');
      const usdRate = rates.filter((r)=>r.currency==='usd')[0];
      const fundingGoal = state.ico.get('ico') && 
        toEther((state.ico.get('ico').get('fundingGoal') || 0), 'wei');
      const amountRaised = state.ico.get('ico') && 
        toEther((state.ico.get('ico').get('amountRaised') || 0), 'wei');
      const price = state.ico.get('ico') && 
        toEther((state.ico.get('ico').get('price') || 0), 'wei');
      const balance = state.ico.get('balance').toString(10);
      return {
        ico: state.ico.get('ico'),
        wallet: state.wallet.get('wallet'),
        fundingGoal,
        amountRaised,
        price,
        usdRate,
        balance,
      }
    },
    (dispatch, ownProps) => ({
      dispatch,
      getBalance: (token, wallet) => {
        dispatch(getBalanceOf(token, wallet.getAddressString()));
      },
      buyIco: (data, wallet) => {
        return new Promise((resolve, reject) => {
          dispatch(
            generateBuyIco( data, wallet )
          ).then((result) => resolve(result))
        })
      },
      sendTransaction: (tx, data, address) => {
        const afterTx = (txhash) => {
          console.log(txhash)
        };

        const resolver = (resolve, f) => (x) => {
          f.apply(x);
          resolve(x);
        };

        return new Promise((resolve, reject) => {
          dispatch(sendTransaction( tx ))
            .then(resolver(afterTx, resolve));
        });
      },
    })
)(RenderIco);

export default ViewIco;
