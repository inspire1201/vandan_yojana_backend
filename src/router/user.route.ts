import { Router } from "express";
import {
  getAllDistricts,
  getDistrictsByType,
//   getDistrictWithBlocks,  
  getDistrictMeta,
  getBlockById,
  
  getCombinedBlockReport,
  getDistrictCombinedReport,
  
  createDistrictMaps,
  getDistrictMapData,
  updateDistrictMap,
  updateVidhanSabhaMap,
  getAssemblyMapData,
  updateLokSabhaMap,
  getLokSabhaMapData,
  getAllBoothsData,
  getAllAssemblyData,
  getAllboothDataByAssembly,
  updateBooths,
  bulkUpdateBooths,
} from "../controller/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";

export const userRoute = Router();

userRoute.get("/", isAuthenticated,getAllDistricts);
userRoute.get("/type/:type", isAuthenticated,getDistrictsByType);
// userRoute.get("/:id", getDistrictWithBlocks); // optional
userRoute.get("/:id/meta",isAuthenticated, getDistrictMeta);   // NEW – light
userRoute.get("/block/:id", isAuthenticated,getBlockById);       // NEW – single block
userRoute.get("/:id/report", isAuthenticated,getDistrictCombinedReport); // NEW – aggregated


// routes/block.routes.ts
userRoute.post("/combined-by-name", getCombinedBlockReport);

userRoute.get("/get-districts",getAllDistricts);
userRoute.post("/update-district-map",updateDistrictMap);
userRoute.post("/create-district-map",createDistrictMaps);
userRoute.get("/get-district-map-data",getDistrictMapData);

// Vidhan Sabha Map
userRoute.post("/update-assembly-map",updateVidhanSabhaMap);
userRoute.get("/get-assembly-map-data",getAssemblyMapData);

// Lok Shabha
userRoute.post("/update-loksabha-map",updateLokSabhaMap);
userRoute.get("/get-loksabha-map-data",getLokSabhaMapData);



userRoute.get("/get-all-boths",getAllBoothsData);
userRoute.get("/get-all-assembly",getAllAssemblyData);
userRoute.get("/get-all-booth-by-assembly/:assemblyId",getAllboothDataByAssembly);
// update the booth data
// userRoute.put("/bulk-update-booths", updateBooths);
userRoute.put("/bulk-update-booths", bulkUpdateBooths);