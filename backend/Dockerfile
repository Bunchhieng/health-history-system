FROM node:18

WORKDIR /usr/src/app

# Copy package.json and tsconfig.json
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]