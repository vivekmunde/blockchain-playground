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
    const index = bitCoin.createNewTransaction(Number(req.body.amount), req.body.sender, req.body.recipient);
    res.json({ note: `Transaction will be added in block ${index}.` });
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

    bitCoin.createNewTransaction(12.5, '00000000000000000000000000000000', nodeAddress);
    
    const newBlock = bitCoin.createNewBlock(nounce, previousBlockHash, hash);
    
    res.send({
        note: 'New block mined successfully!',
        block: newBlock,
    });
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
