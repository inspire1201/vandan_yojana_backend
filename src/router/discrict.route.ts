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
} from "../controller/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";

export const discrictRoute = Router();

discrictRoute.get("/", isAuthenticated,getAllDistricts);
discrictRoute.get("/type/:type", isAuthenticated,getDistrictsByType);
// discrictRoute.get("/:id", getDistrictWithBlocks); // optional
discrictRoute.get("/:id/meta",isAuthenticated, getDistrictMeta);   // NEW – light
discrictRoute.get("/block/:id", isAuthenticated,getBlockById);       // NEW – single block
discrictRoute.get("/:id/report", isAuthenticated,getDistrictCombinedReport); // NEW – aggregated


// routes/block.routes.ts
discrictRoute.post("/combined-by-name", getCombinedBlockReport);

discrictRoute.get("/get-districts",getAllDistricts);
discrictRoute.post("/update-district-map",updateDistrictMap);
discrictRoute.post("/create-district-map",createDistrictMaps);
discrictRoute.get("/get-district-map-data",getDistrictMapData);

// Vidhan Sabha Map
discrictRoute.post("/update-assembly-map",updateVidhanSabhaMap);
discrictRoute.get("/get-assembly-map-data",getAssemblyMapData);

// Lok Shabha
discrictRoute.post("/update-loksabha-map",updateLokSabhaMap);
discrictRoute.get("/get-loksabha-map-data",getLokSabhaMapData);
