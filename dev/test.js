const Blockchain = require('./blockchain');

const bitCoin = new Blockchain();

console.log(bitCoin);

// bitCoin.createNewBlock(2389, 'isuhf9832982hf8wefh', '9843fy98whf9384f321');

// bitCoin.createNewTransaction(100, 'AAAA274ry827h247fr', 'BBBBB98d9283hddh9d8h');

// bitCoin.createNewBlock(2389, '9843fy98whf9384f321', 'w9jc9w8efuw98fuwe9e');

// const nounce = bitCoin.proofOfWork('000089702c0a788c60a3ca8f116a74e271da33e9d6711a859ec269843d9be35b', bitCoin.chain[bitCoin.chain.length - 1].transactions);

// console.log(nounce);
// console.log(bitCoin.hashBlock('000089702c0a788c60a3ca8f116a74e271da33e9d6711a859ec269843d9be35b', bitCoin.chain[bitCoin.chain.length - 1].transactions, nounce));
