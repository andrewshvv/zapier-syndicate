

async function main() {
   // use main to capture the deployed contract address and then write to environment file located in .zapier-syndicate-web/src/environments/environment.ts 
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });