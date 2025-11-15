// // // import prisma from "../prisma";

// import prisma from "../prisma";

// // // // --- Helper Generators ---
// // // const names = [
// // //   "Ramesh", "Suresh", "Mahesh", "Deepak", "Pritam",
// // //   "Anita", "Kavita", "Nisha", "Sargam", "Pooja"
// // // ];

// // // const rand = (min:any, max:any) => Math.floor(Math.random() * (max - min + 1)) + min;

// // // const getRandomName = () => names[rand(0, names.length - 1)];

// // // const getRandomMobile = () =>
// // //   "9" + (100000000 + Math.floor(Math.random() * 900000000)).toString();

// // // const getRandomEnum = () => ["VALUE_0", "VALUE_1", "VALUE_2"][rand(0, 2)];

// // // const getRandomSlr = () =>
// // //   (Math.random() * 89 + 10).toFixed(2); // 10–99 range


// // // // ------------------------------------------------------------------
// // // // 🔥 Optimized Main Function
// // // // ------------------------------------------------------------------
// // // export const fillDummyBlaData = async () => {
// // //   try {
// // //     console.log("📌 Fetching rows...");

// // //     const rows = await prisma.cgbooth25_vandan.findMany({
// // //       select: { id: true, update_count: true }
// // //     });

// // //     const total = rows.length;
// // //     console.log("📌 Total rows:", total);

// // //     if (total === 0) {
// // //       console.log("⚠ No rows found. Done.");
// // //       return;
// // //     }

// // //     const count = Math.floor(total * 0.4);
// // //     console.log(`📌 Updating 30% → ${count} rows`);

// // //     // --- Efficient random selection (no full shuffle) ---
// // //     const selected = new Set();
// // //     while (selected.size < count) {
// // //       selected.add(rand(0, total - 1));
// // //     }

// // //     const tx = [];

// // //     for (const index of selected) {
// // //       const row = rows[index];

// // //       const dummy = {
// // //         isBla2: getRandomEnum(),
// // //         bla2_name: getRandomName(),
// // //         bla2_mobile_no: getRandomMobile(),
// // //         slr_per: getRandomSlr(),
// // //         update_date: new Date(),
// // //         update_count: (row.update_count || 0) + 1,
// // //       };

// // //       console.log(`📝 Updating ID ${row.id}`, dummy);

// // //       tx.push(
// // //         prisma.cgbooth25_vandan.update({
// // //           where: { id: row.id },
// // //           data: dummy,
// // //         })
// // //       );
// // //     }

// // //     console.log("📌 Running transaction...");
// // //     await prisma.$transaction(tx);

// // //     console.log("✅ Done! Updated:", tx.length);

// // //   } catch (err) {
// // //     console.error("❌ ERROR:", err);
// // //   }
// // // };




// // ----------------------- Helper Utilities -----------------------
// const names = [
//   "prakhar", "Manish", "Mahesh", "vishal", "Pritam",
//   "Anita", "Kavita", "Nisha", "Sargam", "Pooja"
// ];

// const rand = (min: number, max: number) =>
//   Math.floor(Math.random() * (max - min + 1)) + min;

// const getRandomName = () => names[rand(0, names.length - 1)];

// const getRandomMobile = () =>
//   "9" + (100000000 + Math.floor(Math.random() * 900000000)).toString();

// const enums = ["VALUE_0", "VALUE_1", "VALUE_2"];
// const getRandomEnum = () => enums[rand(0, enums.length - 1)];

// const getRandomSlr = () => (Math.random() * 89 + 10).toFixed(2);

// // Batch size → safe for AWS Free Tier also
// const BATCH_SIZE = 100;

// // ----------------------- Main Function --------------------------
// export const fillDummyBlaData = async (dryRun = false) => {
//   try {
//     console.log("📌 Fetching rows...");

//     const rows = await prisma.cgbooth25_vandan.findMany({
//       select: { id: true, update_count: true },
//     });

//     const total = rows.length;
//     console.log("📌 Total rows:", total);

//     if (total === 0) {
//       console.log("⚠ No rows found. Done.");
//       return;
//     }

//     const updateCount = Math.floor(total * 0.4); // 30%
//     console.log(`📌 Updating 30%  → ${updateCount} rows\n`);

//     // --------- Select Random IDs Without Duplicates ----------
//     const selectedIndexes = new Set<number>();
//     while (selectedIndexes.size < updateCount) {
//       selectedIndexes.add(rand(0, total - 1));
//     }

//     const selectedRows = [...selectedIndexes].map((i) => rows[i]);

//     let batch: any[] = [];
//     let updated = 0;

//     for (const row of selectedRows) {
//       const dummyData = {
//         isBla2: getRandomEnum(),
//         bla2_name: getRandomName(),
//         bla2_mobile_no: getRandomMobile(),
//         slr_per: getRandomSlr(),
//         update_date: new Date(),
//         update_count: (row.update_count || 0) + 1,
//       };

//       batch.push(
//         prisma.cgbooth25_vandan.update({
//           where: { id: row.id },
//           data: dummyData,
//         })
//       );

//       // ---------- Execute in Batches ----------
//       if (batch.length === BATCH_SIZE) {
//         if (!dryRun) {
//           await prisma.$transaction(batch);
//         }
//         updated += batch.length;
//         console.log(`✅ Batch updated → Total: ${updated}`);
//         batch = [];
//       }
//     }

//     // Final remaining batch
//     if (batch.length > 0) {
//       if (!dryRun) {
//         await prisma.$transaction(batch);
//       }
//       updated += batch.length;
//       console.log(`✅ Final batch → Total: ${updated}`);
//     }

//     console.log("\n🎉 DONE!");
//     console.log(`🔢 Total updated: ${updated}`);

//   } catch (err) {
//     console.error("❌ ERROR:", err);
//   }
// };


// // all bla

// export default async function resetBoothFields() {
//   try {
//     const result = await prisma.cgbooth25_vandan.updateMany({
//       data: {
//         isBla2: null,
//         bla2_name: null,
//         bla2_mobile_no: null,
//         slr_per: null,
//         update_date: null,
//         update_count: null,
//       },
//     });

//     console.log("Updated rows:", result.count);
//   } catch (err) {
//     console.error("Error:", err);
//   } finally {
//     await prisma.$disconnect();
//   }
// }
