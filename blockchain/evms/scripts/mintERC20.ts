import { ethers } from "ethers";
import * as dotenv from "dotenv";
import MultiTokenJson from "../artifacts/contracts/MultiToken.sol/MultiToken.json";
import { uniswapAbi } from "../abi/uniswapAbi.js";
import { erc20Abi } from "viem";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

const MULTI_TOKEN = "0xD1F610930d3D2c169efA834b865f37EC41418b4b";
const USDT = "0xbDeaD2A70Fe794D2f97b37EFDE497e68974a296d"; // Sepolia USDT
const UNISWAP_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

async function main() {
  const multiToken = new ethers.Contract(
    MULTI_TOKEN,
    MultiTokenJson.abi,
    signer
  );
  const usdt = new ethers.Contract(USDT, erc20Abi, signer);
  const router = new ethers.Contract(UNISWAP_ROUTER, uniswapAbi, signer);

  const address = await signer.getAddress();

  // --- 1️⃣ Kiểm tra balance ---
  const balanceMTK: bigint = await multiToken.balanceOf(address);
  const balanceUSDT: bigint = await usdt.balanceOf(address);

  const decimalsMTK: number = await multiToken.decimals();
  const decimalsUSDT: number = await usdt.decimals();

  console.log("Balance MTK:", ethers.formatUnits(balanceMTK, decimalsMTK));
  console.log("Balance USDT:", ethers.formatUnits(balanceUSDT, decimalsUSDT));
  console.log("Decimals MTK:", decimalsMTK);
  console.log("Decimals USDT:", decimalsUSDT);

  // --- 2️⃣ Check đủ balance ---
  const oneMTK = 1n * 10n ** BigInt(decimalsMTK);
  const oneUSDT = 1n * 10n ** BigInt(decimalsUSDT);

  if (balanceMTK < oneMTK || balanceUSDT < oneUSDT) {
    console.error("Balance không đủ để add liquidity!");
    return;
  }

  // --- 3️⃣ Xác định số lượng add liquidity (10% balance) ---
  const amountMTK = balanceMTK / 10n;
  const amountUSDT = balanceUSDT / 10n;

  console.log("Adding liquidity:");
  console.log("amountMTK:", ethers.formatUnits(amountMTK, decimalsMTK));
  console.log("amountUSDT:", ethers.formatUnits(amountUSDT, decimalsUSDT));

  // --- 4️⃣ Approve router ---
  console.log("Approving tokens...");
  const approveMTK = await multiToken.approve(
    UNISWAP_ROUTER,
    ethers.MaxUint256
  );
  await approveMTK.wait();
  const approveUSDT = await usdt.approve(UNISWAP_ROUTER, ethers.MaxUint256);
  await approveUSDT.wait();
  console.log("✅ Tokens approved");

  // --- 5️⃣ Add liquidity ---
  const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 phút
  const minMTK = (amountMTK * 90n) / 100n; // slippage 10%
  const minUSDT = (amountUSDT * 90n) / 100n;

  try {
    const tx = await router.addLiquidity(
      MULTI_TOKEN,
      USDT,
      amountMTK,
      amountUSDT,
      minMTK,
      minUSDT,
      address,
      deadline
    );

    await tx.wait();
    console.log("✅ Liquidity MultiToken ↔ USDT added!");
  } catch (err: any) {
    console.error("❌ Add liquidity failed:", err.reason || err);
  }
}

main().catch(console.error);
