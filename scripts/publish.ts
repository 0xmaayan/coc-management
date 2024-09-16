import fs from "node:fs";

import {
  AptosConfig,
  Aptos,
  Network,
  NetworkToNodeAPI,
  AccountAddress,
} from "@aptos-labs/ts-sdk";
import { Move } from "@aptos-labs/ts-sdk/dist/common/cli/index.js";

export async function publish() {
  const aptosConfig = new AptosConfig({
    network: process.env.APP_NETWORK as Network,
  });
  const aptos = new Aptos(aptosConfig);

  // Make sure COLLECTION_CREATOR_ADDRESS is set
  if (!process.env.COLLECTION_CREATOR_ADDRESS) {
    throw new Error(
      "Please set the COLLECTION_CREATOR_ADDRESS in the .env file"
    );
  }

  // Make sure COLLECTION_CREATOR_ADDRESS exists
  try {
    await aptos.getAccountInfo({
      accountAddress: process.env.COLLECTION_CREATOR_ADDRESS,
    });
  } catch (error) {
    console.log("Error fetching the COLLECTION_CREATOR_ADDRESS info", error);
    throw new Error(
      "Account does not exist on chain. Make sure you have set up the correct address as the COLLECTION_CREATOR_ADDRESS in the .env file"
    );
  }

  if (!process.env.MODULE_PUBLISHER_ACCOUNT_ADDRESS) {
    throw new Error(
      "MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY variable is not set, make sure you have set the publisher account address"
    );
  }

  if (!process.env.MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY) {
    throw new Error(
      "MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY variable is not set, make sure you have set the publisher account private key"
    );
  }

  let tokenMinterContractAddress;
  switch (process.env.APP_NETWORK) {
    case "testnet":
      tokenMinterContractAddress =
        "0x3c41ff6b5845e0094e19888cba63773591be9de59cafa9e582386f6af15dd490";
      break;
    case "mainnet":
      tokenMinterContractAddress =
        "0x5ca749c835f44a9a9ff3fb0bec1f8e4f25ee09b424f62058c561ca41ec6bb146";
      break;
    default:
      throw new Error(
        `Invalid network used. Make sure process.env.APP_NETWORK is either mainnet or testnet`
      );
  }

  const move = new Move();

  const response = await move.createObjectAndPublishPackage({
    packageDirectoryPath: "contract",
    addressName: "launchpad_addr",
    namedAddresses: {
      // Publish module to new object, but since we create the object on the fly, we fill in the publisher's account address here
      launchpad_addr: AccountAddress.fromString(
        process.env.MODULE_PUBLISHER_ACCOUNT_ADDRESS!
      ),
      // This is the address you want to use to create collection with, e.g. an address in Petra so you can create collection in UI using Petra
      initial_creator_addr: AccountAddress.fromString(
        process.env.COLLECTION_CREATOR_ADDRESS!
      ),
      // Our contract depends on the token-minter contract to provide some common functionalities like managing refs and mint stages
      // You can read the source code of it here: https://github.com/aptos-labs/token-minter/
      // Please find it on the network you are using, This is testnet deployment
      minter: tokenMinterContractAddress,
    },
    extraArguments: [
      `--private-key=${process.env.MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY}`,
      `--url=${NetworkToNodeAPI[process.env.APP_NETWORK!]}`,
      "--assume-yes",
      "--skip-fetch-latest-git-deps",
    ],
  });

  const filePath = ".env";
  let envContent = "";

  // Check .env file exists and read it
  if (fs.existsSync(filePath)) {
    envContent = fs.readFileSync(filePath, "utf8");
  }

  // Regular expression to match the MODULE_ADDRESS variable
  const regex = /^MODULE_ADDRESS=.*$/m;
  const newEntry = `MODULE_ADDRESS=${response.objectAddress}`;

  // Check if MODULE_ADDRESS is already defined
  if (envContent.match(regex)) {
    // If the variable exists, replace it with the new value
    envContent = envContent.replace(regex, newEntry);
  } else {
    // If the variable does not exist, append it
    envContent += `\n${newEntry}`;
  }

  // Write the updated content back to the .env file
  fs.writeFileSync(filePath, envContent, "utf8");
}
