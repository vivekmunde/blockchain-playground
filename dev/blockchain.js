const sha256 = require('sha256');

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

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
  };

  this.pendingTransactions.push(newTransaction);

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

module.exports = Blockchain;
