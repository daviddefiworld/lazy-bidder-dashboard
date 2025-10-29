/**
 * Custom hook for managing action logs
 */
import { useState, useCallback } from 'react';

export interface ActionLog {
  id: string;
  timestamp: Date;
  actionType: string;
  parameters: any;
  result: any;
  success: boolean;
}

export const useActionLogs = () => {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [totalActions, setTotalActions] = useState(0);
  const [failedActions, setFailedActions] = useState(0);

  const addActionLog = useCallback((action: string, params: string, result: any, success: boolean) => {
    const log: ActionLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      actionType: action,
      parameters: params,
      result,
      success
    };
    
    setActionLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
    setTotalActions(prev => prev + 1);
    if (!success) {
      setFailedActions(prev => prev + 1);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setActionLogs([]);
    setTotalActions(0);
    setFailedActions(0);
  }, []);

  return {
    actionLogs,
    totalActions,
    failedActions,
    addActionLog,
    clearLogs
  };
};
