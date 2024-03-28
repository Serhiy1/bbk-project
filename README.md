# Scitt Inspired Transparency Service 
## Abstract
This repository contains the code for my final year project at Birkbeck university. The project is inspired emerging ecosystem of transparency and trust services based on the IETF SCITT standard. 
It serves as a demonstration of how I can develop the service in typescript and deploy it to the cloud, rather than an implementation of the SCITT standard itself (which at the time of writing is still in draft form). 

## Running the project

The project in its current state it self contained and tests can be run locally.

1. Make sure Node.js is installed
2. Clone the repository
3. inside the project directory run `npm install`
4. run `npm test` to run the tests - This will use jest and mongodb-memory-server to run the tests
5. run `npm start` to start the service - you will need to provide a valid mongodb connection string in the .env file
   

