FROM node:14-alpine

WORKDIR /code

RUN yarn global add pm2

COPY package.json /code/package.json
COPY yarn.lock /code/yarn.lock

RUN yarn install

COPY . /code

RUN yarn build

CMD ["pm2-runtime", "start"]