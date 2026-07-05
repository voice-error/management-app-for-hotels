const prisma = require('../db');

/**
 * Resolves the branch_id for a given request.
 * If branchId is provided, it verifies the branch belongs to the user's business.
 * If not provided, it falls back to the first branch of the business and logs a warning.
 *
 * @param {Object} req - The Express request object.
 * @returns {Promise<string>} The authorized branch_id.
 * @throws {Error} If branch is unauthorized or no branches exist.
 */
async function resolveBranchId(req) {
    // Check for branch_id in body, query, or headers
    let branchId = req.body.branch_id || req.query.branchId || req.headers['x-branch-id'];
    const businessId = req.userContext.businessId;

    if (branchId) {
        // Authorization check: ensure branch belongs to this business
        const branch = await prisma.branch.findFirst({
            where: { id: branchId, business_id: businessId }
        });
        if (!branch) {
            throw new Error('UNAUTHORIZED_BRANCH');
        }
        return branchId;
    } else {
        // Fallback
        console.warn(`[DEPRECATION-WARNING] Fallback branch_id used for business ${businessId}. This will be removed in future versions when branch selection UI is implemented.`);
        const firstBranch = await prisma.branch.findFirst({
            where: { business_id: businessId }
        });
        
        if (!firstBranch) {
            throw new Error('NO_BRANCH_FOUND');
        }
        return firstBranch.id;
    }
}

module.exports = { resolveBranchId };
