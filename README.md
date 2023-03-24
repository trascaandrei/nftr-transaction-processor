# nftr-transaction-processor

Before running the processor, make sure the *.env* file is defined with the following content:
```bash
AMQP_PORT=5672
AMQP_HOST=localhost
AMQP_USERNAME=guest
AMQP_PASSWORD=guest
AMQP_QUEUE_NAME=test
AMQP_EXCHANGES=["all_events"]
EVERY_N_MINUTES=1
ADDRESS="<base64 string>"
NFTR_HOST=http://localhost:5005
LIST_NFT_URI=/api/v1/marketplace/nft/
UPDATE_NFT_URI=/api/v1/marketplace/nft
WITHDRAW_NFT_URI=/api/v1/marketplace/nft
NFTR_API_KEY=""
```

## Run the processor
```
npm run start
```