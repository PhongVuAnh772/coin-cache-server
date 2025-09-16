import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const networks: Record<string, { rpc: string; chainId: number }> = {
  sepolia: {
    rpc: process.env.ETH_SEPOLIA_RPC!,
    chainId: Number(process.env.ETH_SEPOLIA_CHAINID),
  },
  bsc_testnet: {
    rpc: process.env.BSC_TESTNET_RPC!,
    chainId: Number(process.env.BSC_TESTNET_CHAINID),
  },
  polygon_mumbai: {
    rpc: process.env.POLYGON_MUMBAI_RPC!,
    chainId: Number(process.env.POLYGON_MUMBAI_CHAINID),
  },
};

async function mintToken(
  network: string,
  contractAddress: string,
  contractAbi: any,
  recipient: string,
  amount: string,
  privateKey: string
) {
  if (!networks[network]) throw new Error("Network not supported");

  const { rpc, chainId } = networks[network];
  const provider = new ethers.JsonRpcProvider(rpc, { name: network, chainId });
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

  const tx = await contract.mint(recipient, amount); // Phụ thuộc hàm mint trong contract
  console.log(`Transaction hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Mint completed in block ${receipt.blockNumber}`);
  return receipt;
}
