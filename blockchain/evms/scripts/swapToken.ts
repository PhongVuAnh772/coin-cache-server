import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { uniswapAbi } from "../abi/uniswapAbi.js";
import { erc20Abi } from "viem";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

const MULTI_TOKEN = "0xD1F610930d3D2c169efA834b865f37EC41418b4b";
const USDT = "0xc339141906318e29c6d11f0f352097cfe967e7ee";
const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

async function main() {
  const multiToken = new ethers.Contract(MULTI_TOKEN, erc20Abi, signer);
  const usdt = new ethers.Contract(USDT, erc20Abi, signer);
  const router = new ethers.Contract(UNISWAP_ROUTER, uniswapAbi, signer);

  const address = await signer.getAddress();

  // --- 1️⃣ Kiểm tra balance MTK ---
  const balanceMTK: bigint = await multiToken.balanceOf(address);
  const decimalsMTK: number = await multiToken.decimals();

  console.log(
    "Balance MTK trước swap:",
    ethers.formatUnits(balanceMTK, decimalsMTK)
  );

  if (balanceMTK === 0n) {
    console.error("Không có MTK để swap!");
    return;
  }

  // --- 2️⃣ Xác định số lượng swap ---
  const amountIn = balanceMTK / 10n; // swap 10% MTK
  const amountOutMin = 0n; // testnet, slippage bỏ qua

  // --- 3️⃣ Approve router ---
  const approveTx = await multiToken.approve(UNISWAP_ROUTER, amountIn);
  await approveTx.wait();

  // --- 4️⃣ Swap exact tokens ---
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 phút
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [MULTI_TOKEN, USDT],
    address,
    deadline
  );

  await tx.wait();

  // --- 5️⃣ Kiểm tra balance sau swap ---
  const balanceMTKAfter = await multiToken.balanceOf(address);
  const balanceUSDTAfter = await usdt.balanceOf(address);
  const decimalsUSDT = await usdt.decimals();

  console.log(
    "Balance MTK sau swap:",
    ethers.formatUnits(balanceMTKAfter, decimalsMTK)
  );
  console.log(
    "Balance USDT sau swap:",
    ethers.formatUnits(balanceUSDTAfter, decimalsUSDT)
  );
}

main().catch(console.error);
