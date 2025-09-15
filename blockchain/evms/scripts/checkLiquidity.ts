import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Uniswap V2 factory
const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

// ERC20 token addresses
const TOKEN0 = "0xD1F610930d3D2c169efA834b865f37EC41418b4b"; // MultiToken
const TOKEN1 = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // USDT

// Pair ABI
const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

async function main() {
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

  // Lấy pair address
  const pairAddress = await factory.getPair(TOKEN0, TOKEN1);
  if (pairAddress === ethers.ZeroAddress) {
    console.log("Pair chưa tồn tại trên Uniswap V2!");
    return;
  }

  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);

  // Lấy reserves
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  console.log("Pair address:", pairAddress);
  console.log("Token0:", token0, "Reserve:", reserve0.toString());
  console.log("Token1:", token1, "Reserve:", reserve1.toString());
}

main().catch(console.error);
