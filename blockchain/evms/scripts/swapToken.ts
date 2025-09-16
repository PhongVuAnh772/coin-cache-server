import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { uniswapAbi } from "../abi/uniswapAbi.js";
import { erc20Abi } from "viem";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

const MULTI_TOKEN = "0xD1F610930d3D2c169efA834b865f37EC41418b4b";
const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

// Pair ABI
const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

async function main() {
  const multiToken = new ethers.Contract(MULTI_TOKEN, erc20Abi, signer);
  const usdt = new ethers.Contract(USDT, erc20Abi, signer);
  const router = new ethers.Contract(UNISWAP_ROUTER, uniswapAbi, signer);

  const address = await signer.getAddress();

  // --- 1️⃣ Check balances ---
  const balanceMTK: bigint = await multiToken.balanceOf(address);
  const balanceUSDT: bigint = await usdt.balanceOf(address);
  const decimalsMTK: number = await multiToken.decimals();
  const decimalsUSDT: number = await usdt.decimals();

  console.log(
    "Balance MTK trước swap:",
    ethers.formatUnits(balanceMTK, decimalsMTK)
  );
  console.log(
    "Balance USDT trước swap:",
    ethers.formatUnits(balanceUSDT, decimalsUSDT)
  );

  if (balanceMTK === 0n) {
    console.error("Không có MTK để swap!");
    return;
  }

  // --- 2️⃣ Check liquidity pool ---
  const factoryAddress: string = await router.factory();
  const factory = new ethers.Contract(
    factoryAddress,
    ["function getPair(address,address) view returns (address)"],
    provider
  );
  let pairAddress = await factory.getPair(MULTI_TOKEN, USDT);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("Pool chưa tồn tại, add liquidity...");

    const amountMTK = balanceMTK / 2n; // Add 50% MTK
    const amountUSDT = balanceUSDT / 2n; // Add 50% USDT

    // Approve token cho router
    const approveTx = await multiToken.approve(UNISWAP_ROUTER, amountMTK);
    await approveTx.wait();
    await usdt.approve(UNISWAP_ROUTER, amountUSDT);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    const tx = await router.addLiquidity(
      MULTI_TOKEN,
      USDT,
      amountMTK,
      amountUSDT,
      0,
      0,
      address,
      deadline
    );
    await tx.wait();
    console.log("Liquidity đã được add.");

    // Lấy lại pair address
    pairAddress = await factory.getPair(MULTI_TOKEN, USDT);
  }

  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const [reserve0, reserve1] = await pair.getReserves();
  console.log("Reserves hiện tại:", reserve0.toString(), reserve1.toString());

  // --- 3️⃣ Approve router cho swap ---
  const amountIn = balanceMTK / 10n; // swap 10%
  await multiToken.approve(UNISWAP_ROUTER, amountIn);

  // --- 4️⃣ Swap MTK → USDT ---
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    0, // min amount out
    [MULTI_TOKEN, USDT],
    address,
    deadline
  );
  await tx.wait();
  console.log(
    `Swap ${ethers.formatUnits(amountIn, decimalsMTK)} MTK → USDT hoàn tất.`
  );

  // --- 5️⃣ Check balances after swap ---
  const balanceMTKAfter = await multiToken.balanceOf(address);
  const balanceUSDTAfter = await usdt.balanceOf(address);

  console.log(
    "Balance MTK sau swap:",
    ethers.formatUnits(balanceMTKAfter, decimalsMTK)
  );
  console.log(
    "Balance USDT sau swap:",
    ethers.formatUnits(balanceUSDTAfter, decimalsUSDT)
  );

  // --- 6️⃣ Tính giá MTK/USDT ---
  const priceMTK =
    parseFloat(ethers.formatUnits(reserve1, decimalsUSDT)) /
    parseFloat(ethers.formatUnits(reserve0, decimalsMTK));
  console.log("Giá MTK/USDT hiện tại:", priceMTK);
}

main().catch(console.error);
