
import axios from "axios";
import { Request, Response } from "express";
import prisma from "../prisma.js";
import { C_COLUMNS, AVG_FIELDS, selectBlockC } from "../utils/prisma/selectc.js";
import { bla_flag_enum } from "@prisma/client";
type BlockType = "R" | "U";


interface BoothUpdatePayload {
  bla2_name?: string;
  bla2_mobile_no?: string;
  slr_per?: number | string; // Allows number or string from client
  isBla2?: string;
}

/* ---------- 1. All Districts ---------- */
export const getAllDistricts = async (_: Request, res: Response) => {
  try {
    const districts = await prisma.district_vandan.findMany({
      select: { district_id: true, district_name: true },
      orderBy: { district_name: "asc" },
    });
    res.json({ success: true, data: districts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 2. Districts by Type ---------- */
export const getDistrictsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params as { type: BlockType };
    if (!["R", "U"].includes(type))
      return res.status(400).json({ success: false, message: "Invalid type" });

    const districts = await prisma.district_vandan.findMany({
      where: { 
        districtblockmap_vandan: { 
          some: { 
            block_vd_vandan: { Block_Type: type } 
          } 
        } 
      },
      select: {
        district_id: true,
        district_name: true,
        districtblockmap_vandan: {
          select: {
            block_vd_vandan: { 
              select: { bolck_Id: true, block_name: true, Block_Type: true } 
            },
          },
        },
      },
    });
    res.json({ success: true, data: districts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 3. District Meta (dropdown) ---------- */
export const getDistrictMeta = async (req: Request, res: Response) => {
  try {
    const districtId = Number(req.params.id);
    const district = await prisma.district_vandan.findUnique({
      where: { district_id: districtId },
      select: {
        district_id: true,
        district_name: true,
        districtblockmap_vandan: {
          select: { 
            block_vd_vandan: { 
              select: { bolck_Id: true, block_name: true, Block_Type: true } 
            } 
          },
        },
      },
    });

    if (!district) return res.status(404).json({ success: false, message: "Not found" });

    const blocks = district.districtblockmap_vandan.map((m: any) => m.block_vd_vandan);
    res.json({ success: true, data: { ...district, blocks } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------- 4. Single Block ---------- */
export const getBlockById = async (req: Request, res: Response) => {
  try {
    const blockId = Number(req.params.id);
    const block = await prisma.block_vd_vandan.findUnique({
      where: { bolck_Id: blockId },
      select: selectBlockC(),
    });

    if (!block) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: block });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ---------- 6. Combined R+U Block Report ---------- */
export const getCombinedBlockReport = async (req: Request, res: Response) => {
  try {
    const { blockName, districtId } = req.body;
    if (!blockName || !districtId)
      return res.status(400).json({ success: false, message: "blockName & districtId required" });

    const clean = blockName.trim();

    const blocks = await prisma.block_vd_vandan.findMany({
      where: {
        block_name: { contains: clean }, // Case-insensitive search for better matching
        Block_Type: { in: ["R", "U"] },
        districtblockmap_vandan: { some: { districtId: Number(districtId) } },
      },
      select: selectBlockC(),
    });

    // console.log("Combining blocks:", blocks.map(b => ({ name: b.block_name, type: b.Block_Type })));

    if (!blocks.length)
      return res.status(404).json({ success: false, message: "Block not found" });

    // Initialize combined object with zeros for all c fields
    const combined: any = {
      bolck_Id: null,
      block_name: `${clean} R+U`,
      Block_Type: "R/U",
    };

    // Dynamically get c field keys from first block (assuming consistent schema)
    const cFields = Object.keys(blocks[0]).filter(key => key.startsWith('c'));
    cFields.forEach(field => {
      combined[field] = 0;
    });

    // Single pass per block to sum all fields (O(n * m) where m=83, n small)
    for (const block of blocks) {
      for (const field of cFields) {
        combined[field] += Number((block as any)[field]) || 0;
      }
    }

    // Return only the combined sum data as object
    res.json({ success: true, data: combined });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


interface DistrictReport {
  district_name: string;
  type: "ALL" | "R" | "U";
  blockCount: number;
  data: Record<string, number>;
}

export const getDistrictCombinedReport = async (req: Request, res: Response) => {
  try {
    const districtId = Number(req.params.id);
    const { type = "ALL" } = req.query as { type?: "ALL" | "R" | "U" };

    // Validate type
    if (!["ALL", "R", "U"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be one of: ALL, R, U",
      });
    }

    // Build the filter dynamically
    const blockFilter: any =
      type === "ALL"
        ? {}
        : {
          block_vd_vandan: {
            Block_Type: type, // either 'R' or 'U'
          },
        };

    // Query with optimized selection: only fetch necessary fields for block_vd to reduce payload
    const districtData = await prisma.district_vandan.findUnique({
      where: { district_id: districtId },
      include: {
        districtblockmap_vandan: {
          where: blockFilter,
          include: {
            block_vd_vandan: {
              select: {
                bolck_Id: true,
                block_name: true,
                c1: true, c2: true, c3: true, c4: true, c5: true, c6: true, c7: true, c8: true, c9: true, c10: true,
                c11: true, c12: true, c13: true, c14: true, c15: true, c16: true, c17: true, c18: true, c19: true, c20: true,
                c21: true, c22: true, c23: true, c24: true, c25: true, c26: true, c27: true, c28: true, c29: true, c30: true,
                c31: true, c32: true, c33: true, c34: true, c35: true, c36: true, c37: true, c38: true, c39: true, c40: true,
                c41: true, c42: true, c43: true, c44: true, c45: true, c46: true, c47: true, c48: true, c49: true, c50: true,
                c51: true, c52: true, c53: true, c54: true, c55: true, c56: true, c57: true, c58: true, c59: true, c60: true,
                c61: true, c62: true, c63: true, c64: true, c65: true, c66: true, c67: true, c68: true, c69: true, c70: true,
                c71: true, c72: true, c73: true, c74: true, c75: true, c76: true, c77: true, c78: true, c79: true, c80: true,
                c81: true, c82: true, c83: true, c84: true,
              },
            },
          },
        },
      },
    });

    // Handle not found
    if (!districtData) {
      return res
        .status(404)
        .json({ success: false, message: "District not found" });
    }

    // Extract blocks
    const blocks = districtData.districtblockmap_vandan.map((b: any) => b.block_vd_vandan);

    // Predefine cFields for robustness (avoids error if no blocks; based on schema up to c84)
    const cFields = Array.from({ length: 84 }, (_, i) => `c${i + 1}`);

    // Build report data using reduce for efficient summation
    const dataSums: Record<string, number> = {};
    cFields.forEach((field) => {
      dataSums[field] = blocks.reduce((sum: number, block: any) => sum + (block[field as keyof typeof block] ?? 0), 0);
    });

    const report: DistrictReport = {
      district_name: districtData.district_name,
      type,
      blockCount: blocks.length,
      data: dataSums,
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (e) {
    console.error("getDistrictCombinedReport error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};






export const updateDistrictMap = async (req: Request, res: Response) => {


const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN || "YOUR_NEW_TOKEN_HERE";
  const DATAWRAPPER_CHART_ID = process.env.DISTRICT_MAP_ID || "YOUR_CHART_ID_HERE";
  
  try {
    const {data}=req.body;
    // console.log("data",data);
    if(!data){
      return res.json({
        message:"data not found"
      })
    }

    if(data.length<=0){
      return res.status(404).json({
           succes:false,
           message:"data not found"
      })
    }
   

    for (const d of data) {
      
 const updateRes=  await prisma.district_map_data_vandan.updateMany({
    where: {district_name: d.district}, 
    data: {
      district_name: d.district,
      district_value: parseInt(d.value,10),
    },
  });
  console.log(`Updated district ${d.district} with value ${d.value}`);
  console.log("count of update district map data  ",updateRes)
}

    
    // Convert to CSV
    let csv = "District,Value\n" + data.map((d: any) => `${d.district},${d.value}`).join("\n");

    console.log("Generated CSV:\n", csv);

    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          "Content-Type": "text/csv",
        },
      }
    );

    // console.log("Datawrapper upload status:", updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error("Upload failed:", updateRes.status, updateRes.data);
      throw new Error("Failed to upload chart data");
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    // console.log("Publish response:", publishRes.status);
    if (publishRes.status !== 200) {
      console.error("Error publishing chart:", publishRes.status, publishRes.data);
      throw new Error("Failed to publish chart");
    }

    res.json({ success: true, message: "Datawrapper chart updated successfully" });
  } catch (error: any) {
    console.error("Error updating the district map chart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }

}


export const updateVidhanSabhaMap = async (req: Request, res: Response) =>{
const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN || "YOUR_NEW_TOKEN_HERE";
  const DATAWRAPPER_CHART_ID = process.env.VIDHANSABHA_MAP_ID || "YOUR_CHART_ID_HERE";
  
  try {
    const {data}=req.body;
    // console.log("data",data);
    if(!data){
      return res.json({
        message:"data not found"
      })
    }

    if(data.length<=0){
      return res.status(404).json({
           succes:false,
           message:"data not found"
      })
    }
   


    for (const d of data) {
 const updateRes=  await prisma.assembly_map_data_vandan.updateMany({
    where: {assembly_name: d.assembly}, 
    data: {
      assembly_name: d.assembly,
      assembly_value: parseInt(d.value,10),
    },
  });
  // console.log(`Updated assembly ${d.assembly} with value ${d.value}`);
  // console.log("count of update assembly map data  ",updateRes)
}

    
    // Convert to CSV
    let csv = "Assembly_name,Assembly_value\n" + data.map((d: any) => `${d.assembly},${d.value}`).join("\n");

    // console.log("Generated CSV:\n", csv);

    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          "Content-Type": "text/csv",
        },
      }
    );

    // console.log("Datawrapper upload status:", updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error("Upload failed:", updateRes.status, updateRes.data);
      throw new Error("Failed to upload chart data");
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    // console.log("Publish response:", publishRes.status);
    if (publishRes.status !== 200) {
      console.error("Error publishing chart:", publishRes.status, publishRes.data);
      throw new Error("Failed to publish chart");
    }

    res.json({ success: true, message: "Assembly Map updated successfully" });
  } catch (error: any) {
    console.error("Error updating Assembly Map ", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }

}

export const updateLokSabhaMap = async (req: Request, res: Response) =>{
const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN || "YOUR_NEW_TOKEN_HERE";
  const DATAWRAPPER_CHART_ID = process.env.LOKSABHA_MAP_ID || "YOUR_CHART_ID_HERE";
  
  try {
    const {data}=req.body;
    // console.log("data",data);
    if(!data){
      return res.json({
        message:"data not found"
      })
    }

    if(data.length<=0){
      return res.status(404).json({
           succes:false,
           message:"data not found"
      })
    }
   


    for (const d of data) {
 const updateRes=  await prisma.loksabha_map_data_vandan.updateMany({
    where: {lokSabha_name: d.constituency_name}, 
    data: {
      lokSabha_name: d.constituency_name,
      lokSabha_value: parseInt(d.value,10),
    },
  });
  // console.log(`Updated assembly ${d.constituency_name} with value ${d.value}`);
  // console.log("count of update assembly map data  ",updateRes)
}

    
    // Convert to CSV
    let csv = "LokSabha_name,LokSabha_value\n" + data.map((d: any) => `${d.constituency_name},${d.value}`).join("\n");

    // console.log("Generated CSV:\n", csv);

    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          "Content-Type": "text/csv",
        },
      }
    );

    // console.log("Datawrapper upload status:", updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error("Upload failed:", updateRes.status, updateRes.data);
      throw new Error("Failed to upload chart data");
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    // console.log("Publish response:", publishRes.status);
    if (publishRes.status !== 200) {
      console.error("Error publishing chart:", publishRes.status, publishRes.data);
      throw new Error("Failed to publish chart");
    }

    res.json({ success: true, message: "Assembly Map updated successfully" });
  } catch (error: any) {
    console.error("Error updating Assembly Map ", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }

}


export const createDistrictMaps = async (req: any, res: any) => {
  try {
    const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN;
    const DATAWRAPPER_CHART_ID = process.env.DATAWRAPPER_CHART_ID;

    if (!DATAWRAPPER_API_TOKEN || !DATAWRAPPER_CHART_ID) {
      throw new Error('Missing required environment variables: DATAWRAPPER_API_TOKEN or DATAWRAPPER_CHART_ID');
    }

    const { mapsData } = req.body;

    if (!mapsData || !Array.isArray(mapsData) || mapsData.length === 0) {
      return res.status(400).json({ success: false, message: 'mapsData must be a non-empty array' });
    }

    // Basic validation: each item should have District and Value
    const invalidItems = mapsData.filter((d: any) => !d.District || typeof d.Value !== 'number');
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid data in mapsData: ${invalidItems.length} items missing District or Value` 
      });
    }

    // Optional: Lookup or generate district_id (example: assume you have a districts table)
    // const districts = await prisma.district.findMany({ where: { name: { in: mapsData.map(d => d.District) } }});
    // Then map district_id from lookup...

    const prismaData = mapsData.map((d: any) => ({
     district_id: d.district_id,
      district_name: d.District,
      district_value: d.Value,
    }));

    const dbResult = await prisma.district_map_data_vandan.createMany({
      data: prismaData,
    });

    if (dbResult.count === 0) {
      throw new Error('No records were created in the database');
    }

    // Generate CSV from input data (matches structure)
    const csv = 'District,Value\n' + mapsData.map((d: any) => `${d.District},${d.Value}`).join('\n');
    // console.log('Generated CSV:\n', csv);

    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          'Content-Type': 'text/csv',
        },
      }
    );

    // console.log('Datawrapper upload status:', updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error('Upload failed:', updateRes.status, updateRes.data);
      throw new Error(`Failed to upload chart data: ${updateRes.status}`);
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    // console.log('Publish response:', publishRes.status);
    if (publishRes.status !== 200) {
      console.error('Error publishing chart:', publishRes.status, publishRes.data);
      throw new Error(`Failed to publish chart: ${publishRes.status}`);
    }

    res.json({ 
      success: true, 
      message: 'District map created successfully',
      details: { createdCount: dbResult.count }
    });

  } catch (error: any) {
    console.error('Error in createDistrictMaps:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  } finally {
    // Optional: Disconnect Prisma if in a long-lived app
    // await prisma.$disconnect();
  }
};


export const getDistrictMapData = async (req: any, res: any) => {
  try {
    const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN;
    const DATAWRAPPER_CHART_ID = process.env.DISTRICT_MAP_ID;

    if (!DATAWRAPPER_API_TOKEN || !DATAWRAPPER_CHART_ID) {
      throw new Error('Missing required environment variables: DATAWRAPPER_API_TOKEN or DATAWRAPPER_CHART_ID');
    }



    const data = await prisma.district_map_data_vandan.findMany({

    });

    // Generate CSV from input data (matches structure)
    const csv = 'District,Value\n' + data.map((d: any) => `${d.district_name},${d.district_value}`).join('\n');
    // console.log('Generated CSV:\n', csv);


    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          'Content-Type': 'text/csv',
        },
      }
    );

    // console.log('Datawrapper upload status:', updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error('Upload failed:', updateRes.status, updateRes.data);
      throw new Error(`Failed to upload chart data: ${updateRes.status}`);
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    // console.log('Publish response:', publishRes.status);
    if (publishRes.status !== 200) {
      console.error('Error publishing chart:', publishRes.status, publishRes.data);
      throw new Error(`Failed to publish chart: ${publishRes.status}`);
    }

    res.json({ 
      success: true, 
      message: 'District get successfully',
    //  data:{data,csv}
    });

  } catch (error: any) {
    console.error('Error in createDistrictMaps:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  } finally {
    // Optional: Disconnect Prisma if in a long-lived app
    // await prisma.$disconnect();
  }
};


export const getAssemblyMapData = async (req: any, res: any) => {
  try {
    const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN;
    const DATAWRAPPER_CHART_ID = process.env.VIDHANSABHA_MAP_ID;

    if (!DATAWRAPPER_API_TOKEN || !DATAWRAPPER_CHART_ID) {
      throw new Error('Missing required environment variables: DATAWRAPPER_API_TOKEN or DATAWRAPPER_CHART_ID');
    }



    const data = await prisma.assembly_map_data_vandan.findMany({

    });

    // Generate CSV from input data (matches structure)
    const csv = 'Assembly_name,Assembly_value\n' + data.map((d: any) => `${d.assembly_name},${d.assembly_value}`).join('\n');
    // console.log('Generated CSV:\n', csv);


    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          'Content-Type': 'text/csv',
        },
      }
    );

    // console.log('Datawrapper upload status:', updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error('Upload failed:', updateRes.status, updateRes.data);
      throw new Error(`Failed to upload chart data: ${updateRes.status}`);
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    // console.log('Publish response:', publishRes.status);
    if (publishRes.status !== 200) {
      console.error('Error publishing chart:', publishRes.status, publishRes.data);
      throw new Error(`Failed to publish chart: ${publishRes.status}`);
    }

    res.json({ 
      success: true, 
      message: 'District get successfully',
    //  data:{data,csv}
    });

  } catch (error: any) {
    console.error('Error in createDistrictMaps:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  } finally {
    // Optional: Disconnect Prisma if in a long-lived app
    // await prisma.$disconnect();
  }
};


export const getLokSabhaMapData = async (req: any, res: any) => {
  try {
    const DATAWRAPPER_API_TOKEN = process.env.DATAWRAPPER_API_TOKEN;
    const DATAWRAPPER_CHART_ID = process.env.LOKSABHA_MAP_ID;

    if (!DATAWRAPPER_API_TOKEN || !DATAWRAPPER_CHART_ID) {
      throw new Error('Missing required environment variables: DATAWRAPPER_API_TOKEN or DATAWRAPPER_CHART_ID');
    }



    const data = await prisma.loksabha_map_data_vandan.findMany({

    });

    // Generate CSV from input data (matches structure)
    const csv = 'LokSabha_name,LokSabha_value\n' + data.map((d: any) => `${d.lokSabha_name},${d.lokSabha_value}`).join('\n');
    // console.log('Generated CSV:\n', csv);


    // Upload new data
    const updateRes = await axios.put(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/data`,
      csv,
      {
        headers: {
          Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}`,
          'Content-Type': 'text/csv',
        },
      }
    );

    // console.log('Datawrapper upload status:', updateRes.status);
    if (![200, 204].includes(updateRes.status)) {
      console.error('Upload failed:', updateRes.status, updateRes.data);
      throw new Error(`Failed to upload chart data: ${updateRes.status}`);
    }

    // Publish updated chart
    const publishRes = await axios.post(
      `https://api.datawrapper.de/v3/charts/${DATAWRAPPER_CHART_ID}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${DATAWRAPPER_API_TOKEN}` },
      }
    );

    // console.log('Publish response:', publishRes.status);
    if (publishRes.status !== 200) {
      console.error('Error publishing chart:', publishRes.status, publishRes.data);
      throw new Error(`Failed to publish chart: ${publishRes.status}`);
    }

    res.json({ 
      success: true, 
      message: 'District get successfully',
    //  data:{data,csv}
    });

  } catch (error: any) {
    console.error('Error in createDistrictMaps:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  } finally {
    // Optional: Disconnect Prisma if in a long-lived app
    // await prisma.$disconnect();
  }
};




export const getAllBoothsData = async (req: any, res: any) => {
 try {

  const boothdata =  await prisma.cgbooth25_vandan.findMany({});

  if(!boothdata){
    return res.json({
      message:"could not get the both data ",
    })
  }

  return res.json({
    message:"booth data got successfully",
    data:boothdata
  })
}
  catch (error) {
  console.log("could not get the data booth data")
  return res.json({
    message:"could not get the both data ",
   
  })
 }  

}



// export const getAllAssemblyData = async (req: any, res: any) => {
//  try {

//   const assemblyData = await prisma.assembly_vandan.findMany({
//   include: {
//     _count: {
//       select: { booths: true },  // counts number of booths for each assembly
//     },
//   },
// });




//   if(!assemblyData){
//     return res.json({
//       message:"could not get the assembly data ",
//     })
//   }

//   return res.json({
//     message:"assembly data got successfully",
//     data:assemblyData
//   })
// }
//   catch (error) {
//   console.log("could not get the data assembly data")
//   return res.json({
//     message:"could not get the assembly data ",
   
//   })
//  }  

// }


// This will be a cleaner and more efficient query to get all the counts
export const getAllAssemblyData = async (req: any, res: any) => {
  try {
    // 1. Get all Assembly data with the total number of booths
    const assemblyData = await prisma.assembly_vandan.findMany({
      select: {
        id: true,
        assembly_id: true,
        assembly_name: true,
        _count: {
          select: { booths: true },
        },
      },
    });

    // 2. Get the aggregated summary counts for all booths
    const boothSummary = await prisma.cgbooth25_vandan.groupBy({
      by: ['assemblyId', 'isBla2'], // Group by both assembly and the BLA flag
      where: {
        // Only consider records that are not null for the BLA flag, 
        // or records where a bla2_name is present (for the BLA name count)
        OR: [
          { isBla2: { not: null } },
          { bla2_name: { not: null } }
        ]
      },
      _count: {
        id: true, // Total count for this group
        bla2_name: true, // Count where bla2_name is NOT NULL
      },
    });

    // 3. Combine the data for easy consumption on the client
    const combinedData = await Promise.all(assemblyData.map(async (assembly) => {
      // Filter the summary data for the current assembly
      const summaryForAssembly = boothSummary.filter(
        (summary) => summary.assemblyId === assembly.id
      );

      // Initialize counts
      let dummyBooths = 0; // isBla2 = 2
      let unverifiedBooths = 0; // isBla2 = 1
      let verifiedBooths = 0; // isBla2 = 0
      let TotalBLa = 0; // bla2_name is NOT NULL

      summaryForAssembly.forEach(summary => {
        // You'll need to ensure bla_flag_enum values map correctly
        // Assuming your enum is string-based, e.g., '0', '1', '2'
        // If it's number-based, you might need to adjust the comparison.

        if (summary.isBla2 === bla_flag_enum.VALUE_0) { // Assuming 'TWO' or similar for value 2 (Dummy)
          dummyBooths += summary._count.id;
        } else if (summary.isBla2 === bla_flag_enum.VALUE_1) { // Assuming 'ONE' or similar for value 1 (Unverified)
          unverifiedBooths += summary._count.id;
        } else if (summary.isBla2 === bla_flag_enum.VALUE_2) { // Assuming 'ZERO' or similar for value 0 (Verified)
          verifiedBooths += summary._count.id;
        }

        // Count where bla2_name is NOT NULL (Real BLA Name made)
        // Since we grouped by isBla2 and assemblyId, _count.bla2_name will only be 1 
        // if bla2_name is NOT NULL AND it belongs to that specific isBla2 group.
        // It's safer to sum the count where bla2_name is present across all groups.

        // To get an accurate 'TotalBLa' count for the assembly, we must sum 
        // _count.bla2_name for all groups belonging to this assembly.
        // The Prisma `_count.bla2_name` aggregation is perfect for this: 
        // it only counts rows where `bla2_name` is *not* null.

        TotalBLa += summary._count.bla2_name;
      });
      
      // Let's make an assumption that a separate query is better for the BLA Name count
      // to avoid over-complication with `groupBy`.

      const blaNameCountResult = await prisma.cgbooth25_vandan.aggregate({
        _count: {
          id: true
        },
        where: {
          assemblyId: assembly.id,
          bla2_name: { not: null }
        }
      });
      TotalBLa = blaNameCountResult._count.id;
      // Re-map the combined data structure
      return {
        ...assembly,
        boothSummary: {
          totalBooths: assembly._count.booths,
          verifiedBooths: verifiedBooths,
          unverifiedBooths: unverifiedBooths,
          dummyBooths: dummyBooths,
          TotalBLa: TotalBLa,
        }
      };
    }));


    if (!combinedData || combinedData.length === 0) {
      return res.json({
        message: "Could not get the assembly data",
      });
    }

    return res.json({
      message: "Assembly data got successfully",
      data: combinedData
    });
  } catch (error) {
    console.error("Error getting assembly data:", error);
    return res.status(500).json({ // Return 500 status on server error
      message: "Could not get the assembly data due to an internal error",
    });
  }
};


export const getAllboothDataByAssembly = async (req: any, res: any) => {
 
   try {

    const { assemblyId } = req.params;
    // console.log("assemblyId",assemblyId)


      
    const allBooths= await prisma.cgbooth25_vandan.findMany({
      where:{
        assemblyId:parseInt(assemblyId)
      }
    });

    // console.log("allBooths",allBooths)

    if(!allBooths){
      return res.json({
        succes:false,
        message:"could not get the data",
      })
    }

    return res.json({

      succes:true,
      message:"data got successfully",
      data:allBooths
    })



   } catch (error) {
    console.log("could not get the data hello",error)
         return res.json({
          succes:false,
           message: "could not get the data hello",
         });
   }
 }

export const updateSingleBooth = async (req: Request, res: Response) => {
  const { boothId } = req.params;
  const updatePayload: BoothUpdatePayload = req.body;

  if (!boothId || isNaN(Number(boothId))) {
    return res.status(400).json({ error: 'Invalid booth ID provided.' });
  }

  const fieldsToUpdate: any = {};
  let updateNecessary = false;

  if (updatePayload.bla2_name !== undefined) {
    const name = updatePayload.bla2_name.trim();
    fieldsToUpdate.bla2_name = name === '' ? null : name;
    updateNecessary = true;
  }

  if (updatePayload.bla2_mobile_no !== undefined) {
    const cleanedMobile = String(updatePayload.bla2_mobile_no).replace(/[^0-9]/g, '');
    fieldsToUpdate.bla2_mobile_no = cleanedMobile === '' ? null : cleanedMobile;
    updateNecessary = true;
  }

  if (updatePayload.slr_per !== undefined) {
    const numericSlr = Number(updatePayload.slr_per);
    
    if (!isNaN(numericSlr) && numericSlr >= 0 && numericSlr <= 100) {
      fieldsToUpdate.slr_per = numericSlr;
      updateNecessary = true;
    } else if (String(updatePayload.slr_per).trim() === '') {
      fieldsToUpdate.slr_per = null;
      updateNecessary = true;
    } else {
      return res.status(400).json({ error: 'Invalid value for SLR Percentage (must be 0-100 or empty to clear).' });
    }
  }

  if (updatePayload.isBla2 !== undefined) {
    const validStatuses = ['VALUE_0', 'VALUE_1', 'VALUE_2'];
    if (validStatuses.includes(updatePayload.isBla2)) {
      fieldsToUpdate.isBla2 = updatePayload.isBla2;
      updateNecessary = true;
    } else if (updatePayload.isBla2 === '') {
      fieldsToUpdate.isBla2 = null;
      updateNecessary = true;
    } else {
      return res.status(400).json({ error: 'Invalid status value. Must be VALUE_0, VALUE_1, or VALUE_2.' });
    }
  }

  if (!updateNecessary) {
    return res.status(400).json({ error: 'No valid update fields provided. Nothing to update.' });
  }

  try {
    // Get current booth to check if update_count is null
    const currentBooth = await prisma.cgbooth25_vandan.findUnique({
      where: { id: Number(boothId) },
      select: { update_count: true }
    });

    const updatedBooth = await prisma.cgbooth25_vandan.update({
      where: { id: Number(boothId) },
      data: {
        ...fieldsToUpdate,
        update_date: new Date(),
        update_count: currentBooth?.update_count === null ? 1 : {
          increment: 1,
        },
      },
    });

    return res.status(200).json({
      message: 'Booth updated successfully.',
      booth: updatedBooth,
    });
    
  } catch (error: any) {
    console.error(`Error updating booth ${boothId}:`, error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Booth not found. Update failed.' });
    }

    return res.status(500).json({ error: 'Failed to update booth data due to a server error.' });
  }
};

export const bulkUpdateBooths = async (req: Request, res: Response) => {
    // 1. Validate the incoming array structure
    const { updates } = req.body; // Expecting { updates: [{ boothId: 1, ... }, ...] }
    console.log("payload in bulkupdatebooths",req.body)

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Request body must contain a non-empty array of booth objects under the "updates" property.' });
    }

    // 2. Prepare an array of update promises to execute in a single transaction
    const transactionOperations = updates.map((updatePayload: any) => {
        const { boothId, ...fields } = updatePayload;

        if (!boothId || isNaN(Number(boothId))) {
            // Log or handle invalid ID, but typically, we skip it or validate structure upfront
            return null; 
        }

        const fieldsToUpdate: any = {};
        let updateNecessary = false;

        // --- DYNAMIC FIELD PROCESSING (Optimized for Bulk) ---
        
        // a. Process 'bla2_name'
        if (fields.bla2_name !== undefined) {
            const name = String(fields.bla2_name).trim();
            fieldsToUpdate.bla2_name = name === '' ? null : name;
            updateNecessary = true;
        }

        // b. Process 'bla2_mobile_no'
        if (fields.bla2_mobile_no !== undefined) {
            const cleanedMobile = String(fields.bla2_mobile_no).replace(/[^0-9]/g, '');
            fieldsToUpdate.bla2_mobile_no = cleanedMobile === '' ? null : cleanedMobile;
            updateNecessary = true;
        }

        // c. Process 'slr_per'
        if (fields.slr_per !== undefined) {
            const numericSlr = Number(fields.slr_per);
            
            if (!isNaN(numericSlr) && numericSlr >= 0 && numericSlr <= 100) {
                fieldsToUpdate.slr_per = numericSlr;
                updateNecessary = true;
            } else if (String(fields.slr_per).trim() === '') {
                fieldsToUpdate.slr_per = null;
                updateNecessary = true;
            } else {
                // In a bulk operation, it's often better to skip bad records than fail the whole transaction
                console.warn(`Skipping boothId ${boothId}: Invalid SLR percentage.`);
                return null;
            }
        }
        
        // If no valid fields were intended for update, skip the database operation
        if (!updateNecessary) {
            return null;
        }

        // --- PRISMA UPDATE OPERATION ---
        return prisma.cgbooth25_vandan.update({
            where: { id: Number(boothId) },
            data: {
                ...fieldsToUpdate,
                update_date: new Date(),
                update_count: { increment: 1 },
            },
        });
    }).filter(op => op !== null); // Remove any invalid or skipped operations

    // Check if any valid updates remain after filtering
    if (transactionOperations.length === 0) {
        return res.status(200).json({ message: 'No valid changes detected or fields provided.' });
    }

    // 3. Execute all updates in a single transaction for atomicity
    try {
        const updatedBooths = await prisma.$transaction(transactionOperations);

        // 4. Send Success Response
        return res.status(200).json({
            message: `${updatedBooths.length} booths updated successfully.`,
            count: updatedBooths.length,
        });

    } catch (error: any) {
        console.error('Error during bulk booth update transaction:', error);

        // Handle errors that cause the entire transaction to fail (e.g., database connection)
        return res.status(500).json({ error: 'Failed to complete bulk update due to a server error.' });
    }
}
