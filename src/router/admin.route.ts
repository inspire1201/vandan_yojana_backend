import { Router } from "express";
import { getAllMandalsInJila, getAllMandalsInLokSabha, getAllMandalsInSambhag, getAllMandalsInVidhanSabha, getAllMandleInCluster, getAllSakhasInCluster, getAllSakhasInJila, getAllSakhasInLokSabha, getAllSakhasInMandal, getAllSakhasInSambhag, getAllSakhasInVidhanSabha, getBoothInCluster, getBoothInJila, getBoothInLokSabha, getBoothInMandal, getBoothInSakha, getBoothInSambhag, getBoothInVidhanSabha, getCluData, getJilaInSambhag, getLokSabhaInCluster, getSmData, getVdData, getVidhanSabhaInCluster, getVidhanSabhaInJila, getVidhanSabhaInLokSabha, getVidhanSabhaInSambhag } from "../controller/admin.controller.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.js";


export const adminRoute = Router();

 adminRoute.get('/',(req:any,res:any)=>{
    res.send("hello from admin route")
 })
adminRoute.get("/smdata",isAuthenticated,isAdmin,getSmData)
adminRoute.get("/cludata",isAuthenticated,isAdmin,getCluData)
adminRoute.get("/vddata",isAuthenticated,isAdmin,getVdData)

adminRoute.get("/all-mandal-cluster",isAuthenticated,isAdmin,getAllMandleInCluster)
adminRoute.get("/all-mandal-sambhag",isAuthenticated,isAdmin,getAllMandalsInSambhag)
adminRoute.get("/all-mandal-loc",isAuthenticated,isAdmin,getAllMandalsInLokSabha)
adminRoute.get("/all-mandal-jila",isAuthenticated,isAdmin,getAllMandalsInJila)
adminRoute.get("/all-mandal-vidhan",isAuthenticated,isAdmin,getAllMandalsInVidhanSabha)


// all shakti 
adminRoute.get("/all-sakti-cluster",isAuthenticated,isAdmin,getAllSakhasInCluster)
adminRoute.get("/all-sakti-sambhag",isAuthenticated,isAdmin,getAllSakhasInSambhag)
adminRoute.get("/all-sakti-mandale",isAuthenticated,isAdmin,getAllSakhasInMandal)
adminRoute.get("/all-sakti-jila",isAuthenticated,isAdmin,getAllSakhasInJila)
adminRoute.get("/all-sakti-loc",isAuthenticated,isAdmin,getAllSakhasInLokSabha)
adminRoute.get("/all-sakti-vidhan",isAuthenticated,isAdmin,getAllSakhasInVidhanSabha)



// all booth 
adminRoute.get("/all-booth-cluster",isAuthenticated,isAdmin,getBoothInCluster)
adminRoute.get("/all-booth-sambhag",isAuthenticated,isAdmin,getBoothInSambhag)
adminRoute.get("/all-booth-loc",isAuthenticated,isAdmin,getBoothInLokSabha)
adminRoute.get("/all-booth-vidhan",isAuthenticated,isAdmin,getBoothInVidhanSabha)
adminRoute.get("/all-booth-jila",isAuthenticated,isAdmin,getBoothInJila)
adminRoute.get("/all-booth-mandale",isAuthenticated,isAdmin,getBoothInMandal)
adminRoute.get("/all-booth-sakha",isAuthenticated,isAdmin,getBoothInSakha)

// vidhan sabha and lok sabha in cluster
adminRoute.get("/all-vidhan-cluster",isAuthenticated,isAdmin,getVidhanSabhaInCluster)
adminRoute.get("/all-loc-cluster",isAuthenticated,isAdmin,getLokSabhaInCluster)

// vidhan sabha in lok sabha
adminRoute.get("/all-vidhan-loc",isAuthenticated,isAdmin,getVidhanSabhaInLokSabha)

// jila and vidhan sabha in sambhag
adminRoute.get("/all-jila-sambhag",isAuthenticated,isAdmin,getJilaInSambhag)
adminRoute.get("/all-vidhan-sambhag",isAuthenticated,isAdmin,getVidhanSabhaInSambhag)

// vidhan sabha in jila
adminRoute.get("/all-vidhan-jila",isAuthenticated,isAdmin,getVidhanSabhaInJila)



