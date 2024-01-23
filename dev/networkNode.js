const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const requestPromise = require('request-promise');
const Blockchain = require('./blockchain');

const app = express();
const port = process.argv[2];
const nodeAddress = uuid.v1().split('-').join('').toUpperCase();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const bitCoin = new Blockchain();

app.get('/blockchain', (req, res) => {
    res.send(bitCoin);
});

app.post('/transaction', (req, res) => {
    const newTransaction = req.body;

    const index = bitCoin.addTransactionToPendingTransactions(newTransaction);
    
    res.json({ note: `Transaction will be added in block ${index}.` });
});

app.post('/transaction/broadcast', (req, res) => {
    const newTransaction = bitCoin.createNewTransaction(Number(req.body.amount), req.body.sender, req.body.recipient);
    
    bitCoin.addTransactionToPendingTransactions(newTransaction);

    const transactionPromises = [];

    bitCoin.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };

        transactionPromises.push(requestPromise(requestOptions));
    });

    Promise.all(transactionPromises).then(() => {
        const index = bitCoin.getLastBlock().index + 1;

        res.json({ note: `New transaction created and broadcasted successfully which will be added in block ${index}.` });
    });
});

app.get('/mine', (req, res) => {
    if(bitCoin.pendingTransactions.length > 0) {
        const previousBlock = bitCoin.getLastBlock();
        const previousBlockHash = previousBlock.hash;

        const currentBlockData = {
            transactions: bitCoin.pendingTransactions,
            index: previousBlock.index + 1,
        };
        
        const nounce = bitCoin.proofOfWork(previousBlockHash, currentBlockData);
        
        const hash = bitCoin.hashBlock(previousBlockHash, currentBlockData, nounce);
        
        const newBlock = bitCoin.createNewBlock(nounce, previousBlockHash, hash);

        const receiveNewBlockPromises = [];

        bitCoin.networkNodes.forEach((networkNodeUrl) => {
            const requestOptions = {
                uri: networkNodeUrl + '/receive-new-block',
                method: 'POST',
                body: { newBlock: newBlock },
                json: true
            };

            receiveNewBlockPromises.push(requestPromise(requestOptions));
        });

        Promise.all(receiveNewBlockPromises).then(() => {
            return requestPromise({
                uri: bitCoin.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 12.5,
                    sender: '00000000000000000000000000000000',
                    recipient: nodeAddress
                },
                json: true
            });
        }).then(() => {
            res.send({
                note: 'New block mined and broadcasted successfully!',
                block: newBlock,
            });
        });
    } else {
        res.send({
            note: 'No pending transactions to mine!'
        });
    }
});

app.post('/receive-new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = bitCoin.getLastBlock();

    const hasCorrectIndex = (lastBlock.index + 1) === newBlock.index;
    const hasCorrectHash = lastBlock.hash === newBlock.previousBlockHash;

    if(hasCorrectIndex && hasCorrectHash) {
        bitCoin.chain.push(newBlock);
        bitCoin.pendingTransactions = [];

        res.json({
            note: 'New block received and accepted!',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New block rejected!',
            newBlock: newBlock
        });
    }
});

app.post('/register-and-boradcast-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;

    if(bitCoin.currentNodeUrl !== newNodeUrl) {
        if(bitCoin.networkNodes.indexOf(newNodeUrl) === -1) {
            bitCoin.networkNodes.push(newNodeUrl);
        }

        const registerNodesPromises = [];

        bitCoin.networkNodes.forEach((networkNodeUrl) => {
            const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
            };

            registerNodesPromises.push(requestPromise(requestOptions));
        });

        Promise.all(registerNodesPromises).then((response) => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitCoin.networkNodes, bitCoin.currentNodeUrl] },
                json: true
            };

            return requestPromise(bulkRegisterOptions);
        }).then((response) => {
            res.json({
                note: 'New node registered successfully with network!'
            });
        });
    } else {
        res.json({
            note: 'Cannot registered myself with network!'
        });
    }
});

app.post('/register-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;

    if(bitCoin.currentNodeUrl !== newNodeUrl && bitCoin.networkNodes.indexOf(newNodeUrl) === -1) {
        bitCoin.networkNodes.push(newNodeUrl);
    }

    res.json({
        note: 'Node registered sucessfully!'
    });
});

app.post('/register-nodes-bulk', (req, res) => {
    bitCoin.networkNodes = req.body.allNetworkNodes.filter((it) => it !== bitCoin.currentNodeUrl && bitCoin.networkNodes.indexOf(it) === -1);

    res.json({
        note: 'Nodes bulk registered sucessfully!'
    });
});

app.post('/register-and-broadcast-all-nodes', (req, res) => {
    const options = {
        uri: bitCoin.currentNodeUrl + '/register-and-boradcast-node',
        method: 'POST',
        body: { newNodeUrl: 'http://localhost:3001' },
        json: true
    };

    requestPromise(options).then(() => {
        options.body.newNodeUrl = 'http://localhost:3002';
        return requestPromise(options);
    }).then(() => {
        options.body.newNodeUrl = 'http://localhost:3003';
        return requestPromise(options);
    }).then(() => {
        options.body.newNodeUrl = 'http://localhost:3004';
        return requestPromise(options);
    }).then(() => {
        res.json({ note: 'Nodes synchronised successfully!' });
    });
});

app.get('/consensus', (req, res) => {
    const blockchainPromises = [];

    bitCoin.networkNodes.forEach((networkNodeUrl) => {
        const options = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        };

        blockchainPromises.push(requestPromise(options));
    });

    Promise.all(blockchainPromises).then((blockchains) => {
        const currentChainLength = bitCoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = undefined;
        let newPendingTransactions = undefined;

        blockchains.forEach((blockchain) => {
            if(blockchain.chain.length > currentChainLength) {
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newPendingTransactions = blockchain.pendingTransactions;
            }
        });

        if(newLongestChain && bitCoin.chainIsValid(newLongestChain)) {
            bitCoin.chain = newLongestChain;
            bitCoin.pendingTransactions = newPendingTransactions;

            res.json({
                note: 'Chain has been replaced.',
                chain: bitCoin.chain
            });
        } else {
            res.json({
                note: 'Chain has not been replaced.',
                chain: bitCoin.chain
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
