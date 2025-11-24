import express from "express";
import * as controllers from "../controller/hierarchy.controller.js";

const hierarchyRoute = express.Router();

// Roots
hierarchyRoute.get("/clusters", controllers.getClusters);
hierarchyRoute.get("/sambhags", controllers.getSambhags);

// Level 1
hierarchyRoute.get("/loksabha/:clusterId", controllers.getLokSabhasByCluster);
hierarchyRoute.get("/jila/:sambhagId", controllers.getJilasBySambhag);

// Level 2
hierarchyRoute.get("/vidhansabha/loksabha/:lokId", controllers.getVidhanSabhasByLokSabha);
hierarchyRoute.get("/vidhansabha/jila/:jilaId", controllers.getVidhanSabhasByDistrict);

// Level 3, 4, 5 (Deep Hierarchy)
hierarchyRoute.get("/mandal/:vidId", controllers.getMandalsByVid);
hierarchyRoute.get("/sakha/:vidId/:manId", controllers.getSakhasByMandal);
hierarchyRoute.get("/booth/:vidId/:sakId", controllers.getBoothsBySakha);
hierarchyRoute.get("/get-cluster-all-data", controllers.getAllClusterData);
hierarchyRoute.get("/get-hierarchy-data", controllers.getHierarchyData);
hierarchyRoute.get("/get-hierarchy-data-mutiple", controllers.getHierarchyDataMultiple);

export default hierarchyRoute;