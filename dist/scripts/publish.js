import fs from "node:fs";
import { AptosConfig, Aptos, NetworkToNodeAPI, AccountAddress, } from "@aptos-labs/ts-sdk";
import { Move } from "@aptos-labs/ts-sdk/dist/common/cli/index.js";
export async function publish() {
    const aptosConfig = new AptosConfig({
        network: process.env.APP_NETWORK,
    });
    const aptos = new Aptos(aptosConfig);
    if (!process.env.COLLECTION_CREATOR_ADDRESS) {
        throw new Error("Please set the COLLECTION_CREATOR_ADDRESS in the .env file");
    }
    try {
        await aptos.getAccountInfo({
            accountAddress: process.env.COLLECTION_CREATOR_ADDRESS,
        });
    }
    catch (error) {
        console.log("Error fetching the COLLECTION_CREATOR_ADDRESS info", error);
        throw new Error("Account does not exist on chain. Make sure you have set up the correct address as the COLLECTION_CREATOR_ADDRESS in the .env file");
    }
    if (!process.env.MODULE_PUBLISHER_ACCOUNT_ADDRESS) {
        throw new Error("MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY variable is not set, make sure you have set the publisher account address");
    }
    if (!process.env.MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY) {
        throw new Error("MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY variable is not set, make sure you have set the publisher account private key");
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
            throw new Error(`Invalid network used. Make sure process.env.APP_NETWORK is either mainnet or testnet`);
    }
    console.log("tokenMinterContractAddress", tokenMinterContractAddress);
    const move = new Move();
    console.log("calls createObjectAndPublishPackage....");
    const response = await move.createObjectAndPublishPackage({
        packageDirectoryPath: "contract",
        addressName: "launchpad_addr",
        namedAddresses: {
            launchpad_addr: AccountAddress.fromString(process.env.MODULE_PUBLISHER_ACCOUNT_ADDRESS),
            initial_creator_addr: AccountAddress.fromString(process.env.COLLECTION_CREATOR_ADDRESS),
            minter: AccountAddress.fromString(tokenMinterContractAddress),
        },
        extraArguments: [
            `--private-key=${process.env.MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY}`,
            `--url=${NetworkToNodeAPI[process.env.APP_NETWORK]}`,
            "--assume-yes",
            "--skip-fetch-latest-git-deps",
        ],
    });
    console.log("finish createObjectAndPublishPackage....");
    const filePath = ".env";
    let envContent = "";
    console.log(`trying write to .env file the module address ${response.objectAddress}`, filePath);
    if (fs.existsSync(filePath)) {
        envContent = fs.readFileSync(filePath, "utf8");
    }
    const regex = /^MODULE_ADDRESS=.*$/m;
    const newEntry = `MODULE_ADDRESS=${response.objectAddress}`;
    if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newEntry);
    }
    else {
        envContent += `\n${newEntry}`;
    }
    fs.writeFileSync(filePath, envContent, "utf8");
}
//# sourceMappingURL=publish.js.map