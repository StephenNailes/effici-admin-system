import React from "react";
import BudgetRequestEditor from "./BudgetRequestEditor";

/**
 * CreateBudget.tsx - Budget Request Editor
 * 
 * This page now uses the standalone BudgetRequestEditor component,
 * which is a full-featured document editor tailored for budget requests.
 * It includes all the functionality from the Activity Plan editor but
 * adapted with budget-specific templates, labels, and API endpoints.
 */

const CreateBudget: React.FC = () => {
  return <BudgetRequestEditor />;
};

export default CreateBudget;
