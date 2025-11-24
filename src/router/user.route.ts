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
  updateSingleBooth,
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
userRoute.post("/combined-by-name",isAuthenticated, getCombinedBlockReport);

userRoute.get("/get-districts",isAuthenticated,getAllDistricts);
userRoute.post("/update-district-map",isAuthenticated,updateDistrictMap);
userRoute.post("/create-district-map",isAuthenticated,createDistrictMaps);
userRoute.get("/get-district-map-data",isAuthenticated,getDistrictMapData);

// Vidhan Sabha Map
userRoute.post("/update-assembly-map",isAuthenticated,updateVidhanSabhaMap);
userRoute.get("/get-assembly-map-data",isAuthenticated,getAssemblyMapData);

// Lok Shabha
userRoute.post("/update-loksabha-map",isAuthenticated,updateLokSabhaMap);
userRoute.get("/get-loksabha-map-data",isAuthenticated,getLokSabhaMapData);



userRoute.get("/get-all-boths",isAuthenticated,getAllBoothsData);
userRoute.get("/get-all-assembly",isAuthenticated,getAllAssemblyData);
userRoute.get("/get-all-booth-by-assembly/:assemblyId",isAuthenticated,getAllboothDataByAssembly);
// update the booth data
userRoute.put("/update-booth/:boothId", isAuthenticated,updateSingleBooth);
userRoute.put("/bulk-update-booths", isAuthenticated,bulkUpdateBooths);