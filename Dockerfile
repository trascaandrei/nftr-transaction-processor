FROM node as builder

# Create app directory
WORKDIR /usr/app/nftr_transaction_processor

# Install app dependencies
COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

###################################
FROM node:slim

# Create app directory
WORKDIR /usr/app/nftr_transaction_processor

# Install app dependencies
COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/app/nftr_transaction_processor/dist/ ./dist/

CMD [ "node", "dist/server.js" ]
