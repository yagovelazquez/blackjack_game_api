# blackjack_game_api

## Getting Started
To get started, you need to configure a `.env` file like this example:

```env
SERVER_PORT=3003
NODE_ENV=development

DB_USERNAME=dev_frestar_api
DB_PASSWORD=dev_frestar_api
DB_DATABASE=dev_frestar_api
DB_PORT=3306

DB_TEST_USERNAME=test_freestar_api
DB_TEST_PASSWORD=test_freestar_api
DB_TEST_DATABASE=test_freestar_api
DB_TEST_PORT=3307

CLIENT_URL=http://localhost:3000

SEED_DB=true
```


Then you have to install docker-compose and hit
docker-compose up

Then you can run
node src/server
or
nodemon src/server

## Testing
For testing you can run the command
npm test
