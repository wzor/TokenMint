import React from 'react';
import { connect } from 'react-redux';
import { Panel, Form, FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';
import { generateTokenTransaction, estimateTokenGas } from '../../store/tokenActions';
import { CreateTxModal } from '../transaction/createModal';
import OpenWallet from '../wallet/open';
import { hexToDecimal } from '../../lib/convert';

const DefaultGas = "0x11a7a7";

class CreateTokenForm extends React.Component {
  constructor(props) {
    super(props);
    this.initToken = this.initToken.bind(this);
    this.estimateGas = this.estimateGas.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.changeGas = this.changeGas.bind(this);
    this.state = {
      symbol: 'POOP',
      decimals: 8,
      modalShow: false, 
      showTx: false,
      gas: DefaultGas,
      tx: {},
    };
  }

  getRequiredValidation(key) {
    if (this.state.key) return 'success';
    else return 'warning';
  }

  handleChange(e) {
    this.setState({ [e.target.id]: e.target.value });
  }

  changeGas(e) {
    this.setState({ gas: e.target.value })
  }

  estimateGas() {
    const data = {
      token: this.state.token,
      symbol: this.state.symbol,
      totalSupply: this.state.totalSupply,
      decimals: this.state.decimals,
    }
    this.props.estimateGas(data, this.props.wallet)
      .then((result) => { 
        this.setState({ modalShow: true, 
                        showTx: false
                      });
        this.setState({ gas: result || DefaultGas});
      })
  }

  initToken() {
    console.log(this.state)
    const data = {
      token: this.state.token,
      symbol: this.state.symbol,
      totalSupply: this.state.totalSupply,
      decimals: this.state.decimals,
      gasLimit: this.state.gas,
    }
    this.props.initToken(data, this.props.wallet)
      .then((result) => { 
        this.setState({ modalShow: true, 
                        showTx: true,
                        tx: result
                      });
      })
  }

  render() {
    let modalClose = () => this.setState({ modalShow: false });

    return (
      <div>
        <Form>
          <FormGroup
            controlId="token"
            validationState={this.getRequiredValidation('token')}
          >
            <ControlLabel>Token Name</ControlLabel>
            <FormControl
              type="text"
              value={this.state.token}
              placeholder="Scamcoin"
              onChange={this.handleChange}
            />
            <FormControl.Feedback />
          </FormGroup>

          <FormGroup
            controlId="totalSupply"
            validationState={this.getRequiredValidation('totalSupply')}
          >
            <ControlLabel>Total Supply</ControlLabel>
            <FormControl
              type="number"
              value={this.state.totalSupply}
              placeholder="1000000"
              onChange={this.handleChange}
            />
            <FormControl.Feedback />
          </FormGroup>

          <FormGroup
            controlId="symbol"
          >
            <ControlLabel>Token Symbol (optional)</ControlLabel>
            <FormControl
              type="text"
              value={this.state.symbol}
              placeholder="POOP"
              onChange={this.handleChange}
            />
            <FormControl.Feedback />
          </FormGroup>

          <FormGroup
            controlId="decimals"
          >
            <ControlLabel>Decimal Places (optional)</ControlLabel>
            <FormControl
              type="number"
              value={this.state.decimals}
              placeholder="8"
              onChange={this.handleChange}
            />
            <FormControl.Feedback />
          </FormGroup>
        </Form>
        {this.props.wallet &&
          <Button 
            bsStyle="primary"
            onClick={this.estimateGas} >
            LET'S DO THIS
          </Button>}
        {!this.props.wallet && 
          <Panel header="Please unlock your account to continue">
              <OpenWallet />
          </Panel>
        }

        <CreateTxModal 
          show={this.state.modalShow} 
          close={modalClose} 
          showTx={this.state.showTx}
          rawTx={this.state.tx.rawTx}
          signedTx={this.state.tx.signedTx}
          gas={hexToDecimal(this.state.gas || DefaultGas)}
          changeGas={this.changeGas}
          onGenerate={this.initToken}
          />
      </div>
    );
  }
};


const CreateToken = connect(
  (state, ownProps) => {
    return {
      wallet: state.wallet.get('wallet')
    }
  },
  (dispatch, ownProps) => ({
    estimateGas: (data, wallet) => {
      return new Promise((resolve, reject) => {
        dispatch(estimateTokenGas( data, wallet ))
        .then((result) => resolve(result));
      })      
    },
    initToken: (data, wallet) => {
      return new Promise((resolve, reject) => {
        dispatch(
          generateTokenTransaction( data, wallet )
        ).then((result) => resolve(result))
      })
    }
  })
)(CreateTokenForm)

export default CreateToken;
