const sha256 = require('sha256');
const uuid = require('uuid');

const currentNodeUrl = process.argv[3];

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];
  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];

  this.createNewBlock(0, '0000000000000000000000000000000000000000000000000000000000000000', '0000000000000000000000000000000000000000000000000000000000000000');
}

Blockchain.prototype.createNewBlock = function(nounce, previousBlockHash, hash) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nounce: nounce,
    hash: hash,
    previousBlockHash: previousBlockHash,
  };

  this.pendingTransactions = [];

  this.chain.push(newBlock);

  return newBlock;
}

Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
  const newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    transactionId: uuid.v1().split('-').join('').toUpperCase(),
  };

  return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transaction) {
  this.pendingTransactions.push(transaction);

  return this.getLastBlock().index + 1;
}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nounce) {
  const dataAsString = previousBlockHash + nounce.toString() + JSON.stringify(currentBlockData);
  
  const hash = sha256(dataAsString);

  return hash;
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
  let nounce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nounce);

  while(hash.substring(0, 4) !== '0000') {
    nounce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nounce);
  }

  return nounce;
}

Blockchain.prototype.chainIsValid = function(blockchainToValidate) {
  let chainIsValid = true;

  for(let i = 1; i < blockchainToValidate.length; i++) {
    const currentBlock = blockchainToValidate[i];
    const previousBlock = blockchainToValidate[i - 1];

    const currentBlockHash = this.hashBlock(
      previousBlock.hash,
      {
        transactions: currentBlock.transactions,
        index: currentBlock.index,
      },
      currentBlock.nounce,
    );

    if(currentBlock.previousBlockHash !== previousBlock.hash
      || currentBlockHash.substring(0, 4) !== '0000'
      || currentBlockHash !== currentBlock.hash) {
      chainIsValid = false;
      break;
    }
  }

  const genesisBlock = blockchainToValidate[0];

  if(genesisBlock.index !== 1
    || genesisBlock.hash !== '0000000000000000000000000000000000000000000000000000000000000000'
    || genesisBlock.previousBlockHash !== '0000000000000000000000000000000000000000000000000000000000000000'
    || genesisBlock.nounce !== 0
    || genesisBlock.transactions.length !== 0) {
      chainIsValid = false;
    }

  return chainIsValid;
};

module.exports = Blockchain;
