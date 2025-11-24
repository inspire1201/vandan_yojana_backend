import express from "express";
import * as controllers from "../controller/hierarchy.controller.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.js";

const hierarchyRoute = express.Router();

// Roots
hierarchyRoute.get("/clusters", isAuthenticated,isAdmin,controllers.getClusters);
hierarchyRoute.get("/sambhags",isAuthenticated,isAdmin, controllers.getSambhags);

// Level 1
hierarchyRoute.get("/loksabha/:clusterId",isAuthenticated,isAdmin, controllers.getLokSabhasByCluster);
hierarchyRoute.get("/jila/:sambhagId",isAuthenticated,isAdmin, controllers.getJilasBySambhag);

// Level 2
hierarchyRoute.get("/vidhansabha/loksabha/:lokId",isAuthenticated,isAdmin, controllers.getVidhanSabhasByLokSabha);
hierarchyRoute.get("/vidhansabha/jila/:jilaId",isAuthenticated,isAdmin, controllers.getVidhanSabhasByDistrict);

// Level 3, 4, 5 (Deep Hierarchy)
hierarchyRoute.get("/mandal/:vidId",isAuthenticated,isAdmin, controllers.getMandalsByVid);
hierarchyRoute.get("/sakha/:vidId/:manId",isAuthenticated,isAdmin, controllers.getSakhasByMandal);
hierarchyRoute.get("/booth/:vidId/:sakId",isAuthenticated,isAdmin, controllers.getBoothsBySakha);
hierarchyRoute.get("/get-cluster-all-data",isAuthenticated,isAdmin, controllers.getAllClusterData);
hierarchyRoute.get("/get-hierarchy-data",isAuthenticated,isAdmin, controllers.getHierarchyData);
hierarchyRoute.get("/get-hierarchy-data-mutiple",isAuthenticated,isAdmin, controllers.getHierarchyDataMultiple);

export default hierarchyRoute;  