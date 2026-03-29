/**
 * Evaluates the current state of an expense based on the Admin's rules.
 * 
 * @param {Object} ruleConfig - The settings created by the Admin (sequential, percentage, etc.)
 * @param {Array} votes - Array of vote objects: { userId, status: 'APPROVED' | 'REJECTED', isRequired }
 * @param {number} totalApprovers - Total number of people on this specific "board"
 * @returns {Object} - The exact next action the system must take
 */
const evaluateWorkflowState = (ruleConfig, votes, totalApprovers) => {
    // 1. Check for the Veto (KDM Override)
    // If ANY user marked as 'isRequired' voted REJECTED, the whole claim dies instantly.
    const vetoOccurred = votes.some(vote => vote.isRequired && vote.status === 'REJECTED');
    if (vetoOccurred) {
        return { action: 'FINAL_REJECT', reason: 'A required Key Decision Maker rejected the claim.' };
    }

    // 2. Tally the current positive votes
    const approvedVotes = votes.filter(vote => vote.status === 'APPROVED').length;
    const rejectedVotes = votes.filter(vote => vote.status === 'REJECTED').length;

    // 3. Check for Consensus (Percentage Rule)
    const currentPercentage = (approvedVotes / totalApprovers) * 100;
    
    if (currentPercentage >= ruleConfig.minApprovalPercentage) {
        return { action: 'FINAL_APPROVE', reason: 'Minimum approval percentage reached.' };
    }

    // 4. Mathematical Impossibility Check
    // If so many people rejected it that reaching the minimum percentage is now impossible
    const maxPossibleApprovals = totalApprovers - rejectedVotes;
    const maxPossiblePercentage = (maxPossibleApprovals / totalApprovers) * 100;
    
    if (maxPossiblePercentage < ruleConfig.minApprovalPercentage) {
        return { action: 'FINAL_REJECT', reason: 'Mathematically impossible to reach minimum approval percentage.' };
    }

    // 5. Determine Next Steps for Routing
    if (ruleConfig.isSequential) {
        // Find the highest step order that has been approved so far
        const highestApprovedStep = votes.length > 0 ? Math.max(...votes.map(v => v.stepOrder)) : 0;
        return { action: 'ROUTE_TO_NEXT_STEP', nextStep: highestApprovedStep + 1 };
    } else {
        // If it's parallel and we haven't hit the percentage yet, we just keep waiting
        return { action: 'WAITING_FOR_VOTES', reason: 'Waiting for remaining board members to vote in parallel.' };
    }
};

module.exports = {
    evaluateWorkflowState
};