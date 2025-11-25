import prisma from "../prisma.js";
import { Request, Response } from 'express';
import { redisCacheService } from "../redis/cache.service.js";

// Get all unique Clusters (Level 0)
export const getClusters = async (req: any, res: any) => {
  try {
    const data = await prisma.cludata.findMany({
      distinct: ['CLUS_ID'],
      select: {
        CLUS_ID: true,
        CLUS_NM: true
      },
      where: {
        CLUS_ID: { not: null } // Exclude nulls
      },
      orderBy: { CLUS_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching clusters' });
  }
};

// Get all unique Sambhags (Level 0)
export const getSambhags = async (req: any, res: any) => {
  try {
    const data = await prisma.smdata.findMany({
      distinct: ['SAM_ID'],
      select: {
        SAM_ID: true,
        SAM_NM: true
      },
      where: {
        SAM_ID: { not: null }
      },
      orderBy: { SAM_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching sambhags' });
  }
};


// Get Lok Sabhas by Cluster ID (Level 1)
// Request: /api/loksabha/:clusterId
export const getLokSabhasByCluster = async (req: any, res: any) => {
  const { clusterId } = req.params;
  try {
    const data = await prisma.cludata.findMany({
      where: {
        CLUS_ID: parseInt(clusterId)
      },
      distinct: ['LOK_ID'],
      select: {
        LOK_ID: true,
        LOK_NM: true,
        CLUS_ID: true
      },
      orderBy: { LOK_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Lok Sabhas' });
  }
};

// Get Jilas (Districts) by Sambhag ID (Level 1)
// Request: /api/jila/:sambhagId
export const getJilasBySambhag = async (req: any, res: any) => {
  const { sambhagId } = req.params;
  try {
    const data = await prisma.smdata.findMany({
      where: {
        SAM_ID: parseInt(sambhagId)
      },
      distinct: ['JILA_ID'],
      select: {
        JILA_ID: true,
        JILA_NM: true,
        SAM_ID: true
      },
      orderBy: { JILA_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Districts' });
  }
};



// Get Vidhan Sabhas by Lok Sabha ID (from cludata)
// Request: /api/vidhansabha/loksabha/:lokId
export const getVidhanSabhasByLokSabha = async (req: any, res: any) => {
  const { lokId } = req.params;
  try {
    const data = await prisma.cludata.findMany({
      where: {
        LOK_ID: parseInt(lokId)
      },
      distinct: ['VID_ID'],
      select: {
        VID_ID: true,
        VID_NM: true,
        LOK_ID: true
      },
      orderBy: { VID_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Vidhan Sabhas' });
  }
};

// Get Vidhan Sabhas by Jila ID (from smdata)
// Request: /api/vidhansabha/jila/:jilaId
export const getVidhanSabhasByDistrict = async (req: any, res: any) => {
  const { jilaId } = req.params;
  try {
    const data = await prisma.smdata.findMany({
      where: {
        JILA_ID: parseInt(jilaId)
      },
      distinct: ['VID_ID'],
      select: {
        VID_ID: true,
        VID_NM: true,
        JILA_ID: true
      },
      orderBy: { VID_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Vidhan Sabhas' });
  }
};


// Get Mandals by Vidhan Sabha ID (Level 3)
// Request: /api/mandal/:vidId
export const getMandalsByVid = async (req: any, res: any) => {
  const { vidId } = req.params;
  try {
    const data = await prisma.vddata.findMany({
      where: {
        VID_ID: parseInt(vidId)
      },
      distinct: ['MAN_ID'], // Only get unique Mandals
      select: {
        MAN_ID: true,
        MAN_NM: true,
        VID_ID: true
      },
      orderBy: { MAN_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Mandals' });
  }
};

// Get Sakhas by Mandal ID (Level 4)
// Request: /api/sakha/:vidId/:manId
export const getSakhasByMandal = async (req: any, res: any) => {
  const { vidId, manId } = req.params;
  try {
    const data = await prisma.vddata.findMany({
      where: {
        MAN_ID: parseInt(manId),
        VID_ID: parseInt(vidId) // Scope by Vidhan ID
      },
      distinct: ['MAN_ID', 'SAK_ID'],
      select: {
        SAK_ID: true,
        SAK_NM: true,
        MAN_ID: true
      },
      orderBy: { SAK_NM: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Sakhas' });
  }
};

// Get Booths by Sakha ID (Level 5 - Final Leaf Nodes)
// Request: /api/booth/:sakId
export const getBoothsBySakha = async (req: any, res: any) => {
  const { sakId,vidId } = req.params;
  try {
    // No 'distinct' needed here as we want the actual booth list
    const data = await prisma.vddata.findMany({
      where: {
        SAK_ID: parseInt(sakId),
         VID_ID: parseInt(vidId) 
      },
      select: {
        BT_ID: true,
        BT_NM: true,
        SAK_ID: true,
        // You can include other specific booth details here if needed
      },
      orderBy: { BT_ID: 'asc' }
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Booths' });
  }
};



export const getDeepClusterData = async (req: any, res: any) => {
  try {
    const { clusterId } = req.params;
    const cId = parseInt(clusterId);

    // 1. Get the Upper Hierarchy (Cluster -> Lok -> Vidhan)
    const upperData = await prisma.cludata.findMany({
      where: { CLUS_ID: cId, VID_ID: { not: null } },
      select: { CLUS_ID: true, CLUS_NM: true, LOK_ID: true, LOK_NM: true, VID_ID: true, VID_NM: true }
    });

    if (upperData.length === 0) return res.json({ success: true, data: [] });

    // 2. Extract Vidhan IDs to fetch Lower Hierarchy
    const vidIds = [...new Set(upperData.map(item => item.VID_ID).filter((id): id is number => id !== null))];

    // 3. Get Lower Hierarchy (Vidhan -> Mandal -> Sakha -> Booth)
    // We limit strictly to the Vidhan Sabhas found in the Cluster
    const lowerData = await prisma.vddata.findMany({
      where: { VID_ID: { in: vidIds }, BT_ID: { not: null } },
      select: {
        VID_ID: true, MAN_ID: true, MAN_NM: true,
        SAK_ID: true, SAK_NM: true, BT_ID: true, BT_NM: true
      }
    });

    // 4. Merge Data for Frontend
    // We create a flat list of Booths with full lineage
    const formattedData = lowerData.map(lower => {
      // Find matching upper data for this Vidhan ID
      const upper = upperData.find(u => u.VID_ID === lower.VID_ID);
      return {
        id: lower.BT_ID,
        name: lower.BT_NM,
        type: 'booth',
        // Full Lineage Metadata
        clusterId: upper?.CLUS_ID,
        clusterName: upper?.CLUS_NM,
        lokId: upper?.LOK_ID,
        lokName: upper?.LOK_NM,
        vidId: lower.VID_ID,
        vidName: upper?.VID_NM,
        manId: lower.MAN_ID,
        manName: lower.MAN_NM,
        sakId: lower.SAK_ID,
        sakName: lower.SAK_NM,
        btId: lower.BT_ID,
        btName: lower.BT_NM
      };
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const getDeepSambhagData = async (req: Request, res: Response) => {
  try {
    const { sambhagId } = req.params;
    const sId = parseInt(sambhagId);

    // 1. Upper (Sambhag -> Jila -> Vidhan)
    const upperData = await prisma.smdata.findMany({
      where: { SAM_ID: sId, VID_ID: { not: null } },
      select: { SAM_ID: true, SAM_NM: true, JILA_ID: true, JILA_NM: true, VID_ID: true, VID_NM: true }
    });

    if (upperData.length === 0) return res.json({ success: true, data: [] });

    const vidIds = [...new Set(upperData.map(item => item.VID_ID).filter((id): id is number => id !== null))];

    // 2. Lower
    const lowerData = await prisma.vddata.findMany({
      where: { VID_ID: { in: vidIds }, BT_ID: { not: null } },
      select: { VID_ID: true, MAN_ID: true, MAN_NM: true, SAK_ID: true, SAK_NM: true, BT_ID: true, BT_NM: true }
    });

    // 3. Merge
    const formattedData = lowerData.map(lower => {
      const upper = upperData.find(u => u.VID_ID === lower.VID_ID);
      return {
        id: lower.BT_ID,
        name: lower.BT_NM,
        type: 'booth',
        sambhagId: upper?.SAM_ID,
        sambhagName: upper?.SAM_NM,
        jilaId: upper?.JILA_ID,
        jilaName: upper?.JILA_NM,
        vidId: lower.VID_ID,
        vidName: upper?.VID_NM,
        manId: lower.MAN_ID,
        manName: lower.MAN_NM,
        sakId: lower.SAK_ID,
        sakName: lower.SAK_NM,
        btId: lower.BT_ID,
        btName: lower.BT_NM
      };
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};







export const getAllClusterData = async (req: any, res: any) => {
  try {
    // 1️⃣ Get and validate clusterId
    const { clusterId } = req.query;
    console.log("clusterID",clusterId)
    const parsedClusterId = parseInt(clusterId);
    // console.log("Fetching data for Cluster ID:", parsedClusterId);

    if (isNaN(parsedClusterId)) {
      return res.status(400).json({ error: "Invalid Cluster ID provided" });
    }

    // --- 2️⃣ Fetch unique Lok Sabhas for the cluster ---
    // This query is highly efficient for getting distinct Lok Sabhas and their names
    const lokDataRaw: any[] = await prisma.$queryRaw`
      SELECT 
        c.LOK_ID AS lokId,
        ANY_VALUE(c.LOK_NM) AS lokName
      FROM cludata c
      WHERE c.CLUS_ID = ${parsedClusterId}
        AND c.LOK_ID IS NOT NULL
      GROUP BY c.LOK_ID
      ORDER BY ANY_VALUE(c.LOK_NM);
    `;

    const lokIds = lokDataRaw.map(lok => lok.lokId);
    if (lokIds.length === 0) {
      // If no Lok Sabhas are found, return an empty array
      return res.status(200).json({ success: true, data: [] });
    }

    // --- 3️⃣ Batch Fetch ALL relevant Vidhan Sabhas (VID_ID) ---
    // Single query using LOK_ID IN (...)
    const vidhanSabhaData = await prisma.cludata.findMany({
      where: {
        LOK_ID: { in: lokIds }
      },
      distinct: ['VID_ID', 'LOK_ID'],
      select: {
        LOK_ID: true,
        VID_ID: true,
        VID_NM: true,
      },
      orderBy: [{ LOK_ID: 'asc' }, { VID_NM: 'asc' }]
    });

    const vidIds = vidhanSabhaData.map(v => v.VID_ID).filter((id): id is number => id !== null);

    // --- 4️⃣ Batch Fetch ALL Mandales, Sakh, and Booths (BT_ID) ---
    // Single query using VID_ID IN (...)
    const manSakhaData = await prisma.vddata.findMany({
      where: {
        VID_ID: { in: vidIds }
      },
      // Note: Use DISTINCT on the combination to get unique geographical points
      distinct: ['VID_ID', 'MAN_ID', 'SAK_ID', 'BT_ID'], 
      select: {
        VID_ID: true,
        MAN_ID: true,
        MAN_NM: true,
        SAK_ID: true,
        SAK_NM: true,
        BT_ID: true, // The Booth ID
        BT_NM: true, // The Booth Name
      },
      orderBy: [{ VID_ID: 'asc' }, { MAN_NM: 'asc' }, { SAK_NM: 'asc' }, { BT_NM: 'asc' }]
    });

    // --- 5️⃣ Structure the Data Hierarchy (Building the tree in memory) ---
    
    // 5a. Map Vidhan IDs to their corresponding Mandales/Sakh/Booths
    const vidToManSakhaMap = new Map<number, any[]>();
    for (const item of manSakhaData) {
      if (item.VID_ID) {
        if (!vidToManSakhaMap.has(item.VID_ID)) {
          vidToManSakhaMap.set(item.VID_ID, []);
        }
        vidToManSakhaMap.get(item.VID_ID)!.push(item);
      }
    }

    // 5b. Map Lok IDs to their corresponding Vidhan Sabhas
    const lokToVidhanMap = new Map<number, any[]>();
    for (const vid of vidhanSabhaData) {
      if (vid.LOK_ID) {
        // Enhance Vidhan Sabha object with its Mandales/Sakh/Booths
        const enhancedVid = {
          lokId: vid.LOK_ID,
          vidId: vid.VID_ID,
          vidName: vid.VID_NM,
          // Attach the nested data
          mandales_sakha_booths: vidToManSakhaMap.get(vid.VID_ID!) || []
        };
        if (!lokToVidhanMap.has(vid.LOK_ID)) {
          lokToVidhanMap.set(vid.LOK_ID, []);
        }
        lokToVidhanMap.get(vid.LOK_ID)!.push(enhancedVid);
      }
    }

    // 5c. Final structure: Lok Sabha -> Vidhan Sabha -> Mandal/Sakha/Booth
    const finalData = lokDataRaw.map(lok => ({
      clusterId: parsedClusterId,
      lokId: lok.lokId,
      lokName: lok.lokName,
      vidhanSabhas: lokToVidhanMap.get(lok.lokId!) || []
    }));
    
    // 6️⃣ Send the complete data
    res.status(200).json({ success: true, data: finalData });

  } catch (error) {
    console.error("Error fetching cluster data:", error);
    res.status(500).json({ error: "Server Error" });
  }
};


export const getHierarchyData = async (req: any, res: any) => {
  try {
    // 1️⃣ Extract all optional query params
    const {
      clusterId,
      sambhagId,
      jilaId,
      lokId,
      vidId,
      manId,
      sakhaId,
      btId
    } = req.query;

    // 2️⃣ Build dynamic WHERE filters
    const clusterFilter: any = {};
    if (clusterId) clusterFilter.CLUS_ID = parseInt(clusterId);
    if (sambhagId) clusterFilter.SAMBHAG_ID = parseInt(sambhagId);
    if (jilaId) clusterFilter.JILA_ID = parseInt(jilaId);

    // Fetch unique Lok Sabha
    const lokDataRaw: any[] = await prisma.cludata.findMany({
      where: {
        ...clusterFilter,
        ...(lokId && { LOK_ID: parseInt(lokId) })
      },
      distinct: ['LOK_ID'],
      select: {
        CLUS_ID: true,
        LOK_ID: true,
        LOK_NM: true
      }
    });

    const lokIds = lokDataRaw.map(lok => lok.LOK_ID);
    if (lokIds.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          cluster: clusterId ? 1 : lokDataRaw.length,
          lokSabha: 0,
          vidhanSabha: 0,
          mandal: 0,
          sakha: 0,
          booth: 0
        },
        data: []
      });
    }

    // Fetch Vidhan Sabhas
    const vidhanData = await prisma.cludata.findMany({
      where: {
        LOK_ID: { in: lokIds },
        ...(vidId && { VID_ID: parseInt(vidId) })
      },
      distinct: ['VID_ID', 'LOK_ID'],
      select: {
        LOK_ID: true,
        VID_ID: true,
        VID_NM: true
      }
    });

    const vidIds = vidhanData.map(v => v.VID_ID).filter((id): id is number => id !== null);
    if (vidIds.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          cluster: clusterId ? 1 : lokDataRaw.length,
          lokSabha: lokIds.length,
          vidhanSabha: 0,
          mandal: 0,
          sakha: 0,
          booth: 0
        },
        data: []
      });
    }

    // Fetch Mandal, Sakha, Booth
    const manSakhaData = await prisma.vddata.findMany({
      where: {
        VID_ID: { in: vidIds },
        ...(manId && { MAN_ID: parseInt(manId) }),
        ...(sakhaId && { SAK_ID: parseInt(sakhaId) }),
        ...(btId && { BT_ID: parseInt(btId) })
      },
      distinct: ['VID_ID', 'MAN_ID', 'SAK_ID', 'BT_ID'],
      select: {
        VID_ID: true,
        MAN_ID: true,
        MAN_NM: true,
        SAK_ID: true,
        SAK_NM: true,
        BT_ID: true,
        BT_NM: true
      }
    });

    // Map Mandal/Sakha/Booth to Vidhan
    const vidToManSakhaMap = new Map<number, any[]>();
    for (const item of manSakhaData) {
      if (!vidToManSakhaMap.has(item.VID_ID!)) {
        vidToManSakhaMap.set(item.VID_ID!, []);
      }
      vidToManSakhaMap.get(item.VID_ID!)!.push(item);
    }

    // Map Vidhan to Lok
    const lokToVidMap = new Map<number, any[]>();
    for (const vid of vidhanData) {
      const enhancedVid = {
        vidId: vid.VID_ID,
        vidName: vid.VID_NM,
        mandales_sakha_booths: vidToManSakhaMap.get(vid.VID_ID!) || []
      };
      if (!lokToVidMap.has(vid.LOK_ID!)) {
        lokToVidMap.set(vid.LOK_ID!, []);
      }
      lokToVidMap.get(vid.LOK_ID!)!.push(enhancedVid);
    }

    // Final structured data
    const finalData = lokDataRaw.map(lok => ({
      clusterId: lok.CLUS_ID,
      lokId: lok.LOK_ID,
      lokName: lok.LOK_NM,
      vidhanSabhas: lokToVidMap.get(lok.LOK_ID!) || []
    }));

    // Summary counts
    const summary = {
      cluster: clusterId ? 1 : finalData.length,
      lokSabha: finalData.length,
      vidhanSabha: vidhanData.length,
      mandal: new Set(manSakhaData.map(m => m.MAN_ID)).size,
      sakha: new Set(manSakhaData.map(m => m.SAK_ID)).size,
      booth: new Set(manSakhaData.map(m => m.BT_ID)).size
    };

    return res.status(200).json({ success: true, summary, data: finalData });

  } catch (error) {
    console.error("Error in getHierarchyData:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};





// export const getHierarchyDataMultiple = async (req: any, res: any) => {
//   try {
//     // 1️⃣ Extract multi-select query params (comma-separated)
//     const parseMultiIds = (param?: string) =>
//       param ? param.split(",").map(id => parseInt(id)) : undefined;

//     const clusterIds = parseMultiIds(req.query.clusterId);
//     const sambhagIds = parseMultiIds(req.query.sambhagId);
//     const jilaIds = parseMultiIds(req.query.jilaId);
//     const lokIdsFilter = parseMultiIds(req.query.lokId);
//     const vidIdsFilter = parseMultiIds(req.query.vidId);
//     const manIdsFilter = parseMultiIds(req.query.manId);
//     const sakIdsFilter = parseMultiIds(req.query.sakhaId);
//     const btIdsFilter = parseMultiIds(req.query.btId);

//     // 2️⃣ Build root filter (Cluster / Sambhag)
//     const rootFilter: any = {};
//     if (clusterIds && clusterIds.length) rootFilter.CLUS_ID = { in: clusterIds };
//     if (sambhagIds && sambhagIds.length) rootFilter.SAMBHAG_ID = { in: sambhagIds };
//     if (jilaIds && jilaIds.length) rootFilter.JILA_ID = { in: jilaIds };

//     // 3️⃣ Fetch unique Lok Sabhas under root
//     const lokDataRaw: any[] = await prisma.cludata.findMany({
//       where: {
//         ...rootFilter,
//         ...(lokIdsFilter && lokIdsFilter.length && { LOK_ID: { in: lokIdsFilter } }),
//       },
//       distinct: ["LOK_ID"],
//       select: {
//         CLUS_ID: true,
//         LOK_ID: true,
//         LOK_NM: true,
//       },
//     });

//     const lokIds = lokDataRaw.map(l => l.LOK_ID);
//     if (lokIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         summary: {
//           cluster: clusterIds ? clusterIds.length : 0,
//           lokSabha: 0,
//           vidhanSabha: 0,
//           mandal: 0,
//           sakha: 0,
//           booth: 0,
//         },
//         data: [],
//       });
//     }

//     // 4️⃣ Fetch Vidhan Sabhas
//     const vidhanData = await prisma.cludata.findMany({
//       where: {
//         LOK_ID: { in: lokIds },
//         ...(vidIdsFilter && vidIdsFilter.length && { VID_ID: { in: vidIdsFilter } }),
//       },
//       distinct: ["VID_ID", "LOK_ID"],
//       select: {
//         LOK_ID: true,
//         VID_ID: true,
//         VID_NM: true,
//       },
//     });

//     const vidIds = vidhanData.map(v => v.VID_ID).filter((id): id is number => id !== null);
//     if (vidIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         summary: {
//           cluster: clusterIds ? clusterIds.length : lokDataRaw.length,
//           lokSabha: lokIds.length,
//           vidhanSabha: 0,
//           mandal: 0,
//           sakha: 0,
//           booth: 0,
//         },
//         data: [],
//       });
//     }

//     // 5️⃣ Fetch Mandal/Sakha/Booth
//     const manSakhaData = await prisma.vddata.findMany({
//       where: {
//         VID_ID: { in: vidIds },
//         ...(manIdsFilter && manIdsFilter.length && { MAN_ID: { in: manIdsFilter } }),
//         ...(sakIdsFilter && sakIdsFilter.length && { SAK_ID: { in: sakIdsFilter } }),
//         ...(btIdsFilter && btIdsFilter.length && { BT_ID: { in: btIdsFilter } }),
//       },
//       distinct: ["VID_ID", "MAN_ID", "SAK_ID", "BT_ID"],
//       select: {
//         VID_ID: true,
//         MAN_ID: true,
//         MAN_NM: true,
//         SAK_ID: true,
//         SAK_NM: true,
//         BT_ID: true,
//         BT_NM: true,
//       },
//     });

//     // 6️⃣ Map Mandal/Sakha/Booth to Vidhan
//     const vidToManSakhaMap = new Map<number, any[]>();
//     for (const item of manSakhaData) {
//       if (!vidToManSakhaMap.has(item.VID_ID!)) vidToManSakhaMap.set(item.VID_ID!, []);
//       vidToManSakhaMap.get(item.VID_ID!)!.push(item);
//     }

//     // 7️⃣ Map Vidhan to Lok
//     const lokToVidMap = new Map<number, any[]>();
//     for (const vid of vidhanData) {
//       const enhancedVid = {
//         vidId: vid.VID_ID,
//         vidName: vid.VID_NM,
//         mandales_sakha_booths: vidToManSakhaMap.get(vid.VID_ID!) || [],
//       };
//       if (!lokToVidMap.has(vid.LOK_ID)) lokToVidMap.set(vid.LOK_ID, []);
//       lokToVidMap.get(vid.LOK_ID)!.push(enhancedVid);
//     }

//     // 8️⃣ Final structured hierarchy
//     const finalData = lokDataRaw.map(lok => ({
//       clusterId: lok.CLUS_ID,
//       lokId: lok.LOK_ID,
//       lokName: lok.LOK_NM,
//       vidhanSabhas: lokToVidMap.get(lok.LOK_ID!) || [],
//     }));

//     // 9️⃣ Summary counts
//     const summary = {
//       cluster: clusterIds ? clusterIds.length : new Set(lokDataRaw.map(d => d.CLUS_ID)).size,
//       lokSabha: finalData.length,
//       vidhanSabha: vidhanData.length,
//       mandal: new Set(manSakhaData.map(m => m.MAN_ID)).size,
//       sakha: new Set(manSakhaData.map(m => m.SAK_ID)).size,
//       booth: new Set(manSakhaData.map(m => m.BT_ID)).size,
//     };

//     return res.status(200).json({ success: true, summary, data: finalData });
//   } catch (error) {
//     console.error("Error in getHierarchyData:", error);
//     res.status(500).json({ success: false, error: "Server Error" });
//   }
// };



// export const getHierarchyDataMultiple = async (req: any, res: any) => {
//   try {
//     // 1️⃣ Extract multi-select query params
//     const parseMultiIds = (param?: string) =>
//       param ? param.split(",").map(id => parseInt(id)) : undefined;

//     const clusterIds = parseMultiIds(req.query.clusterId);
//     const sambhagIds = parseMultiIds(req.query.sambhagId);
//     const jilaIds = parseMultiIds(req.query.jilaId);
//     const lokIdsFilter = parseMultiIds(req.query.lokId);
//     const vidIdsFilter = parseMultiIds(req.query.vidId);
//     const manIdsFilter = parseMultiIds(req.query.manId);
//     const sakIdsFilter = parseMultiIds(req.query.sakhaId);
//     const btIdsFilter = parseMultiIds(req.query.btId);

//     // 2️⃣ Build root filter (Cluster / Sambhag / Jila)
//     const rootFilter: any = {};
//     if (clusterIds && clusterIds.length) rootFilter.CLUS_ID = { in: clusterIds };
//     if (sambhagIds && sambhagIds.length) rootFilter.SAMBHAG_ID = { in: sambhagIds };
//     if (jilaIds && jilaIds.length) rootFilter.JILA_ID = { in: jilaIds };

//     // 3️⃣ Fetch unique Lok Sabhas under root
//     const lokDataRaw: any[] = await prisma.cludata.findMany({
//       where: {
//         ...rootFilter,
//         ...(lokIdsFilter && lokIdsFilter.length && { LOK_ID: { in: lokIdsFilter } }),
//       },
//       distinct: ["LOK_ID"],
//       select: {
//         CLUS_ID: true,
//         LOK_ID: true,
//         LOK_NM: true,
//       },
//     });

//     const lokIds = lokDataRaw.map(l => l.LOK_ID);
//     if (lokIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         summary: {
//           cluster: clusterIds ? clusterIds.length : 0,
//           lokSabha: 0,
//           vidhanSabha: 0,
//           mandal: 0,
//           sakha: 0,
//           booth: 0,
//         },
//         data: [],
//       });
//     }

//     // 4️⃣ Fetch Vidhan Sabhas
//     const vidhanData = await prisma.cludata.findMany({
//       where: {
//         LOK_ID: { in: lokIds },
//         ...(vidIdsFilter && vidIdsFilter.length && { VID_ID: { in: vidIdsFilter } }),
//       },
//       distinct: ["VID_ID", "LOK_ID"],
//       select: {
//         LOK_ID: true,
//         VID_ID: true,
//         VID_NM: true,
//       },
//     });

//     const vidIds = vidhanData.map(v => v.VID_ID).filter((id): id is number => id !== null);
//     if (vidIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         summary: {
//           cluster: clusterIds ? clusterIds.length : lokDataRaw.length,
//           lokSabha: lokIds.length,
//           vidhanSabha: 0,
//           mandal: 0,
//           sakha: 0,
//           booth: 0,
//         },
//         data: [],
//       });
//     }

//     // 5️⃣ Fetch Mandal/Sakha/Booth
//     const manSakhaData = await prisma.vddata.findMany({
//       where: {
//         VID_ID: { in: vidIds },
//         ...(manIdsFilter && manIdsFilter.length && { MAN_ID: { in: manIdsFilter } }),
//         ...(sakIdsFilter && sakIdsFilter.length && { SAK_ID: { in: sakIdsFilter } }),
//         ...(btIdsFilter && btIdsFilter.length && { BT_ID: { in: btIdsFilter } }),
//       },
//       distinct: ["VID_ID", "MAN_ID", "SAK_ID", "BT_ID"],
//       select: {
//         VID_ID: true,
//         MAN_ID: true,
//         MAN_NM: true,
//         SAK_ID: true,
//         SAK_NM: true,
//         BT_ID: true,
//         BT_NM: true,
//       },
//     });

//     // 6️⃣ Build hierarchical mapping for accurate counts
//     const hierarchyMap = new Map<number, Map<number, Map<number, any[]>>>(); 
//     // VID_ID → MAN_ID → SAK_ID → [BT]

//     for (const item of manSakhaData) {
//       if (!hierarchyMap.has(item.VID_ID!)) hierarchyMap.set(item.VID_ID!, new Map());
//       const manMap = hierarchyMap.get(item.VID_ID!)!;
//       if (!manMap.has(item.MAN_ID!)) manMap.set(item.MAN_ID!, new Map());
//       const sakMap = manMap.get(item.MAN_ID!)!;
//       if (!sakMap.has(item.SAK_ID!)) sakMap.set(item.SAK_ID!, []);
//       sakMap.get(item.SAK_ID!)!.push({
//         BT_ID: item.BT_ID,
//         BT_NM: item.BT_NM,
//       });
//     }

//     // 7️⃣ Map Vidhan to Lok with hierarchy
//     const lokToVidMap = new Map<number, any[]>();
//     for (const vid of vidhanData) {
//       const manMap = hierarchyMap.get(vid.VID_ID!)!;
//       const mandales_sakha_booths = Array.from(manMap.entries()).map(([manId, sakMap]) => ({
//         MAN_ID: manId,
//         MAN_NM: manSakhaData.find(m => m.MAN_ID === manId)?.MAN_NM || null,
//         sakhas: Array.from(sakMap.entries()).map(([sakId, booths]) => ({
//           SAK_ID: sakId,
//           SAK_NM: manSakhaData.find(m => m.SAK_ID === sakId)?.SAK_NM || null,
//           booths,
//         })),
//       }));

//       if (!lokToVidMap.has(vid.LOK_ID)) lokToVidMap.set(vid.LOK_ID, []);
//       lokToVidMap.get(vid.LOK_ID)!.push({
//         vidId: vid.VID_ID,
//         vidName: vid.VID_NM,
//         mandales_sakha_booths,
//       });
//     }

//     // 8️⃣ Final structured hierarchy
//     const finalData = lokDataRaw.map(lok => ({
//       clusterId: lok.CLUS_ID,
//       lokId: lok.LOK_ID,
//       lokName: lok.LOK_NM,
//       vidhanSabhas: lokToVidMap.get(lok.LOK_ID!) || [],
//     }));

//     // 9️⃣ Summary counts correctly
//     let totalMandals = 0, totalSakhas = 0, totalBooths = 0;
//     for (const vidMap of lokToVidMap.values()) {
//       for (const vid of vidMap) {
//         totalMandals += vid.mandales_sakha_booths.length;
//         for (const man of vid.mandales_sakha_booths) {
//           totalSakhas += man.sakhas.length;
//           for (const sak of man.sakhas) {
//             totalBooths += sak.booths.length;
//           }
//         }
//       }
//     }

//     const summary = {
//       cluster: clusterIds ? clusterIds.length : new Set(lokDataRaw.map(d => d.CLUS_ID)).size,
//       lokSabha: finalData.length,
//       vidhanSabha: vidhanData.length,
//       mandal: totalMandals,
//       sakha: totalSakhas,
//       booth: totalBooths,
//     };

//     return res.status(200).json({ success: true, summary, data: finalData });
//   } catch (error) {
//     console.error("Error in getHierarchyData:", error);
//     res.status(500).json({ success: false, error: "Server Error" });
//   }
// };



// export const getHierarchyDataMultiple = async (req: any, res: any) => {
//   try {


    
//     // 1️⃣ Extract multi-select query params
//     const parseMultiIds = (param?: string) =>
//       param ? param.split(",").map(id => parseInt(id)) : undefined;

//     const clusterIds = parseMultiIds(req.query.clusterId);
//     const sambhagIds = parseMultiIds(req.query.sambhagId);
//     const jilaIds = parseMultiIds(req.query.jilaId);
//     const lokIdsFilter = parseMultiIds(req.query.lokId);
//     const vidIdsFilter = parseMultiIds(req.query.vidId);
//     const manIdsFilter = parseMultiIds(req.query.manId);
//     const sakIdsFilter = parseMultiIds(req.query.sakhaId);
//     const btIdsFilter = parseMultiIds(req.query.btId);

//     // 2️⃣ Handle Sambhag/Jila filters by querying smdata for derived VID_IDs
//     const smDataWhere: any = {};
//     let vidIdsFromJilaSambhag: number[] = [];

//     if (sambhagIds && sambhagIds.length) {
//       smDataWhere.SAM_ID = { in: sambhagIds }; 
//     }
//     if (jilaIds && jilaIds.length) {
//       smDataWhere.JILA_ID = { in: jilaIds };
//     }

//     if (Object.keys(smDataWhere).length > 0) {
//       const smDataResults = await prisma.smdata.findMany({
//         where: smDataWhere,
//         distinct: ["VID_ID"],
//         select: { VID_ID: true },
//       });
//       vidIdsFromJilaSambhag = smDataResults
//         .map(d => d.VID_ID)
//         .filter((id): id is number => id !== null);
//     }

//     // 3️⃣ Build the final WHERE clause for fetching Lok Sabhas (cludata)
//     const lokDataWhere: any = {};
//     const cludataRootFilters: any[] = [];

//     if (clusterIds && clusterIds.length) {
//       cludataRootFilters.push({ CLUS_ID: { in: clusterIds } });
//     }

//     if (vidIdsFromJilaSambhag.length > 0) {
//       cludataRootFilters.push({ VID_ID: { in: vidIdsFromJilaSambhag } });
//     }

//     if (cludataRootFilters.length > 0) {
//       lokDataWhere.OR = cludataRootFilters;
//     }

//     if (lokIdsFilter && lokIdsFilter.length) {
//       lokDataWhere.LOK_ID = { in: lokIdsFilter };
//     }
    
//     // 4️⃣ Fetch unique Lok Sabhas under the combined root
//     const lokDataRaw: any[] = await prisma.cludata.findMany({
//       where: lokDataWhere,
//       distinct: ["LOK_ID"],
//       select: {
//         CLUS_ID: true,
//         LOK_ID: true,
//         LOK_NM: true,
//       },
//     });

//     const lokIds = lokDataRaw.map(l => l.LOK_ID).filter((id): id is number => id !== null);
//     if (lokIds.length === 0) {
//       const finalClusterCount = new Set(lokDataRaw.map(d => d.CLUS_ID)).size;
//       return res.status(200).json({
//         success: true,
//         summary: {
//           cluster: finalClusterCount,
//           lokSabha: 0,
//           vidhanSabha: 0,
//           mandal: 0,
//           sakha: 0,
//           booth: 0,
//         },
//         data: [],
//       });
//     }

//     // 5️⃣ Fetch Vidhan Sabhas - Must respect LOK filter AND derived VID_ID filter
//     const vidSabhaWhere: any = {
//       LOK_ID: { in: lokIds },
//     };

//     if (vidIdsFromJilaSambhag.length > 0) {
//       vidSabhaWhere.VID_ID = { in: vidIdsFromJilaSambhag };
//     }

//     if (vidIdsFilter && vidIdsFilter.length) {
//       if (vidSabhaWhere.VID_ID) {
//         const existingIds = vidSabhaWhere.VID_ID.in as number[];
//         const intersectionIds = existingIds.filter(id =>
//           vidIdsFilter.includes(id)
//         );
//         vidSabhaWhere.VID_ID = { in: intersectionIds.length > 0 ? intersectionIds : [-1] };
//       } else {
//         vidSabhaWhere.VID_ID = { in: vidIdsFilter };
//       }
//     }

//     const vidhanData = await prisma.cludata.findMany({
//       where: vidSabhaWhere,
//       distinct: ["VID_ID", "LOK_ID"],
//       select: {
//         LOK_ID: true,
//         VID_ID: true,
//         VID_NM: true,
//       },
//     });
    
//     const vidIds = vidhanData.map(v => v.VID_ID).filter((id): id is number => id !== null);
//     if (vidIds.length === 0) {
//       const finalClusterCount = new Set(lokDataRaw.map(d => d.CLUS_ID)).size;
//       return res.status(200).json({
//         success: true,
//         summary: {
//           cluster: finalClusterCount,
//           lokSabha: lokIds.length,
//           vidhanSabha: 0,
//           mandal: 0,
//           sakha: 0,
//           booth: 0,
//         },
//         data: [],
//       });
//     }

//     // 6️⃣ Fetch Mandal/Sakha/Booth (This is where the Man/Sakha filters are applied)
//     const manSakhaData = await prisma.vddata.findMany({
//       where: {
//         VID_ID: { in: vidIds },
//         ...(manIdsFilter && manIdsFilter.length && { MAN_ID: { in: manIdsFilter } }),
//         ...(sakIdsFilter && sakIdsFilter.length && { SAK_ID: { in: sakIdsFilter } }),
//         ...(btIdsFilter && btIdsFilter.length && { BT_ID: { in: btIdsFilter } }),
//       },
//       distinct: ["VID_ID", "MAN_ID", "SAK_ID", "BT_ID"],
//       select: {
//         VID_ID: true,
//         MAN_ID: true,
//         MAN_NM: true,
//         SAK_ID: true,
//         SAK_NM: true,
//         BT_ID: true,
//         BT_NM: true,
//       },
//     });

//     // 7️⃣ Build hierarchical mapping for accurate counts (only using filtered vddata)
//     const hierarchyMap = new Map<number, Map<number, Map<number, any[]>>>(); 
//     // VID_ID → MAN_ID → SAK_ID → [BT]

//     for (const item of manSakhaData) {
//       if (!item.VID_ID || !item.MAN_ID || !item.SAK_ID) continue; 
      
//       if (!hierarchyMap.has(item.VID_ID)) hierarchyMap.set(item.VID_ID, new Map());
//       const manMap = hierarchyMap.get(item.VID_ID)!;
//       if (!manMap.has(item.MAN_ID)) manMap.set(item.MAN_ID, new Map());
//       const sakMap = manMap.get(item.MAN_ID)!;
//       if (!sakMap.has(item.SAK_ID)) sakMap.set(item.SAK_ID, []);
//       sakMap.get(item.SAK_ID)!.push({
//         BT_ID: item.BT_ID,
//         BT_NM: item.BT_NM,
//       });
//     }

//     // 8️⃣ Map Vidhan to Lok with hierarchy (Filtering out empty Vidhan Sabhas)
//     const lokToVidMap = new Map<number, any[]>();
//     for (const vid of vidhanData) {
//       if (!vid.VID_ID || !vid.LOK_ID) continue; 
      
//       const manMap = hierarchyMap.get(vid.VID_ID) || new Map();
//       const mandales_sakha_booths = Array.from(manMap.entries()).map(([manId, sakMap]) => ({
//         MAN_ID: manId,
//         MAN_NM: manSakhaData.find(m => m.MAN_ID === manId && m.VID_ID === vid.VID_ID)?.MAN_NM || null, 
//         sakhas: Array.from(sakMap.entries()).map(([sakId, booths]) => ({
//           SAK_ID: sakId,
//           SAK_NM: manSakhaData.find(m => m.SAK_ID === sakId && m.MAN_ID === manId)?.SAK_NM || null,
//           booths,
//         })),
//       }));

//       // --- FIX: Only include Vidhan Sabhas that contain filtered Mandal/Sakha/Booth data ---
//       if (mandales_sakha_booths.length > 0) {
//         if (!lokToVidMap.has(vid.LOK_ID)) lokToVidMap.set(vid.LOK_ID, []);
//         lokToVidMap.get(vid.LOK_ID)!.push({
//           vidId: vid.VID_ID,
//           vidName: vid.VID_NM,
//           mandales_sakha_booths,
//         });
//       }
//     }

//     // 9️⃣ Final structured hierarchy (Filtering out empty Lok Sabhas)
//     const finalData = lokDataRaw
//       .filter(lok => lokToVidMap.has(lok.LOK_ID!)) // --- FIX: Filter out LOKs with no VIDs after lower-level filtering ---
//       .map(lok => ({
//         clusterId: lok.CLUS_ID,
//         lokId: lok.LOK_ID,
//         lokName: lok.LOK_NM,
//         vidhanSabhas: lokToVidMap.get(lok.LOK_ID!) || [],
//       }));

//     // 🔟 Summary counts correctly
//     let totalMandals = 0, totalSakhas = 0, totalBooths = 0;
    
//     // We iterate over the FINAL, FILTERED hierarchy (finalData/lokToVidMap) for accurate counts.
//     for (const vidMap of lokToVidMap.values()) {
//       for (const vid of vidMap) {
//         totalMandals += vid.mandales_sakha_booths.length;
//         for (const man of vid.mandales_sakha_booths) {
//           totalSakhas += man.sakhas.length;
//           for (const sak of man.sakhas) {
//             totalBooths += sak.booths.length;
//           }
//         }
//       }
//     }

//     const finalClusterCount = new Set(finalData.map(d => d.clusterId)).size;

//     const summary = {
//       cluster: finalClusterCount,
//       lokSabha: finalData.length,
//       // Note: We count VIDs from the final aggregated map, not the raw vidhanData array
//       vidhanSabha: Array.from(lokToVidMap.values()).flat().length, 
//       mandal: totalMandals,
//       sakha: totalSakhas,
//       booth: totalBooths,
//     };

//     return res.status(200).json({ success: true, summary, data: finalData });
//   } catch (error) {
//     console.error("Error in getHierarchyData:", error);
//     res.status(500).json({ success: false, error: "Server Error" });
//   }
// };




// Assuming 'prisma' is initialized and available globally or imported.

// export const getHierarchyDataMultiple = async (req: any, res: any) => {
//   try {
    
//     // 1️⃣ Extract multi-select query params
//     const parseMultiIds = (param?: string | string[]) => {
//       // Robustly handle string, array, and comma-separated string inputs
//       if (Array.isArray(param)) {
//         return param.map(id => parseInt(String(id))).filter(id => !isNaN(id));
//       }
//       return param ? String(param).split(",").map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
//     };

//     const clusterIds = parseMultiIds(req.query.clusterId);
//     const sambhagIds = parseMultiIds(req.query.sambhagId);
//     const jilaIds = parseMultiIds(req.query.jilaId);
//     const lokIdsFilter = parseMultiIds(req.query.lokId);
//     const vidIdsFilter = parseMultiIds(req.query.vidId);
//     const manIdsFilter = parseMultiIds(req.query.manId);
//     const sakIdsFilter = parseMultiIds(req.query.sakhaId);
//     const btIdsFilter = parseMultiIds(req.query.btId);

//     // Identify the deepest level filter that has data
//     const deepestFilterKey = btIdsFilter.length > 0 ? 'btId'
//       : sakIdsFilter.length > 0 ? 'sakhaId'
//       : manIdsFilter.length > 0 ? 'manId'
//       : vidIdsFilter.length > 0 ? 'vidId'
//       : lokIdsFilter.length > 0 ? 'lokId'
//       : jilaIds.length > 0 ? 'jilaId'
//       : sambhagIds.length > 0 ? 'sambhagId'
//       : clusterIds.length > 0 ? 'clusterId'
//       : null;

//     // --- Start Building Hierarchy Root (Vidhan Sabha level and above) ---

//     // 2️⃣ Handle Sambhag/Jila filters (smdata)
//     let vidIdsFromJilaSambhag: number[] = [];
//     const smDataWhere: any = {};
    
//     // Only query smdata if Sambhag or Jila IDs were explicitly selected
//     if (sambhagIds.length || jilaIds.length) {
//         if (sambhagIds.length) smDataWhere.SAM_ID = { in: sambhagIds }; 
//         if (jilaIds.length) smDataWhere.JILA_ID = { in: jilaIds };
        
//         const smDataResults = await prisma.smdata.findMany({
//             where: smDataWhere,
//             distinct: ["VID_ID"],
//             select: { VID_ID: true },
//         });
//         vidIdsFromJilaSambhag = smDataResults
//             .map(d => d.VID_ID)
//             .filter((id): id is number => id !== null);
//     }
    

//     // 3️⃣ Build the final WHERE clause for fetching Lok Sabhas (cludata)
//     const lokDataWhere: any = {};
//     const cludataRootFilters: any[] = [];

//     // Use selected Clusters as one root filter
//     if (clusterIds.length) {
//       cludataRootFilters.push({ CLUS_ID: { in: clusterIds } });
//     }
//     // Use VIDs derived from selected Sambhag/Jila as another root filter
//     if (vidIdsFromJilaSambhag.length > 0) {
//       cludataRootFilters.push({ VID_ID: { in: vidIdsFromJilaSambhag } });
//     }
    
//     if (cludataRootFilters.length > 0) {
//       // Combine Cluster/Sambhag/Jila-derived VIDs with OR logic
//       lokDataWhere.OR = cludataRootFilters;
//     }

//     // Intersect with explicitly selected LOK IDs (AND logic)
//     if (lokIdsFilter.length) {
//       lokDataWhere.LOK_ID = { in: lokIdsFilter };
//     }
    
//     // 4️⃣ Fetch unique Lok Sabhas that match the high-level filters
//     const lokDataRaw: any[] = await prisma.cludata.findMany({
//       where: lokDataWhere,
//       distinct: ["LOK_ID", "CLUS_ID"],
//       select: { CLUS_ID: true, LOK_ID: true, LOK_NM: true },
//     });

//     const lokIds = lokDataRaw.map(l => l.LOK_ID).filter((id): id is number => id !== null);
//     if (lokIds.length === 0) {
//       // Early exit
//       return res.status(200).json({ success: true, summary: { cluster: 0, lokSabha: 0, vidhanSabha: 0, mandal: 0, sakha: 0, booth: 0 }, data: [] });
//     }

//     // 5️⃣ Determine the definitive list of Vidhan Sabhas (`vidIds`) to fetch data for
//     const vidSabhaWhere: any = {
//       LOK_ID: { in: lokIds }, // Start with all VIDs under the resulting LOKs
//     };
    
//     // Apply explicit VID filters, if present
//     if (vidIdsFilter.length > 0) {
//         // Intersect the VIDs from the LOKs with the explicitly selected VIDs
//         vidSabhaWhere.VID_ID = { in: vidIdsFilter };
//     } else if (vidIdsFromJilaSambhag.length > 0) {
//         // Intersect the VIDs from the LOKs with the VIDs derived from Jila/Sambhag
//         vidSabhaWhere.VID_ID = { in: vidIdsFromJilaSambhag };
//     }

//     const vidhanData = await prisma.cludata.findMany({
//       where: vidSabhaWhere,
//       distinct: ["VID_ID", "LOK_ID"],
//       select: { LOK_ID: true, VID_ID: true, VID_NM: true },
//     });
    
//     const vidIds = vidhanData.map(v => v.VID_ID).filter((id): id is number => id !== null);

//     // 6️⃣ FIX: Fetch Mandal/Sakha/Booth (Enforcing Hierarchical Uniqueness)
//     // The query MUST filter by the precise list of VIDs (vidIds) calculated above.
//     // This ensures no Booth data is pulled from a VID that was filtered out by Lok/Vid/Jila/Sambhag logic.
//     const vddataWhere: any = {
//       VID_ID: { in: vidIds.length > 0 ? vidIds : [-1] }, // Use [-1] if empty to prevent fetching all data
//     };

//     // Now, apply the lowest level filter to restrict data within the valid VIDs.
//     if (deepestFilterKey === 'btId' && btIdsFilter.length) {
//       vddataWhere.BT_ID = { in: btIdsFilter };
//     } else if (deepestFilterKey === 'sakhaId' && sakIdsFilter.length) {
//       vddataWhere.SAK_ID = { in: sakIdsFilter };
//     } else if (deepestFilterKey === 'manId' && manIdsFilter.length) {
//       vddataWhere.MAN_ID = { in: manIdsFilter };
//     }

//     // The combination of VID_ID filter and MAN/SAK/BT filter enforces the uniqueness you need.
//     const manSakhaData = await prisma.vddata.findMany({
//       where: vddataWhere,
//       // We still use DISTINCT on the composite hierarchy keys for accurate counting later
//       distinct: ["VID_ID", "MAN_ID", "SAK_ID", "BT_ID"], 
//       select: {
//         VID_ID: true, MAN_ID: true, MAN_NM: true, SAK_ID: true, SAK_NM: true, BT_ID: true, BT_NM: true,
//       },
//     });

//     // 7️⃣ Build hierarchical mapping and calculate accurate counts
//     const hierarchyMap = new Map<number, Map<number, Map<number, any[]>>>(); // VID_ID → MAN_ID → SAK_ID → [BT]
//     const uniqueMandals = new Set<number>();
//     const uniqueSakhas = new Set<number>();
//     const uniqueBooths = new Set<number>();
//     const finalVidhanSabhas = new Set<number>(); 
    
//     // To ensure unique counts even if the IDs (like MAN_ID) aren't globally unique:
//     const uniqueMandalKeys = new Set<string>(); // VID_ID-MAN_ID
//     const uniqueSakhaKeys = new Set<string>();  // VID_ID-MAN_ID-SAK_ID
//     const uniqueBoothKeys = new Set<string>();  // VID_ID-MAN_ID-SAK_ID-BT_ID

//     for (const item of manSakhaData) {
//       if (!item.VID_ID || !item.MAN_ID || !item.SAK_ID || !item.BT_ID) continue; 
      
//       uniqueMandalKeys.add(`${item.VID_ID!}-${item.MAN_ID!}`);
//       uniqueSakhaKeys.add(`${item.VID_ID!}-${item.MAN_ID!}-${item.SAK_ID!}`);
//       uniqueBoothKeys.add(`${item.VID_ID!}-${item.MAN_ID!}-${item.SAK_ID!}-${item.BT_ID!}`);
//       finalVidhanSabhas.add(item.VID_ID!);
      
//       // ... (rest of the mapping logic for finalData structure) ...
//       if (!hierarchyMap.has(item.VID_ID)) hierarchyMap.set(item.VID_ID, new Map());
//       const manMap = hierarchyMap.get(item.VID_ID)!;
//       if (!manMap.has(item.MAN_ID)) manMap.set(item.MAN_ID, new Map());
//       const sakMap = manMap.get(item.MAN_ID)!;
//       if (!sakMap.has(item.SAK_ID)) sakMap.set(item.SAK_ID, []);
//       sakMap.get(item.SAK_ID)!.push({ BT_ID: item.BT_ID, BT_NM: item.BT_NM });
//     }

//     // 8️⃣ Map Vidhan to Lok and build final structure (filtering LOKs/VIDs that resulted in no data)
//     const lokToVidMap = new Map<number, any[]>();
//     for (const vid of vidhanData) {
//         if (!finalVidhanSabhas.has(vid.VID_ID!)) continue; // Filter out VIDs that yielded no booth data

//         // ... (mapping logic unchanged from previous response) ...
//         const manMap = hierarchyMap.get(vid.VID_ID!) || new Map();
//         const mandales_sakha_booths = Array.from(manMap.entries()).map(([manId, sakMap]: [any, any]) => ({
//             MAN_ID: manId,
//             MAN_NM: manSakhaData.find(m => m.MAN_ID === manId && m.VID_ID === vid.VID_ID)?.MAN_NM || null, 
//             sakhas: Array.from(sakMap.entries()).map((entry: any) => {
//                 const [sakId, booths] = entry;
//                 return {
//                     SAK_ID: sakId,
//                     SAK_NM: manSakhaData.find(m => m.SAK_ID === sakId && m.MAN_ID === manId)?.SAK_NM || null,
//                     booths,
//                 };
//             }),
//         })).filter(man => man.sakhas.length > 0); // Remove Mandals with no Sakha/Booths

//         if (mandales_sakha_booths.length > 0) {
//             if (!lokToVidMap.has(vid.LOK_ID!)) lokToVidMap.set(vid.LOK_ID!, []);
//             lokToVidMap.get(vid.LOK_ID!)!.push({ vidId: vid.VID_ID!, vidName: vid.VID_NM, mandales_sakha_booths });
//         }
//     }
    
//     // Final structure
//     const finalData = lokDataRaw
//       .filter(lok => lokToVidMap.has(lok.LOK_ID!))
//       .map(lok => ({
//         clusterId: lok.CLUS_ID,
//         lokId: lok.LOK_ID,
//         lokName: lok.LOK_NM,
//         vidhanSabhas: lokToVidMap.get(lok.LOK_ID!) || [],
//       }));


//     // 9️⃣ Summary counts using the composite keys for absolute uniqueness
//     const finalLokSabhas = new Set(finalData.map(d => d.lokId)).size;
//     const finalClusterCount = new Set(finalData.map(d => d.clusterId)).size;
    
//     let finalSambhagCount = 0;
//     let finalJilaCount = 0;

//     if (finalVidhanSabhas.size > 0) {
//       const finalSmData = await prisma.smdata.findMany({
//         where: { VID_ID: { in: Array.from(finalVidhanSabhas) } },
//         select: { SAM_ID: true, JILA_ID: true },
//         distinct: ['SAM_ID', 'JILA_ID']
//       });
//       finalSambhagCount = new Set(finalSmData.map(d => d.SAM_ID)).size;
//       finalJilaCount = new Set(finalSmData.map(d => d.JILA_ID)).size;
//     }

//     const summary = {
//       cluster: finalClusterCount,
//       sambhag: finalSambhagCount,
//       jila: finalJilaCount,
//       lokSabha: finalLokSabhas,
//       vidhanSabha: finalVidhanSabhas.size,
//       mandal: uniqueMandalKeys.size, // Count based on VID-MAN combination
//       sakha: uniqueSakhaKeys.size,   // Count based on VID-MAN-SAK combination
//       booth: uniqueBoothKeys.size,   // Count based on VID-MAN-SAK-BT combination
//     };

//     return res.status(200).json({ success: true, summary, data: finalData });
//   } catch (error) {
//     console.error("Error in getHierarchyData:", error);
//     res.status(500).json({ success: false, error: "Server Error" });
//   }
// };






const generateHierarchyCacheKey = (query: any): string => {
    // Define the specific parameters used for filtering
    const filterKeys = ['clusterId', 'sambhagId', 'jilaId', 'lokId', 'vidId', 'manId', 'sakhaId', 'btId'];
    
    const relevantFilters: { [key: string]: string } = {};
    
    // 1. Extract and standardize (sort) relevant filter values
    for (const key of filterKeys) {
        if (query[key]) {
            // Convert to array/string, sort, and join for a consistent value string
            const value = Array.isArray(query[key]) 
                ? [...query[key]].sort().join(',') 
                : String(query[key]).split(',').sort().join(',');

            if (value.length > 0) {
                relevantFilters[key] = value;
            }
        }
    }

    // 2. Create a stable key by combining filter names and values in sorted order
    const sortedFilterKeys = Object.keys(relevantFilters).sort();
    const keyParts = sortedFilterKeys.map(key => `${key}:${relevantFilters[key]}`);
    
    // Return the final prefixed key
    return `hierarchy:multiple:${keyParts.join('|')}`;
};



export const getHierarchyDataMultiple = async (req: any, res: any) => {
  try {


    const cacheKey = generateHierarchyCacheKey(req.query);
        const CACHE_TTL = 3600; // 1 hour TTL
        
        // 1. Check cache
        const cachedData = await redisCacheService.get(cacheKey);
        
        if (cachedData) {
            return res.status(200).json({ 
                success: true, 
                cached: true, 
                ...cachedData 
            });
        }
    
    // 1️⃣ Extract multi-select query params
    const parseMultiIds = (param?: string | string[]) => {
      // Robustly handle string, array, and comma-separated string inputs
      if (Array.isArray(param)) {
        return param.map(id => parseInt(String(id))).filter(id => !isNaN(id));
      }
      return param ? String(param).split(",").map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    };

    const clusterIds = parseMultiIds(req.query.clusterId);
    const sambhagIds = parseMultiIds(req.query.sambhagId);
    const jilaIds = parseMultiIds(req.query.jilaId);
    const lokIdsFilter = parseMultiIds(req.query.lokId);
    const vidIdsFilter = parseMultiIds(req.query.vidId);
    const manIdsFilter = parseMultiIds(req.query.manId);
    const sakIdsFilter = parseMultiIds(req.query.sakhaId);
    const btIdsFilter = parseMultiIds(req.query.btId);

    // Identify the deepest level filter that has data
    const deepestFilterKey = btIdsFilter.length > 0 ? 'btId'
      : sakIdsFilter.length > 0 ? 'sakhaId'
      : manIdsFilter.length > 0 ? 'manId'
      : vidIdsFilter.length > 0 ? 'vidId'
      : lokIdsFilter.length > 0 ? 'lokId'
      : jilaIds.length > 0 ? 'jilaId'
      : sambhagIds.length > 0 ? 'sambhagId'
      : clusterIds.length > 0 ? 'clusterId'
      : null;

    // --- Start Building Hierarchy Root (Vidhan Sabha level and above) ---

    // 2️⃣ Handle Sambhag/Jila filters (smdata)
    let vidIdsFromJilaSambhag: number[] = [];
    const smDataWhere: any = {};
    
    // Only query smdata if Sambhag or Jila IDs were explicitly selected
    if (sambhagIds.length || jilaIds.length) {
        if (sambhagIds.length) smDataWhere.SAM_ID = { in: sambhagIds }; 
        if (jilaIds.length) smDataWhere.JILA_ID = { in: jilaIds };
        
        const smDataResults = await prisma.smdata.findMany({
            where: smDataWhere,
            distinct: ["VID_ID"],
            select: { VID_ID: true },
        });
        vidIdsFromJilaSambhag = smDataResults
            .map(d => d.VID_ID)
            .filter((id): id is number => id !== null);
    }
    

    // 3️⃣ Build the final WHERE clause for fetching Lok Sabhas (cludata)
    const lokDataWhere: any = {};
    const cludataRootFilters: any[] = [];

    // Use selected Clusters as one root filter
    if (clusterIds.length) {
      cludataRootFilters.push({ CLUS_ID: { in: clusterIds } });
    }
    // Use VIDs derived from selected Sambhag/Jila as another root filter
    if (vidIdsFromJilaSambhag.length > 0) {
      cludataRootFilters.push({ VID_ID: { in: vidIdsFromJilaSambhag } });
    }
    
    if (cludataRootFilters.length > 0) {
      // Combine Cluster/Sambhag/Jila-derived VIDs with OR logic
      lokDataWhere.OR = cludataRootFilters;
    }

    // Intersect with explicitly selected LOK IDs (AND logic)
    if (lokIdsFilter.length) {
      lokDataWhere.LOK_ID = { in: lokIdsFilter };
    }
    
    // 4️⃣ Fetch unique Lok Sabhas that match the high-level filters
    const lokDataRaw: any[] = await prisma.cludata.findMany({
      where: lokDataWhere,
      distinct: ["LOK_ID", "CLUS_ID"],
      select: { CLUS_ID: true, LOK_ID: true, LOK_NM: true },
    });

    const lokIds = lokDataRaw.map(l => l.LOK_ID).filter((id): id is number => id !== null);
    if (lokIds.length === 0) {
      // Early exit
      return res.status(200).json({ success: true, summary: { cluster: 0, lokSabha: 0, vidhanSabha: 0, mandal: 0, sakha: 0, booth: 0 }, data: [] });
    }

    // 5️⃣ Determine the definitive list of Vidhan Sabhas (`vidIds`) to fetch data for
    const vidSabhaWhere: any = {
      LOK_ID: { in: lokIds }, // Start with all VIDs under the resulting LOKs
    };
    
    // Apply explicit VID filters, if present
    if (vidIdsFilter.length > 0) {
        // Intersect the VIDs from the LOKs with the explicitly selected VIDs
        vidSabhaWhere.VID_ID = { in: vidIdsFilter };
    } else if (vidIdsFromJilaSambhag.length > 0) {
        // Intersect the VIDs from the LOKs with the VIDs derived from Jila/Sambhag
        vidSabhaWhere.VID_ID = { in: vidIdsFromJilaSambhag };
    }

    const vidhanData = await prisma.cludata.findMany({
      where: vidSabhaWhere,
      distinct: ["VID_ID", "LOK_ID"],
      select: { LOK_ID: true, VID_ID: true, VID_NM: true },
    });
    
    const vidIds = vidhanData.map(v => v.VID_ID).filter((id): id is number => id !== null);

    // 6️⃣ FIX: Fetch Mandal/Sakha/Booth (Enforcing Hierarchical Uniqueness)
    // The query MUST filter by the precise list of VIDs (vidIds) calculated above.
    // This ensures no Booth data is pulled from a VID that was filtered out by Lok/Vid/Jila/Sambhag logic.
    const vddataWhere: any = {
      VID_ID: { in: vidIds.length > 0 ? vidIds : [-1] }, // Use [-1] if empty to prevent fetching all data
    };

    // Now, apply the lowest level filter to restrict data within the valid VIDs.
    if (deepestFilterKey === 'btId' && btIdsFilter.length) {
      vddataWhere.BT_ID = { in: btIdsFilter };
    } else if (deepestFilterKey === 'sakhaId' && sakIdsFilter.length) {
      vddataWhere.SAK_ID = { in: sakIdsFilter };
    } else if (deepestFilterKey === 'manId' && manIdsFilter.length) {
      vddataWhere.MAN_ID = { in: manIdsFilter };
    }

    // The combination of VID_ID filter and MAN/SAK/BT filter enforces the uniqueness you need.
    const manSakhaData = await prisma.vddata.findMany({
      where: vddataWhere,
      // We still use DISTINCT on the composite hierarchy keys for accurate counting later
      distinct: ["VID_ID", "MAN_ID", "SAK_ID", "BT_ID"], 
      select: {
        VID_ID: true, MAN_ID: true, MAN_NM: true, SAK_ID: true, SAK_NM: true, BT_ID: true, BT_NM: true,
      },
    });

    // 7️⃣ Build hierarchical mapping and calculate accurate counts
    const hierarchyMap = new Map<number, Map<number, Map<number, any[]>>>(); // VID_ID → MAN_ID → SAK_ID → [BT]
    const uniqueMandals = new Set<number>();
    const uniqueSakhas = new Set<number>();
    const uniqueBooths = new Set<number>();
    const finalVidhanSabhas = new Set<number>(); 
    
    // To ensure unique counts even if the IDs (like MAN_ID) aren't globally unique:
    const uniqueMandalKeys = new Set<string>(); // VID_ID-MAN_ID
    const uniqueSakhaKeys = new Set<string>();  // VID_ID-MAN_ID-SAK_ID
    const uniqueBoothKeys = new Set<string>();  // VID_ID-MAN_ID-SAK_ID-BT_ID

    for (const item of manSakhaData) {
      if (!item.VID_ID || !item.MAN_ID || !item.SAK_ID || !item.BT_ID) continue; 
      
      uniqueMandalKeys.add(`${item.VID_ID!}-${item.MAN_ID!}`);
      uniqueSakhaKeys.add(`${item.VID_ID!}-${item.MAN_ID!}-${item.SAK_ID!}`);
      uniqueBoothKeys.add(`${item.VID_ID!}-${item.MAN_ID!}-${item.SAK_ID!}-${item.BT_ID!}`);
      finalVidhanSabhas.add(item.VID_ID!);
      
      // ... (rest of the mapping logic for finalData structure) ...
      if (!hierarchyMap.has(item.VID_ID)) hierarchyMap.set(item.VID_ID, new Map());
      const manMap = hierarchyMap.get(item.VID_ID)!;
      if (!manMap.has(item.MAN_ID)) manMap.set(item.MAN_ID, new Map());
      const sakMap = manMap.get(item.MAN_ID)!;
      if (!sakMap.has(item.SAK_ID)) sakMap.set(item.SAK_ID, []);
      sakMap.get(item.SAK_ID)!.push({ BT_ID: item.BT_ID, BT_NM: item.BT_NM });
    }

    // 8️⃣ Map Vidhan to Lok and build final structure (filtering LOKs/VIDs that resulted in no data)
    const lokToVidMap = new Map<number, any[]>();
    for (const vid of vidhanData) {
        if (!finalVidhanSabhas.has(vid.VID_ID!)) continue; // Filter out VIDs that yielded no booth data

        // ... (mapping logic unchanged from previous response) ...
        const manMap = hierarchyMap.get(vid.VID_ID!) || new Map();
        const mandales_sakha_booths = Array.from(manMap.entries()).map(([manId, sakMap]: [any, any]) => ({
            MAN_ID: manId,
            MAN_NM: manSakhaData.find(m => m.MAN_ID === manId && m.VID_ID === vid.VID_ID)?.MAN_NM || null, 
            sakhas: Array.from(sakMap.entries()).map((entry: any) => {
                const [sakId, booths] = entry;
                return {
                    SAK_ID: sakId,
                    SAK_NM: manSakhaData.find(m => m.SAK_ID === sakId && m.MAN_ID === manId)?.SAK_NM || null,
                    booths,
                };
            }),
        })).filter(man => man.sakhas.length > 0); // Remove Mandals with no Sakha/Booths

        if (mandales_sakha_booths.length > 0) {
            if (!lokToVidMap.has(vid.LOK_ID!)) lokToVidMap.set(vid.LOK_ID!, []);
            lokToVidMap.get(vid.LOK_ID!)!.push({ vidId: vid.VID_ID!, vidName: vid.VID_NM, mandales_sakha_booths });
        }
    }
    
    // Final structure
    const finalData = lokDataRaw
      .filter(lok => lokToVidMap.has(lok.LOK_ID!))
      .map(lok => ({
        clusterId: lok.CLUS_ID,
        lokId: lok.LOK_ID,
        lokName: lok.LOK_NM,
        vidhanSabhas: lokToVidMap.get(lok.LOK_ID!) || [],
      }));


    // 9️⃣ Summary counts using the composite keys for absolute uniqueness
    const finalLokSabhas = new Set(finalData.map(d => d.lokId)).size;
    const finalClusterCount = new Set(finalData.map(d => d.clusterId)).size;
    
    let finalSambhagCount = 0;
    let finalJilaCount = 0;

    if (finalVidhanSabhas.size > 0) {
      const finalSmData = await prisma.smdata.findMany({
        where: { VID_ID: { in: Array.from(finalVidhanSabhas) } },
        select: { SAM_ID: true, JILA_ID: true },
        distinct: ['SAM_ID', 'JILA_ID']
      });
      finalSambhagCount = new Set(finalSmData.map(d => d.SAM_ID)).size;
      finalJilaCount = new Set(finalSmData.map(d => d.JILA_ID)).size;
    }

    const summary = {
      cluster: finalClusterCount,
      sambhag: finalSambhagCount,
      jila: finalJilaCount,
      lokSabha: finalLokSabhas,
      vidhanSabha: finalVidhanSabhas.size,
      mandal: uniqueMandalKeys.size, // Count based on VID-MAN combination
      sakha: uniqueSakhaKeys.size,   // Count based on VID-MAN-SAK combination
      booth: uniqueBoothKeys.size,   // Count based on VID-MAN-SAK-BT combination
    };

    // return res.status(200).json({ success: true, summary, data: finalData });

    const responsePayload = {
            summary,
            data: finalData,
        };

        // 2. Cache the result 
        await redisCacheService.set(cacheKey, responsePayload, CACHE_TTL);

        return res.status(200).json({ success: true, cached: false, ...responsePayload });
  } catch (error) {
    console.error("Error in getHierarchyData:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};