const Blockchain = require('./blockchain');

const bitCoin = new Blockchain();

console.log(bitCoin.chainIsValid([
    {
        "index": 1,
        "timestamp": 1706020688053,
        "transactions": [],
        "nounce": 0,
        "hash": "0000000000000000000000000000000000000000000000000000000000000000",
        "previousBlockHash": "0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
        "index": 2,
        "timestamp": 1706020708215,
        "transactions": [
            {
                "amount": 89,
                "sender": "T8UCEUYB8374KJCNDIJ",
                "recipient": "7O8FIE938475KJDIJD",
                "transactionId": "0F40E640B9FD11EEB4C95FDBB78266B2"
            }
        ],
        "nounce": 6901,
        "hash": "0000de6d6f7fe3ff5743524ed0c5a5b80c7a51c8bd27a961afda0d8626d0d887",
        "previousBlockHash": "0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
        "index": 3,
        "timestamp": 1706020732100,
        "transactions": [
            {
                "amount": 12.5,
                "sender": "00000000000000000000000000000000",
                "recipient": "0668F3F0B9FD11EE9F7321AA7750DD04",
                "transactionId": "1273D6B0B9FD11EE9F7321AA7750DD04"
            }
        ],
        "nounce": 78266,
        "hash": "0000e0bbc02a26f807b33fe008ede880d7f1701203e8d681a233f4a44f6c3fcf",
        "previousBlockHash": "0000de6d6f7fe3ff5743524ed0c5a5b80c7a51c8bd27a961afda0d8626d0d887"
    },
    {
        "index": 4,
        "timestamp": 1706020737421,
        "transactions": [
            {
                "amount": 12.5,
                "sender": "00000000000000000000000000000000",
                "recipient": "0668F3F0B9FD11EE9F7321AA7750DD04",
                "transactionId": "20AEDFE0B9FD11EE9F7321AA7750DD04"
            }
        ],
        "nounce": 17147,
        "hash": "0000f1354fc3a9ffd0f755ef9cf133e781207b43d4e19fe3f07204cc3a996efd",
        "previousBlockHash": "0000e0bbc02a26f807b33fe008ede880d7f1701203e8d681a233f4a44f6c3fcf"
    },
    {
        "index": 5,
        "timestamp": 1706020744651,
        "transactions": [
            {
                "amount": 12.5,
                "sender": "00000000000000000000000000000000",
                "recipient": "0668F3F0B9FD11EE9F7321AA7750DD04",
                "transactionId": "23D944D0B9FD11EE9F7321AA7750DD04"
            }
        ],
        "nounce": 30719,
        "hash": "00005cb86dc39c9b4c896c284f55b2e2f6961229e2c664acc1a926644bb5ba59",
        "previousBlockHash": "0000f1354fc3a9ffd0f755ef9cf133e781207b43d4e19fe3f07204cc3a996efd"
    }
]));
