// Extract the first part of branch name (before any - or _)
// Examples:
// "Space-Dita_output_1" -> "Space"
// "power-dita_output_1" -> "power"
// "module_output_2" -> "module"
// "simple" -> "simple"
export const formatBranchName = (branchName) => {
  if (!branchName) return '';
  
  // Split by - or _ and take the first part
  const parts = branchName.split(/[-_]/);
  return parts[0];
};
