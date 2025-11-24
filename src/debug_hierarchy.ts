import prisma from "./prisma";

async function main() {
    try {
        console.log("Starting verification script...");

        // 1. Find a Mandal that exists in multiple Vidhans
        const distinctMandalVid = await prisma.vddata.findMany({
            select: { MAN_ID: true, VID_ID: true },
            distinct: ['MAN_ID', 'VID_ID'],
            where: { MAN_ID: { not: null } }
        });

        const manMap = new Map<number, Set<number>>();
        for (const m of distinctMandalVid) {
            if (!m.MAN_ID || !m.VID_ID) continue;
            if (!manMap.has(m.MAN_ID)) manMap.set(m.MAN_ID, new Set());
            manMap.get(m.MAN_ID)?.add(m.VID_ID);
        }

        let targetManId: number | null = null;
        let targetVidIds: number[] = [];

        for (const [id, vids] of manMap) {
            if (vids.size > 1) {
                targetManId = id;
                targetVidIds = [...vids];
                break;
            }
        }

        if (!targetManId) {
            console.log("No multi-vidhan Mandal found. Cannot verify fix fully.");
            return;
        }

        console.log(`Testing with Mandal ID: ${targetManId}, which appears in Vidhans: ${targetVidIds.join(', ')}`);

        // Test for the first Vidhan
        const vid1 = targetVidIds[0];
        console.log(`\n--- Querying for Vidhan ${vid1} + Mandal ${targetManId} ---`);

        const sakhas1 = await prisma.vddata.findMany({
            where: {
                MAN_ID: targetManId,
                VID_ID: vid1
            },
            distinct: ['MAN_ID', 'SAK_ID'],
            select: {
                SAK_ID: true,
                SAK_NM: true,
                MAN_ID: true,
                VID_ID: true
            },
            orderBy: { SAK_NM: 'asc' }
        });
        console.log(`Found ${sakhas1.length} Sakhas.`);
        if (sakhas1.length > 0) {
            console.log("Sample:", sakhas1[0]);
            // Verify all have correct VID_ID
            const bad = sakhas1.filter(s => s.VID_ID !== vid1);
            if (bad.length > 0) console.error("ERROR: Found Sakhas from wrong Vidhan!");
            else console.log("SUCCESS: All Sakhas belong to correct Vidhan.");
        }

        // Test for the second Vidhan
        const vid2 = targetVidIds[1];
        console.log(`\n--- Querying for Vidhan ${vid2} + Mandal ${targetManId} ---`);

        const sakhas2 = await prisma.vddata.findMany({
            where: {
                MAN_ID: targetManId,
                VID_ID: vid2
            },
            distinct: ['MAN_ID', 'SAK_ID'],
            select: {
                SAK_ID: true,
                SAK_NM: true,
                MAN_ID: true,
                VID_ID: true
            },
            orderBy: { SAK_NM: 'asc' }
        });
        console.log(`Found ${sakhas2.length} Sakhas.`);
        if (sakhas2.length > 0) {
            console.log("Sample:", sakhas2[0]);
            // Verify all have correct VID_ID
            const bad = sakhas2.filter(s => s.VID_ID !== vid2);
            if (bad.length > 0) console.error("ERROR: Found Sakhas from wrong Vidhan!");
            else console.log("SUCCESS: All Sakhas belong to correct Vidhan.");
        }

        // Compare
        const s1Ids = new Set(sakhas1.map(s => s.SAK_ID));
        const s2Ids = new Set(sakhas2.map(s => s.SAK_ID));

        // Intersection?
        const intersection = [...s1Ids].filter(x => s2Ids.has(x));
        console.log(`\nIntersection of Sakha IDs between Vidhan ${vid1} and ${vid2}: ${intersection.length}`);
        if (intersection.length === 0) {
            console.log("Great! The Sakha lists are distinct as expected (assuming Sakha IDs don't collide too).");
        } else {
            console.log("Note: Some Sakha IDs overlap. This might be okay if Sakha IDs are also not unique globally, but at least we filtered by Vidhan.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
