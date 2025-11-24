import prisma from "../prisma.js";
import { redisCacheService } from "../redis/cache.service.js";

 export const getSmData = async (req:any, res:any) => {
    try {
        const data = await prisma.smdata.findMany(); // Fetch all
        res.json({ data });
    } catch (err) {
        console.error('Error fetching smdata:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


 export const getCluData = async (req:any, res:any) => {
    try {


      
        const data = await prisma.cludata.findMany(); // Fetch all
        res.json({ data });
    } catch (err) {
        console.error('Error fetching cludata:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


 export const getVdData = async (req:any, res:any) => {
    try {
        const data = await prisma.vddata.findMany(); // Fetch all
        res.json({ data });
    } catch (err) {
        console.error('Error fetching vddata:', err);
        res.status(500).json({ error: 'Server error' });
    }
};




 export const getAllMandleInCluster = async (req:any, res:any) => {
  try {
    // 1. Get clusters
    const clusters = await prisma.$queryRaw`
      SELECT CLUS_ID, ANY_VALUE(CLUS_NM) AS CLUS_NM
      FROM cludata
      WHERE CLUS_ID IS NOT NULL
      GROUP BY CLUS_ID
      ORDER BY CLUS_NM;
    `;

    // 2. Get unique mandals per cluster
    const mandalsData = await prisma.$queryRaw`
      SELECT DISTINCT 
        CONCAT(v.VID_ID,'-',v.MAN_ID) AS uniqueId,
        c.CLUS_ID AS clusterId,
        v.VID_ID,
        v.MAN_ID,
        v.MAN_NM
      FROM vddata v
      JOIN cludata c ON v.VID_ID = c.VID_ID
      WHERE v.MAN_ID IS NOT NULL;
    ` as any[];

    // 3. Group using uniqueId
    const clusterMap: any = {};

    mandalsData.forEach((row: any) => {
      if (!clusterMap[row.clusterId]) clusterMap[row.clusterId] = new Map();

      // use unique key
      clusterMap[row.clusterId].set(row.uniqueId, {
        VID_ID: row.VID_ID,
        MAN_ID: row.MAN_ID,
        MAN_NM: row.MAN_NM
      });
    });

    // 4. Final structure
    const result = (clusters as any[]).map((c: any) => {
      const mandalMap = clusterMap[c.CLUS_ID] || new Map();
      const mandals = Array.from(mandalMap.values());

      return {
        CLUS_ID: c.CLUS_ID,
        CLUS_NM: c.CLUS_NM,
        mandalCount: mandals.length,
        mandals
      };
    });

    // Transform to match frontend expectations
    const countData = result.map((item: any) => ({
      id: item.CLUS_ID,
      name: item.CLUS_NM,
      count: item.mandalCount,
      level: 'cluster',
      column: 'mandal'
    }));

    return res.json({
      totalLevelCount: (clusters as any[]).length,
      totalColumnCount: mandalsData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



export const getAllMandalsInSambhag = async (req:any, res:any) => {
  try {
    const sambhags = await prisma.$queryRaw`
      SELECT SAM_ID, ANY_VALUE(SAM_NM) AS SAM_NM
      FROM smdata
      WHERE SAM_ID IS NOT NULL
      GROUP BY SAM_ID
      ORDER BY SAM_NM;
    ` as any[];

    const mandalsData = await prisma.$queryRaw`
      SELECT DISTINCT CONCAT(v.VID_ID,'-',v.MAN_ID) AS uniqueId,
                      s.SAM_ID AS sambhagId,
                      v.MAN_ID, v.MAN_NM
      FROM vddata v
      JOIN smdata s ON v.VID_ID = s.VID_ID
      WHERE v.MAN_ID IS NOT NULL
      ORDER BY s.SAM_ID, v.MAN_NM;
    ` as any[];

    const sambhagMap: any = {};
    mandalsData.forEach((row: any) => {
      if (!sambhagMap[row.sambhagId]) sambhagMap[row.sambhagId] = [];
      sambhagMap[row.sambhagId].push({ MAN_ID: row.MAN_ID, MAN_NM: row.MAN_NM });
    });

    const result = sambhags.map((s: any) => {
      const mandals = sambhagMap[s.SAM_ID] || [];
      return { SAM_ID: s.SAM_ID, SAM_NM: s.SAM_NM, mandalCount: mandals.length, mandals };
    });

    // Transform to match frontend expectations
    const countData = result.map((item: any) => ({
      id: item.SAM_ID,
      name: item.SAM_NM,
      count: item.mandalCount,
      level: 'sambhag',
      column: 'mandal'
    }));

    return res.json({
      totalLevelCount: sambhags.length,
      totalColumnCount: mandalsData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllMandalsInVidhanSabha = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch all Vidhan Sabha (unique VID_ID)
    const vidhans = await prisma.$queryRaw`
      SELECT VID_ID, ANY_VALUE(VID_NM) AS VID_NM
      FROM cludata
      WHERE VID_ID IS NOT NULL
      GROUP BY VID_ID
      ORDER BY VID_NM;
    ` as any[];

    // 2️⃣ Fetch unique mandals per Vidhan Sabha
    const mandalsData = await prisma.$queryRaw`
      SELECT 
        v.VID_ID AS vidhanId,
        v.MAN_ID AS mandalId,
        ANY_VALUE(v.MAN_NM) AS mandalName
      FROM vddata v
      WHERE v.MAN_ID IS NOT NULL
      GROUP BY v.VID_ID, v.MAN_ID
      ORDER BY v.VID_ID, ANY_VALUE(v.MAN_NM);
    ` as any[];

    // 3️⃣ Group mandals under each vidhan
    const vidMap: any = {};
    mandalsData.forEach((row: any) => {
      if (!vidMap[row.vidhanId]) vidMap[row.vidhanId] = [];
      vidMap[row.vidhanId].push({
        MAN_ID: row.mandalId,
        MAN_NM: row.mandalName
      });
    });

    // 4️⃣ Build result
    const result = vidhans.map((v: any) => {
      const mandals = vidMap[v.VID_ID] || [];
      return {
        VID_ID: v.VID_ID,
        VID_NM: v.VID_NM,
        mandalCount: mandals.length,
        mandals
      };
    });

    // Transform to match frontend expectations
    const countData = result.map((item: any) => ({
      id: item.VID_ID,
      name: item.VID_NM,
      count: item.mandalCount,
      level: 'vid',
      column: 'mandal'
    }));

    return res.json({
      totalLevelCount: vidhans.length,
      totalColumnCount: mandalsData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};




export const getAllMandalsInLokSabha = async (req:any, res:any) => {
  try {
    const loks = await prisma.$queryRaw`
      SELECT LOK_ID, ANY_VALUE(LOK_NM) AS LOK_NM
      FROM cludata
      WHERE LOK_ID IS NOT NULL
      GROUP BY LOK_ID
      ORDER BY LOK_NM;
    ` as any[];

    const mandalsData = await prisma.$queryRaw`
      SELECT DISTINCT CONCAT(v.VID_ID,'-',v.MAN_ID) AS uniqueId,
                      c.LOK_ID AS lokId,
                      v.MAN_ID AS mandalId,
                      v.MAN_NM AS mandalName
      FROM vddata v
      JOIN cludata c ON v.VID_ID = c.VID_ID
      WHERE v.MAN_ID IS NOT NULL
      ORDER BY c.LOK_ID, v.MAN_NM;
    ` as any[];

    const lokMap: any = {};
    mandalsData.forEach((row: any) => {
      if(!lokMap[row.lokId]) lokMap[row.lokId] = [];
      lokMap[row.lokId].push({ MAN_ID: row.mandalId, MAN_NM: row.mandalName });
    });

    const result = loks.map(l=>{
      const mandals = lokMap[l.LOK_ID] || [];
      return { LOK_ID: l.LOK_ID, LOK_NM: l.LOK_NM, mandalCount: mandals.length, mandals };
    });

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.LOK_ID,
      name: item.LOK_NM,
      count: item.mandalCount,
      level: 'lok',
      column: 'mandal'
    }));

    return res.json({
      totalLevelCount: loks.length,
      totalColumnCount: mandalsData.length,
      countData: countData,
      detailedData: result
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllMandalsInJila = async (req: any, res: any) => {
  try {
    const jilas = await prisma.$queryRaw`
      SELECT JILA_ID, ANY_VALUE(JILA_NM) AS JILA_NM
      FROM smdata
      WHERE JILA_ID IS NOT NULL
      GROUP BY JILA_ID
      ORDER BY JILA_NM;
    ` as any[];

    const mandalsData = await prisma.$queryRaw`
      SELECT DISTINCT CONCAT(v.VID_ID,'-',v.MAN_ID) AS uniqueId,
                      s.JILA_ID AS jilaId,
                      v.MAN_ID AS mandalId,
                      v.MAN_NM AS mandalName
      FROM vddata v
      JOIN smdata s ON v.VID_ID = s.VID_ID
      WHERE v.MAN_ID IS NOT NULL
      ORDER BY s.JILA_ID, v.MAN_NM;
    ` as any[];

    const jilaMap: any = {};
    mandalsData.forEach((row: any) => {
      if(!jilaMap[row.jilaId]) jilaMap[row.jilaId] = [];
      jilaMap[row.jilaId].push({ MAN_ID: row.mandalId, MAN_NM: row.mandalName });
    });

    const result = jilas.map(j=>{
      const mandals = jilaMap[j.JILA_ID] || [];
      return { JILA_ID: j.JILA_ID, JILA_NM: j.JILA_NM, mandalCount: mandals.length, mandals };
    });

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.JILA_ID,
      name: item.JILA_NM,
      count: item.mandalCount,
      level: 'jila',
      column: 'mandal'
    }));

    return res.json({
      totalLevelCount: jilas.length,
      totalColumnCount: mandalsData.length,
      countData: countData,
      detailedData: result
    });

  } catch(err){
    console.error(err);
    return res.status(500).json({ error:"Internal Server Error" });
  }
};




// Get all Shakas in the cluster

export const getAllSakhasInCluster = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch clusters
    const clusters = await prisma.$queryRaw`
      SELECT CLUS_ID, ANY_VALUE(CLUS_NM) AS CLUS_NM
      FROM cludata
      WHERE CLUS_ID IS NOT NULL
      GROUP BY CLUS_ID
      ORDER BY CLUS_NM;
    ` as any[];

    // 2️⃣ Fetch all Sakhas per cluster (unique per VID_ID + SAK_ID)
    const sakhasData = await prisma.$queryRaw`
      SELECT c.CLUS_ID AS clusterId,
             v.SAK_ID,
             v.VID_ID,
             ANY_VALUE(v.SAK_NM) AS SAK_NM
      FROM vddata v
      JOIN cludata c ON v.VID_ID = c.VID_ID
      WHERE v.SAK_ID IS NOT NULL
      GROUP BY c.CLUS_ID, v.VID_ID, v.SAK_ID
      ORDER BY c.CLUS_ID, ANY_VALUE(v.SAK_NM);
    ` as any[];

    // 3️⃣ Map sakhas to clusters
    const clusterMap: any = {};
    sakhasData.forEach((row: any) => {
      if (!clusterMap[row.clusterId]) clusterMap[row.clusterId] = [];
      clusterMap[row.clusterId].push({ VID_ID: row.VID_ID, SAK_ID: row.SAK_ID, SAK_NM: row.SAK_NM });
    });

    // 4️⃣ Prepare result
    const result = clusters.map((c: any) => {
      const sakhas = clusterMap[c.CLUS_ID] || [];
      return { CLUS_ID: c.CLUS_ID, CLUS_NM: c.CLUS_NM, sakhaCount: sakhas.length, sakhas };
    });

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.CLUS_ID,
      name: item.CLUS_NM,
      count: item.sakhaCount,
      level: 'cluster',
      column: 'sakha'
    }));

    return res.json({
      totalLevelCount: clusters.length,
      totalColumnCount: sakhasData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllSakhasInSambhag = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch all Sambhags
    const sambhags = await prisma.$queryRaw`
      SELECT SAM_ID, ANY_VALUE(SAM_NM) AS SAM_NM
      FROM smdata
      WHERE SAM_ID IS NOT NULL
      GROUP BY SAM_ID
      ORDER BY SAM_NM;
    ` as any[];

    // 2️⃣ Fetch all Sakhas per Sambhag (unique per VID_ID + SAK_ID)
    const sakhasData = await prisma.$queryRaw`
      SELECT s.SAM_ID AS sambhagId,
             v.VID_ID,
             v.SAK_ID AS sakhaId,
             ANY_VALUE(v.SAK_NM) AS sakhaName
      FROM vddata v
      JOIN smdata s ON v.VID_ID = s.VID_ID
      WHERE v.SAK_ID IS NOT NULL
      GROUP BY s.SAM_ID, v.VID_ID, v.SAK_ID
      ORDER BY s.SAM_ID, ANY_VALUE(v.SAK_NM);
    ` as any[];

    // 3️⃣ Map Sakhas to Sambhags
    const sambhagMap: any = {};
    sakhasData.forEach((row: any) => {
      if (!sambhagMap[row.sambhagId]) sambhagMap[row.sambhagId] = [];
      sambhagMap[row.sambhagId].push({ VID_ID: row.VID_ID, SAK_ID: row.sakhaId, SAK_NM: row.sakhaName });
    });

    // 4️⃣ Prepare result
    const result = sambhags.map((s: any) => {
      const sakhas = sambhagMap[s.SAM_ID] || [];
      return { SAM_ID: s.SAM_ID, SAM_NM: s.SAM_NM, sakhaCount: sakhas.length, sakhas };
    });

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.SAM_ID,
      name: item.SAM_NM,
      count: item.sakhaCount,
      level: 'sambhag',
      column: 'sakha'
    }));

    return res.json({
      totalLevelCount: sambhags.length,
      totalColumnCount: sakhasData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllSakhasInLokSabha = async (req:any, res:any) => {
  try {
    // 1) Fetch all LokSabhas
    const loks = await prisma.$queryRaw`
      SELECT LOK_ID, ANY_VALUE(LOK_NM) AS LOK_NM
      FROM cludata
      WHERE LOK_ID IS NOT NULL
      GROUP BY LOK_ID
      ORDER BY LOK_NM;
    ` as any[];

    // 2) Fetch unique shakhas per LokSabha.
    // Uniqueness = (VID_ID + SAK_ID). We group by LOK_ID, VID_ID, SAK_ID and pick a canonical name.
    const sakhasData = await prisma.$queryRaw`
      SELECT 
        c.LOK_ID AS lokId,
        v.VID_ID AS vidId,
        v.SAK_ID AS sakhaId,
        MIN(v.SAK_NM) AS sakhaName
      FROM vddata v
      JOIN cludata c ON v.VID_ID = c.VID_ID
      WHERE v.SAK_ID IS NOT NULL
        AND v.SAK_NM IS NOT NULL
        AND v.SAK_NM != ''
      GROUP BY c.LOK_ID, v.VID_ID, v.SAK_ID
      ORDER BY c.LOK_ID, v.VID_ID, v.SAK_ID;
    ` as any[];

    // 3) Map shakhas to lok
    const lokMap: any = {};
    sakhasData.forEach((row: any) => {
      if (!lokMap[row.lokId]) lokMap[row.lokId] = [];
      lokMap[row.lokId].push({
        VID_ID: row.vidId,
        SAK_ID: row.sakhaId,
        SAK_NM: row.sakhaName
      });
    });

    // 4) Build result
    const result = loks.map((l: any) => ({
      LOK_ID: l.LOK_ID,
      LOK_NM: l.LOK_NM,
      sakhaCount: lokMap[l.LOK_ID]?.length || 0,
      sakhas: lokMap[l.LOK_ID] || []
    }));

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.LOK_ID,
      name: item.LOK_NM,
      count: item.sakhaCount,
      level: 'lok',
      column: 'sakha'
    }));

    return res.json({
      totalLevelCount: loks.length,
      totalColumnCount: sakhasData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err:any) {
    console.error("getAllSakhasInLokSabha error:", err);
    return res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
};



export const getAllSakhasInVidhanSabha = async (req:any, res:any) => {
  try {
    const vidhans = await prisma.$queryRaw`
      SELECT VID_ID, ANY_VALUE(VID_NM) AS VID_NM
      FROM cludata
      WHERE VID_ID IS NOT NULL
      GROUP BY VID_ID
      ORDER BY VID_NM;
    `as any[];;

    const sakhasData = await prisma.$queryRaw`
      SELECT 
        v.VID_ID AS vidhanId,
        v.SAK_ID AS sakhaId,
        ANY_VALUE(v.SAK_NM) AS sakhaName
      FROM vddata v
      WHERE v.SAK_ID IS NOT NULL
      GROUP BY v.VID_ID, v.SAK_ID
      ORDER BY v.VID_ID, ANY_VALUE(v.SAK_NM);
    `as any[];;

    const map:any = {};
    sakhasData.forEach(row => {
      if (!map[row.vidhanId]) map[row.vidhanId] = [];
      map[row.vidhanId].push({ SAK_ID: row.sakhaId, SAK_NM: row.sakhaName });
    });

    const result = vidhans.map(v => ({
      VID_ID: v.VID_ID,
      VID_NM: v.VID_NM,
      sakhaCount: map[v.VID_ID]?.length || 0,
      sakhas: map[v.VID_ID] || []
    }));

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.VID_ID,
      name: item.VID_NM,
      count: item.sakhaCount,
      level: 'vid',
      column: 'sakha'
    }));

    res.json({
      totalLevelCount: vidhans.length,
      totalColumnCount: sakhasData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllSakhasInJila = async (req:any, res:any) => {
  try {

    // 1) Get all Jilas
    const jilas = await prisma.$queryRaw`
      SELECT 
        JILA_ID,
        ANY_VALUE(JILA_NM) AS JILA_NM
      FROM smdata
      WHERE JILA_ID IS NOT NULL
      GROUP BY JILA_ID
      ORDER BY JILA_NM;
    `as any[];;

    // 2) Get all UNIQUE shakhas based on (VID_ID, SAK_ID)
    const shakhas = await prisma.$queryRaw`
      SELECT
        s.JILA_ID AS jilaId,
        v.VID_ID AS vidId,
        v.SAK_ID AS sakhaId,

        -- FIX DUPLICATE SHAHA NAME ISSUE
        MIN(v.SAK_NM) AS sakhaName

      FROM smdata s
      JOIN vddata v ON s.VID_ID = v.VID_ID

      WHERE v.SAK_ID IS NOT NULL
        AND v.SAK_NM IS NOT NULL
        AND v.SAK_NM != ''

      GROUP BY 
        s.JILA_ID,
        v.VID_ID,
        v.SAK_ID
        
      ORDER BY s.JILA_ID, v.VID_ID, v.SAK_ID;
    `as any[];;

    // 3) Group shakhas by Jila
    const map:any = {};
    shakhas.forEach(row => {
      if (!map[row.jilaId]) map[row.jilaId] = [];
      map[row.jilaId].push({
        VID_ID: row.vidId,
        SAK_ID: row.sakhaId,
        SAK_NM: row.sakhaName
      });
    });

    // 4) Build final result
    const result = jilas.map(j => ({
      JILA_ID: j.JILA_ID,
      JILA_NM: j.JILA_NM,
      shakhaCount: map[j.JILA_ID]?.length || 0,
      shakhas: map[j.JILA_ID] || []
    }));

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.JILA_ID,
      name: item.JILA_NM,
      count: item.shakhaCount,
      level: 'jila',
      column: 'sakha'
    }));

    // 5) Send response
    res.json({
      totalLevelCount: jilas.length,
      totalColumnCount: shakhas.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export const getAllSakhasInMandal = async (req:any, res:any) => {
  try {
    // 1. Unique mandals per VID
    const mandals = await prisma.$queryRaw`
      SELECT
        VID_ID,
        MAN_ID,
        MIN(MAN_NM) AS MAN_NM
      FROM vddata
      WHERE MAN_ID IS NOT NULL
      GROUP BY VID_ID, MAN_ID
      ORDER BY VID_ID, MAN_ID;
    `as any[];;

    // 2. Unique shakhas per mandal+VID
    const shakhasData = await prisma.$queryRaw`
      SELECT
        VID_ID,
        MAN_ID AS mandalId,
        SAK_ID AS sakhaId,
        MIN(SAK_NM) AS sakhaName
      FROM vddata
      WHERE MAN_ID IS NOT NULL AND SAK_NM IS NOT NULL AND SAK_NM != ''
      GROUP BY VID_ID, MAN_ID, SAK_ID
      ORDER BY VID_ID, MAN_ID, SAK_ID;
    `as any[];

    // 3. Map shakhas
    const map:any = {};
    shakhasData.forEach(row => {
      const key = `${row.VID_ID}_${row.mandalId}`; // unique key per VID+MANDAL
      if (!map[key]) map[key] = [];
      if (!map[key].some((s:any) => s.SAK_ID === row.sakhaId)) {
        map[key].push({
          VID_ID: row.VID_ID,
          SAK_ID: row.sakhaId,
          SAK_NM: row.sakhaName
        });
      }
    });

    // 4. Combine data
    const detailedData = mandals.map(m => {
      const key = `${m.VID_ID}_${m.MAN_ID}`;
      return {
        VID_ID: m.VID_ID,
        MAN_ID: m.MAN_ID,
        MAN_NM: m.MAN_NM,
        shakhaCount: map[key]?.length || 0,
        shakhas: map[key] || []
      };
    });

    const countData = detailedData.map(item => ({
      id: `${item.VID_ID}_${item.MAN_ID}`, // unique for frontend
      name: item.MAN_NM,
      count: item.shakhaCount,
      level: 'mandal',
      column: 'sakha'
    }));

    res.json({
      totalLevelCount: mandals.length,
      totalColumnCount: shakhasData.length,
      countData,
      detailedData
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// GET ALL BOOTHS IN EACH CLUSTER (Correct & No Booth Loss)
// export const getBoothInCluster = async (req:any, res:any) => {
//   try {
//  let totalBooths =0;
//     // 1) Fetch cluster → VID_ID mapping
//     const clusterRows = await prisma.$queryRaw`
//       SELECT DISTINCT CLUS_ID, CLUS_NM, VID_ID
//       FROM cludata
//       WHERE CLUS_ID IS NOT NULL
//         AND VID_ID IS NOT NULL
//       ORDER BY CLUS_ID;
//     `as any[];;

//     // Build cluster → vid list
//     const clusterVidMap:any = {};
//     for (const row of clusterRows) {
//       if (!clusterVidMap[row.CLUS_ID]) {
//         clusterVidMap[row.CLUS_ID] = {
//           clusterId: row.CLUS_ID,
//           clusterName: row.CLUS_NM,
//           vids: []
//         };
//       }
//       clusterVidMap[row.CLUS_ID].vids.push(row.VID_ID);
//     }

//     // 2) Fetch ALL booths from vddata (no join)
//     const boothRows = await prisma.$queryRaw`
//       SELECT VID_ID, BT_ID, BT_NM
//       FROM vddata
//       WHERE BT_ID IS NOT NULL;
//     `as any[];;

//     // 3) Group booths into clusters manually (NO JOIN LOSS)
//     const clusters:any = [];

//     for (const cid in clusterVidMap) {
//       const { clusterId, clusterName, vids } = clusterVidMap[cid];

//       // booths whose VID_ID is in cluster vid list
//       const booths = boothRows.filter(b => vids.includes(b.VID_ID));
//      totalBooths+=booths.length;
//       clusters.push({
//         clusterId,
//         clusterName,
//         boothCount: booths.length,
//         booths: booths.map(b => ({ BT_ID: b.BT_ID, BT_NM: b.BT_NM }))
//       });
//     }

   
//     // Transform to match frontend expectations
//     const countData = clusters.map((item:any) => ({
//       id: item.clusterId,
//       name: item.clusterName,
//       count: item.boothCount,
//       level: 'cluster',
//       column: 'booth'
//     }));

//     res.json({
//       totalLevelCount: clusters.length,
//       totalColumnCount: totalBooths,
//       countData: countData,
//       detailedData: clusters
//     });

//   } catch (err:any) {
//     return res.status(500).json({ error: err.message });
//   }
// };




export const getBoothInCluster = async (req: any, res: any) => {
  const cacheKey = "cluster:booth:all";
  try {
    // 1️⃣ Check cache
    const cachedData = await redisCacheService.get(cacheKey);
    if (cachedData) {
      // console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json({
        cached: true,
        ...cachedData,
      });
    }

    // console.log(`[CACHE MISS] ${cacheKey}`);

    // ------------ Fetch DB -------------
    let totalBooths = 0;

    const clusterRows = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT CLUS_ID, CLUS_NM, VID_ID
      FROM cludata
      WHERE CLUS_ID IS NOT NULL
        AND VID_ID IS NOT NULL
      ORDER BY CLUS_ID;
    `;

    const clusterVidMap: any = {};
    for (const row of clusterRows) {
      if (!clusterVidMap[row.CLUS_ID]) {
        clusterVidMap[row.CLUS_ID] = {
          clusterId: row.CLUS_ID,
          clusterName: row.CLUS_NM,
          vids: [],
        };
      }
      clusterVidMap[row.CLUS_ID].vids.push(row.VID_ID);
    }

    const boothRows = await prisma.$queryRaw<any[]>`
      SELECT VID_ID, BT_ID, BT_NM
      FROM vddata
      WHERE BT_ID IS NOT NULL;
    `;

    const clusters: any[] = [];

    for (const cid in clusterVidMap) {
      const { clusterId, clusterName, vids } = clusterVidMap[cid];
      const booths = boothRows.filter((b) => vids.includes(b.VID_ID));
      totalBooths += booths.length;

      clusters.push({
        clusterId,
        clusterName,
        boothCount: booths.length,
        booths: booths.map((b) => ({
          BT_ID: b.BT_ID,
          BT_NM: b.BT_NM,
        })),
      });
    }

    const countData = clusters.map((item) => ({
      id: item.clusterId,
      name: item.clusterName,
      count: item.boothCount,
      level: "cluster",
      column: "booth",
    }));

    const response = {
      totalLevelCount: clusters.length,
      totalColumnCount: totalBooths,
      countData,
      detailedData: clusters,
    };

    // 2️⃣ Cache result (TTL 5 mins)
    await redisCacheService.set(cacheKey, response, 86400 ); // 300s = 5 mins
    // console.log(`[CACHE SET] ${cacheKey}`);

    return res.json(response);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


// -------------------------------------------------------------
// GET TOTAL UNIQUE BOOTHS IN EACH SAMBHAG (Correct + No Duplicate)
// -------------------------------------------------------------
export const getBoothInSambhag = async (req:any, res:any) => {
  try {
    const cacheKey = "getBoothInSambhag:all";

    // 1️⃣ Check cache
    const cachedData = await redisCacheService.get(cacheKey);
    if (cachedData) {
      // console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json({
        cached: true,
        ...cachedData,
      });
    }

    // console.log(`[CACHE MISS] ${cacheKey}`);


    // STEP 1: Get unique sambhags
    const sambhagList = await prisma.$queryRaw`
      SELECT DISTINCT SAM_ID, SAM_NM
      FROM smdata
      WHERE SAM_ID IS NOT NULL
      ORDER BY SAM_ID;
    `as any[];;

    const finalData = [];
    let totalBooths = 0;

    // STEP 2: Loop through each Sambhag
    for (const sm of sambhagList) {

      // Fetch ALL VID_ID inside this Sambhag
      const vidRows = await prisma.$queryRaw`
        SELECT DISTINCT VID_ID
        FROM smdata
        WHERE SAM_ID = ${sm.SAM_ID}
        AND VID_ID IS NOT NULL;
      `as any[];

      const vidList = vidRows.map(v => v.VID_ID);

      if (vidList.length === 0) {
        finalData.push({
          sambhagId: sm.SAM_ID,
          sambhagName: sm.SAM_NM,
          boothCount: 0,
          booths: []
        });
        continue;
      }

      // STEP 3: Fetch unique booths under these VIDs
      const boothRows = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT BT_ID, BT_NM
        FROM vddata
        WHERE VID_ID IN (${vidList.join(",")})
        AND BT_ID IS NOT NULL
        ORDER BY BT_ID;
      `) as any[];

      totalBooths += boothRows.length;

      finalData.push({
        sambhagId: sm.SAM_ID,
        sambhagName: sm.SAM_NM,
        boothCount: boothRows.length,
        booths: boothRows
      });
    }

    // Transform to match frontend expectations
    const countData = finalData.map((item: any) => ({
      id: item.sambhagId,
      name: item.sambhagName,
      count: item.boothCount,
      level: 'sambhag',
      column: 'booth'
    }));

    // STEP 4: Return JSON
     const response={
      totalLevelCount: finalData.length,
      totalColumnCount: totalBooths,
      countData: countData,
      detailedData: finalData
    }
  // 2️⃣ Cache result (TTL 5 mins)
    await redisCacheService.set(cacheKey, response, 86400 ); // 300s = 5 mins
    // console.log(`[CACHE SET] ${cacheKey}`);

    return res.json(response);
  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};


// GET ALL BOOTHS IN EACH LOK SABHA
export const getBoothInLokSabha = async (req:any, res:any) => {
  try {
    const cacheKey = "getBoothInLocsabha:all";

    // 1️⃣ Check cache
    const cachedData = await redisCacheService.get(cacheKey);
    if (cachedData) {
      // console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json({
        cached: true,
        ...cachedData,
      });
    }
    let totalBooths = 0;
    
    // 1) Fetch lok sabha → VID_ID mapping
    const lokRows = await prisma.$queryRaw`
      SELECT DISTINCT LOK_ID, LOK_NM, VID_ID
      FROM cludata
      WHERE LOK_ID IS NOT NULL
        AND VID_ID IS NOT NULL
      ORDER BY LOK_ID;
    ` as any[];

    // Build lok → vid list
    const lokVidMap: any = {};
    for (const row of lokRows) {
      if (!lokVidMap[row.LOK_ID]) {
        lokVidMap[row.LOK_ID] = {
          lokId: row.LOK_ID,
          lokName: row.LOK_NM,
          vids: []
        };
      }
      lokVidMap[row.LOK_ID].vids.push(row.VID_ID);
    }

    // 2) Fetch ALL booths from vddata
    const boothRows = await prisma.$queryRaw`
      SELECT VID_ID, BT_ID, BT_NM
      FROM vddata
      WHERE BT_ID IS NOT NULL;
    ` as any[];

    // 3) Group booths into lok sabhas manually
    const loks: any = [];

    for (const lokId in lokVidMap) {
      const { lokName, vids } = lokVidMap[lokId];
      
      // booths whose VID_ID is in lok vid list
      const booths = boothRows.filter((b: any) => vids.includes(b.VID_ID));
      totalBooths += booths.length;

      loks.push({
        lokId,
        lokName,
        boothCount: booths.length,
        booths: booths.map((b: any) => ({ BT_ID: b.BT_ID, BT_NM: b.BT_NM }))
      });
    }

    // Transform to match frontend expectations
    const countData = loks.map((item:any) => ({
      id: item.lokId,
      name: item.lokName,
      count: item.boothCount,
      level: 'lok',
      column: 'booth'
    }));

    const response={
      totalLevelCount: loks.length,
      totalColumnCount: totalBooths,
      countData: countData,
      detailedData: loks
    };

    // 2️⃣ Cache result (TTL 5 mins)
    await redisCacheService.set(cacheKey, response, 86400 ); // 300s = 5 mins
    // console.log(`[CACHE SET] ${cacheKey}`);

    return res.json(response);
  } catch (err:any) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ALL BOOTHS IN EACH VIDHAN SABHA
export const getBoothInVidhanSabha = async (req:any, res:any) => {
  try {
    
    const cacheKey = "getBoothInVidhanSabha:all";

    // 1️⃣ Check cache
    const cachedData = await redisCacheService.get(cacheKey);
    if (cachedData) {
      // console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json({
        cached: true,
        ...cachedData,
      });
    }
    
  

    // 1) Fetch all Vidhan Sabhas
    const vidhans = await prisma.$queryRaw`
      SELECT VID_ID, ANY_VALUE(VID_NM) AS VID_NM
      FROM cludata
      WHERE VID_ID IS NOT NULL
      GROUP BY VID_ID
      ORDER BY VID_NM;
    `as any[];;

    // 2) Fetch all booths per Vidhan Sabha
    const boothsData = await prisma.$queryRaw`
      SELECT 
        v.VID_ID AS vidhanId,
        v.BT_ID AS boothId,
        ANY_VALUE(v.BT_NM) AS boothName
      FROM vddata v
      WHERE v.BT_ID IS NOT NULL
      GROUP BY v.VID_ID, v.BT_ID
      ORDER BY v.VID_ID, ANY_VALUE(v.BT_NM);
    `as any[];;

    const map:any = {};
    boothsData.forEach(row => {
      if (!map[row.vidhanId]) map[row.vidhanId] = [];
      map[row.vidhanId].push({ BT_ID: row.boothId, BT_NM: row.boothName });
    });

    const result = vidhans.map(v => ({
      VID_ID: v.VID_ID,
      VID_NM: v.VID_NM,
      boothCount: map[v.VID_ID]?.length || 0,
      booths: map[v.VID_ID] || []
    }));

    // Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.VID_ID,
      name: item.VID_NM,
      count: item.boothCount,
      level: 'vid',
      column: 'booth'
    }));

     const response = {
      totalLevelCount: vidhans.length,
      totalColumnCount: boothsData.length,
      countData: countData,
      detailedData: result
    };

          // 2️⃣ Cache result (TTL 5 mins)
    await redisCacheService.set(cacheKey, response, 86400 ); // 300s = 5 mins
    console.log(`[CACHE SET] ${cacheKey}`);

    return res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL BOOTHS IN EACH JILA
export const getBoothInJila = async (req:any, res:any) => {
  try {
     const cacheKey = "getBoothInJila:all";

    // 1️⃣ Check cache
    const cachedData = await redisCacheService.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json({
        cached: true,
        ...cachedData,
      });
    }
    
        
    // STEP 1: Get unique jilas
    const jilaList = await prisma.$queryRaw`
      SELECT DISTINCT JILA_ID, JILA_NM
      FROM smdata
      WHERE JILA_ID IS NOT NULL
      ORDER BY JILA_ID;
    `as any[];;

    const finalData = [];
    let totalBooths = 0;

    // STEP 2: Loop through each Jila
    for (const jila of jilaList) {
      // Fetch ALL VID_ID inside this Jila
      const vidRows = await prisma.$queryRaw`
        SELECT DISTINCT VID_ID
        FROM smdata
        WHERE JILA_ID = ${jila.JILA_ID}
        AND VID_ID IS NOT NULL;
      `as any[];;

      const vidList = vidRows.map(v => v.VID_ID);

      if (vidList.length === 0) {
        finalData.push({
          jilaId: jila.JILA_ID,
          jilaName: jila.JILA_NM,
          boothCount: 0,
          booths: []
        });
        continue;
      }

      // STEP 3: Fetch unique booths under these VIDs
      const boothRows = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT BT_ID, BT_NM
        FROM vddata
        WHERE VID_ID IN (${vidList.join(",")})
        AND BT_ID IS NOT NULL
        ORDER BY BT_ID;
      `)as any[];;

      totalBooths += boothRows.length;

      finalData.push({
        jilaId: jila.JILA_ID,
        jilaName: jila.JILA_NM,
        boothCount: boothRows.length,
        booths: boothRows
      });
    }

    // Transform to match frontend expectations
    const countData = finalData.map(item => ({
      id: item.jilaId,
      name: item.jilaName,
      count: item.boothCount,
      level: 'jila',
      column: 'booth'
    }));

    // STEP 4: Return JSON
   const response = {
      totalLevelCount: finalData.length,
      totalColumnCount: totalBooths,
      countData: countData,
      detailedData: finalData
    }

    // 2️⃣ Cache result (TTL 5 mins)
    await redisCacheService.set(cacheKey, response, 86400 ); // 300s = 5 mins
    console.log(`[CACHE SET] ${cacheKey}`);

    return res.json(response);

  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBoothInMandal = async (req:any, res:any) => {
 
  const cacheKey = "getBoothInMandal:all";

    // 1️⃣ Check cache
    const cachedData = await redisCacheService.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json({
        cached: true,
        ...cachedData,
      });
    }
    

 
  try {
    // 1️⃣ Fetch unique mandals (VID_ID + MAN_ID)
    const mandals = await prisma.$queryRaw`
      SELECT
        VID_ID,
        MAN_ID,
        MIN(MAN_NM) AS MAN_NM
      FROM vddata
      WHERE MAN_ID IS NOT NULL
      GROUP BY VID_ID, MAN_ID
      ORDER BY VID_ID, MAN_ID;
    `as any[];;

    // 2️⃣ Fetch all booths for each mandal with details
    const boothsData = await prisma.$queryRaw`
      SELECT 
        v.VID_ID,
        v.MAN_ID AS mandalId,
        v.BT_ID AS boothId,
        MIN(v.BT_NM) AS boothName
      FROM vddata v
      WHERE 
        v.MAN_ID IS NOT NULL
        AND v.VID_ID IS NOT NULL
        AND v.BT_ID IS NOT NULL
        AND v.BT_NM IS NOT NULL AND v.BT_NM != ''
      GROUP BY 
        v.VID_ID,
        v.MAN_ID,
        v.BT_ID
      ORDER BY 
        v.VID_ID, v.MAN_ID, v.BT_ID;
    `as any[];;

    // 3️⃣ Group booths under each mandal
    const boothMap:any = {};
    boothsData.forEach(row => {
      const key = `${row.VID_ID}_${row.mandalId}`;
      if (!boothMap[key]) boothMap[key] = [];
      boothMap[key].push({
        VID_ID: row.VID_ID,
        BT_ID: row.boothId,
        BT_NM: row.boothName
      });
    });

    // 4️⃣ Generate final output with booth details
    const detailedData = mandals.map(m => {
      const key = `${m.VID_ID}_${m.MAN_ID}`;
      const booths = boothMap[key] || [];
      return {
        VID_ID: m.VID_ID,
        MAN_ID: m.MAN_ID,
        MAN_NM: m.MAN_NM,
        boothCount: booths.length,
        booths: booths
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = detailedData.map(item => ({
      id: `${item.VID_ID}_${item.MAN_ID}`,
      name: item.MAN_NM,
      count: item.boothCount,
      level: 'mandal',
      column: 'booth'
    }));

    // 6️⃣ Send Response with correct format
   const response={
      totalLevelCount: mandals.length,
      totalColumnCount: boothsData.length,
      countData: countData,
      detailedData: detailedData
    };

            // 2️⃣ Cache result (TTL 5 mins)
    await redisCacheService.set(cacheKey, response, 86400 ); // 300s = 5 mins
    console.log(`[CACHE SET] ${cacheKey}`);

    return res.json(response);

  } catch (err) {
    console.error("Error in getBoothInMandal:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// GET ALL BOOTHS IN EACH SAKHA
export const getBoothInSakha = async (req:any, res:any) => {
  try {

     const cacheKey = "getBoothInSakha:all";

    // 1️⃣ Check cache
    const cachedData = await redisCacheService.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return res.json({
        cached: true,
        ...cachedData,
      });
    }
    
        
    // 1️⃣ Fetch unique sakhas (VID_ID + SAK_ID)
    const sakhas = await prisma.$queryRaw`
      SELECT
        VID_ID,
        SAK_ID,
        MIN(SAK_NM) AS SAK_NM
      FROM vddata
      WHERE SAK_ID IS NOT NULL
        AND SAK_NM IS NOT NULL 
        AND SAK_NM != ''
      GROUP BY VID_ID, SAK_ID
      ORDER BY VID_ID, SAK_ID;
    `as any[];;

    // 2️⃣ Fetch all booths for each sakha with details
    const boothsData = await prisma.$queryRaw`
      SELECT 
        v.VID_ID,
        v.SAK_ID AS sakhaId,
        v.BT_ID AS boothId,
        MIN(v.BT_NM) AS boothName
      FROM vddata v
      WHERE 
        v.SAK_ID IS NOT NULL
        AND v.VID_ID IS NOT NULL
        AND v.BT_ID IS NOT NULL
        AND v.BT_NM IS NOT NULL AND v.BT_NM != ''
      GROUP BY 
        v.VID_ID,
        v.SAK_ID,
        v.BT_ID
      ORDER BY 
        v.VID_ID, v.SAK_ID, v.BT_ID;
    `as any[];;

    // 3️⃣ Group booths under each sakha
    const boothMap:any = {};
    boothsData.forEach(row => {
      const key = `${row.VID_ID}_${row.sakhaId}`;
      if (!boothMap[key]) boothMap[key] = [];
      boothMap[key].push({
        VID_ID: row.VID_ID,
        BT_ID: row.boothId,
        BT_NM: row.boothName
      });
    });

    // 4️⃣ Generate final output with booth details
    const detailedData = sakhas.map(s => {
      const key = `${s.VID_ID}_${s.SAK_ID}`;
      const booths = boothMap[key] || [];
      return {
        VID_ID: s.VID_ID,
        SAK_ID: s.SAK_ID,
        SAK_NM: s.SAK_NM,
        boothCount: booths.length,
        booths: booths
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = detailedData.map(item => ({
      id: `${item.VID_ID}_${item.SAK_ID}`,
      name: item.SAK_NM,
      count: item.boothCount,
      level: 'sakha',
      column: 'booth'
    }));

    // 6️⃣ Send Response with correct format
    const response ={
      totalLevelCount: sakhas.length,
      totalColumnCount: boothsData.length,
      countData: countData,
      detailedData: detailedData
    };

    // 2️⃣ Cache result (TTL 5 mins)
    await redisCacheService.set(cacheKey, response, 86400 ); // 300s = 5 mins
    console.log(`[CACHE SET] ${cacheKey}`);

    return res.json(response);

  } catch (err) {
    console.error("Error in getBoothInSakha:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL VIDHAN SABHAS IN EACH CLUSTER
export const getVidhanSabhaInCluster = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch clusters
    const clusters = await prisma.$queryRaw`
      SELECT CLUS_ID, ANY_VALUE(CLUS_NM) AS CLUS_NM
      FROM cludata
      WHERE CLUS_ID IS NOT NULL
      GROUP BY CLUS_ID
      ORDER BY CLUS_NM;
    `as any[];;

    // 2️⃣ Fetch unique vidhan sabhas per cluster
    const vidhanData = await prisma.$queryRaw`
      SELECT 
        c.CLUS_ID AS clusterId,
        c.VID_ID AS vidhanId,
        ANY_VALUE(c.VID_NM) AS vidhanName
      FROM cludata c
      WHERE c.CLUS_ID IS NOT NULL 
        AND c.VID_ID IS NOT NULL
      GROUP BY c.CLUS_ID, c.VID_ID
      ORDER BY c.CLUS_ID, ANY_VALUE(c.VID_NM);
    `as any[];;

    // 3️⃣ Group vidhan sabhas under clusters
    const clusterMap:any = {};
    vidhanData.forEach(row => {
      if (!clusterMap[row.clusterId]) clusterMap[row.clusterId] = [];
      clusterMap[row.clusterId].push({
        VID_ID: row.vidhanId,
        VID_NM: row.vidhanName
      });
    });

    // 4️⃣ Build result
    const result = clusters.map(c => {
      const vidhans = clusterMap[c.CLUS_ID] || [];
      return {
        CLUS_ID: c.CLUS_ID,
        CLUS_NM: c.CLUS_NM,
        vidhanCount: vidhans.length,
        vidhans: vidhans
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.CLUS_ID,
      name: item.CLUS_NM,
      count: item.vidhanCount,
      level: 'cluster',
      column: 'vid'
    }));

    res.json({
      totalLevelCount: clusters.length,
      totalColumnCount: vidhanData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error("Error in getVidhanSabhaInCluster:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL LOK SABHAS IN EACH CLUSTER
export const getLokSabhaInCluster = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch clusters
    const clusters = await prisma.$queryRaw`
      SELECT CLUS_ID, ANY_VALUE(CLUS_NM) AS CLUS_NM
      FROM cludata
      WHERE CLUS_ID IS NOT NULL
      GROUP BY CLUS_ID
      ORDER BY CLUS_NM;
    `as any[];;

    // 2️⃣ Fetch unique lok sabhas per cluster
    const lokData = await prisma.$queryRaw`
      SELECT 
        c.CLUS_ID AS clusterId,
        c.LOK_ID AS lokId,
        ANY_VALUE(c.LOK_NM) AS lokName
      FROM cludata c
      WHERE c.CLUS_ID IS NOT NULL 
        AND c.LOK_ID IS NOT NULL
      GROUP BY c.CLUS_ID, c.LOK_ID
      ORDER BY c.CLUS_ID, ANY_VALUE(c.LOK_NM);
    `as any[];;

    // 3️⃣ Group lok sabhas under clusters
    const clusterMap:any = {};
    lokData.forEach(row => {
      if (!clusterMap[row.clusterId]) clusterMap[row.clusterId] = [];
      clusterMap[row.clusterId].push({
        LOK_ID: row.lokId,
        LOK_NM: row.lokName
      });
    });

    // 4️⃣ Build result
    const result = clusters.map(c => {
      const loks = clusterMap[c.CLUS_ID] || [];
      return {
        CLUS_ID: c.CLUS_ID,
        CLUS_NM: c.CLUS_NM,
        lokCount: loks.length,
        loks: loks
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.CLUS_ID,
      name: item.CLUS_NM,
      count: item.lokCount,
      level: 'cluster',
      column: 'lok'
    }));

    res.json({
      totalLevelCount: clusters.length,
      totalColumnCount: lokData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error("Error in getLokSabhaInCluster:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL VIDHAN SABHAS IN EACH LOK SABHA
export const getVidhanSabhaInLokSabha = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch all lok sabhas
    const loks = await prisma.$queryRaw`
      SELECT LOK_ID, ANY_VALUE(LOK_NM) AS LOK_NM
      FROM cludata
      WHERE LOK_ID IS NOT NULL
      GROUP BY LOK_ID
      ORDER BY LOK_NM;
    `as any[];;

    // 2️⃣ Fetch unique vidhan sabhas per lok sabha
    const vidhanData = await prisma.$queryRaw`
      SELECT 
        c.LOK_ID AS lokId,
        c.VID_ID AS vidhanId,
        ANY_VALUE(c.VID_NM) AS vidhanName
      FROM cludata c
      WHERE c.LOK_ID IS NOT NULL 
        AND c.VID_ID IS NOT NULL
      GROUP BY c.LOK_ID, c.VID_ID
      ORDER BY c.LOK_ID, ANY_VALUE(c.VID_NM);
    `as any[];;

    // 3️⃣ Group vidhan sabhas under lok sabhas
    const lokMap:any = {};
    vidhanData.forEach(row => {
      if (!lokMap[row.lokId]) lokMap[row.lokId] = [];
      lokMap[row.lokId].push({
        VID_ID: row.vidhanId,
        VID_NM: row.vidhanName
      });
    });

    // 4️⃣ Build result
    const result = loks.map(l => {
      const vidhans = lokMap[l.LOK_ID] || [];
      return {
        LOK_ID: l.LOK_ID,
        LOK_NM: l.LOK_NM,
        vidhanCount: vidhans.length,
        vidhans: vidhans
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.LOK_ID,
      name: item.LOK_NM,
      count: item.vidhanCount,
      level: 'lok',
      column: 'vid'
    }));

    res.json({
      totalLevelCount: loks.length,
      totalColumnCount: vidhanData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error("Error in getVidhanSabhaInLokSabha:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// GET ALL JILAS IN EACH SAMBHAG
export const getJilaInSambhag = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch all sambhags
    const sambhags = await prisma.$queryRaw`
      SELECT SAM_ID, ANY_VALUE(SAM_NM) AS SAM_NM
      FROM smdata
      WHERE SAM_ID IS NOT NULL
      GROUP BY SAM_ID
      ORDER BY SAM_NM;
    `as any[];;

    // 2️⃣ Fetch unique jilas per sambhag
    const jilaData = await prisma.$queryRaw`
      SELECT 
        s.SAM_ID AS sambhagId,
        s.JILA_ID AS jilaId,
        ANY_VALUE(s.JILA_NM) AS jilaName
      FROM smdata s
      WHERE s.SAM_ID IS NOT NULL 
        AND s.JILA_ID IS NOT NULL
      GROUP BY s.SAM_ID, s.JILA_ID
      ORDER BY s.SAM_ID, ANY_VALUE(s.JILA_NM);
    `as any[];;

    // 3️⃣ Group jilas under sambhags
    const sambhagMap:any = {};
    jilaData.forEach(row => {
      if (!sambhagMap[row.sambhagId]) sambhagMap[row.sambhagId] = [];
      sambhagMap[row.sambhagId].push({
        JILA_ID: row.jilaId,
        JILA_NM: row.jilaName
      });
    });

    // 4️⃣ Build result
    const result = sambhags.map(s => {
      const jilas = sambhagMap[s.SAM_ID] || [];
      return {
        SAM_ID: s.SAM_ID,
        SAM_NM: s.SAM_NM,
        jilaCount: jilas.length,
        jilas: jilas
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.SAM_ID,
      name: item.SAM_NM,
      count: item.jilaCount,
      level: 'sambhag',
      column: 'jila'
    }));

    res.json({
      totalLevelCount: sambhags.length,
      totalColumnCount: jilaData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error("Error in getJilaInSambhag:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL VIDHAN SABHAS IN EACH SAMBHAG
export const getVidhanSabhaInSambhag = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch all sambhags
    const sambhags = await prisma.$queryRaw`
      SELECT SAM_ID, ANY_VALUE(SAM_NM) AS SAM_NM
      FROM smdata
      WHERE SAM_ID IS NOT NULL
      GROUP BY SAM_ID
      ORDER BY SAM_NM;
    `as any[];;

    // 2️⃣ Fetch unique vidhan sabhas per sambhag
    const vidhanData = await prisma.$queryRaw`
      SELECT 
        s.SAM_ID AS sambhagId,
        s.VID_ID AS vidhanId,
        ANY_VALUE(s.VID_NM) AS vidhanName
      FROM smdata s
      WHERE s.SAM_ID IS NOT NULL 
        AND s.VID_ID IS NOT NULL
      GROUP BY s.SAM_ID, s.VID_ID
      ORDER BY s.SAM_ID, ANY_VALUE(s.VID_NM);
    `as any[];;

    // 3️⃣ Group vidhan sabhas under sambhags
    const sambhagMap:any = {};
    vidhanData.forEach(row => {
      if (!sambhagMap[row.sambhagId]) sambhagMap[row.sambhagId] = [];
      sambhagMap[row.sambhagId].push({
        VID_ID: row.vidhanId,
        VID_NM: row.vidhanName
      });
    });

    // 4️⃣ Build result
    const result = sambhags.map(s => {
      const vidhans = sambhagMap[s.SAM_ID] || [];
      return {
        SAM_ID: s.SAM_ID,
        SAM_NM: s.SAM_NM,
        vidhanCount: vidhans.length,
        vidhans: vidhans
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.SAM_ID,
      name: item.SAM_NM,
      count: item.vidhanCount,
      level: 'sambhag',
      column: 'vid'
    }));

    res.json({
      totalLevelCount: sambhags.length,
      totalColumnCount: vidhanData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error("Error in getVidhanSabhaInSambhag:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// GET ALL VIDHAN SABHAS IN EACH JILA
export const getVidhanSabhaInJila = async (req:any, res:any) => {
  try {
    // 1️⃣ Fetch all jilas
    const jilas = await prisma.$queryRaw`
      SELECT JILA_ID, ANY_VALUE(JILA_NM) AS JILA_NM
      FROM smdata
      WHERE JILA_ID IS NOT NULL
      GROUP BY JILA_ID
      ORDER BY JILA_NM;
    `as any[];;

    // 2️⃣ Fetch unique vidhan sabhas per jila
    const vidhanData = await prisma.$queryRaw`
      SELECT 
        s.JILA_ID AS jilaId,
        s.VID_ID AS vidhanId,
        ANY_VALUE(s.VID_NM) AS vidhanName
      FROM smdata s
      WHERE s.JILA_ID IS NOT NULL 
        AND s.VID_ID IS NOT NULL
      GROUP BY s.JILA_ID, s.VID_ID
      ORDER BY s.JILA_ID, ANY_VALUE(s.VID_NM);
    `as any[];;

    // 3️⃣ Group vidhan sabhas under jilas
    const jilaMap:any = {};
    vidhanData.forEach(row => {
      if (!jilaMap[row.jilaId]) jilaMap[row.jilaId] = [];
      jilaMap[row.jilaId].push({
        VID_ID: row.vidhanId,
        VID_NM: row.vidhanName
      });
    });

    // 4️⃣ Build result
    const result = jilas.map(j => {
      const vidhans = jilaMap[j.JILA_ID] || [];
      return {
        JILA_ID: j.JILA_ID,
        JILA_NM: j.JILA_NM,
        vidhanCount: vidhans.length,
        vidhans: vidhans
      };
    });

    // 5️⃣ Transform to match frontend expectations
    const countData = result.map(item => ({
      id: item.JILA_ID,
      name: item.JILA_NM,
      count: item.vidhanCount,
      level: 'jila',
      column: 'vid'
    }));

    res.json({
      totalLevelCount: jilas.length,
      totalColumnCount: vidhanData.length,
      countData: countData,
      detailedData: result
    });

  } catch (err) {
    console.error("Error in getVidhanSabhaInJila:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

