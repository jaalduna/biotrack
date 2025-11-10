import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useUnitsRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket("ws://your-backend/ws/units");
    ws.onmessage = (event) => {
      const updatedUnits = JSON.parse(event.data);
      queryClient.setQueryData(["units"], updatedUnits);
    };
    return () => ws.close();
  }, [queryClient]);
}
