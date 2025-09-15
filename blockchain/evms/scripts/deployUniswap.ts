import { ethers } from "ethers";
import * as dotenv from "dotenv";
import MultiTokenJson from "../artifacts/contracts/MultiToken.sol/MultiToken.json";
import { uniswapAbi } from "../abi/uniswapAbi.js";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

const MULTI_TOKEN = "0xD1F610930d3D2c169efA834b865f37EC41418b4b";
const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

async function main() {
  const multiToken = new ethers.Contract(
    MULTI_TOKEN,
    MultiTokenJson.abi,
    signer
  );
  const router = new ethers.Contract(UNISWAP_ROUTER, uniswapAbi, signer);

  const approveTx = await multiToken.approve(UNISWAP_ROUTER, ethers.MaxUint256);
  await approveTx.wait();

  const amountToken = ethers.parseUnits("10000", 18);
  const amountETH = ethers.parseEther("0.01");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const tx = await router.addLiquidityETH(
    MULTI_TOKEN,
    amountToken,
    amountToken,
    amountETH,
    await signer.getAddress(),
    deadline,
    { value: amountETH }
  );
  await tx.wait();

  console.log("Liquidity added! MTK now has a market on Uniswap.");
}

main().catch(console.error);
