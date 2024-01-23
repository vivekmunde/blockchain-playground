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

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
