/** The rollback of a deployment is its own operation, named after the deployment it undoes. */
export const rollbackOperation = (deployment: string) => `rollback-${deployment.replace(/^deploy-/, '')}`;
