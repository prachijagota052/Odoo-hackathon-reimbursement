const Joi = require('joi');

/**
 * Validates the payload when an Admin creates a new Approval Rule configuration.
 */
const approvalRuleSchema = Joi.object({
    isManagerApprover: Joi.boolean().required(),
    isSequential: Joi.boolean().required(),
    minApprovalPercentage: Joi.number().min(1).max(100).required(),
    
    // Validate the array of approvers
    approvers: Joi.array().items(
        Joi.object({
            userId: Joi.string().required(),
            stepOrder: Joi.number().integer().min(1).required(),
            isRequired: Joi.boolean().default(false) // The "KDM" / Veto power
        })
    ).min(1).required() // Must have at least one approver
}).custom((obj, helpers) => {
    // Custom Logic: If Sequential is TRUE, stepOrders must be unique and continuous
    if (obj.isSequential) {
        const steps = obj.approvers.map(a => a.stepOrder).sort();
        const isContinuous = steps.every((val, i) => val === i + 1);
        if (!isContinuous) {
            return helpers.message('For sequential rules, step orders must be continuous (1, 2, 3...)');
        }
    }
    return obj;
});

module.exports = {
    approvalRuleSchema
};