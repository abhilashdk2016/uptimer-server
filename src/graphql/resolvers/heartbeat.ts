import { IHeartbeat, IHeartBeatArgs } from "@app/interfaces/heartbeat.interface";
import { AppContext } from "@app/interfaces/monitor.interface";
import { getHeartbeats } from "@app/services/monitor.service";
import { authenticateGraphQLRoute } from "@app/utils/utils";

export const HeartBeatResolver = {
    Query: {
        async getHeartbeats(_: undefined, args: IHeartBeatArgs, contextValue: AppContext) {
            const { req } = contextValue;
            authenticateGraphQLRoute(req);
            const { monitorId, type, duration } = args;
            const heartbeats: IHeartbeat[] = await getHeartbeats(type, parseInt(monitorId), parseInt(duration));
            return {
                heartbeats
            }
        }
    },
    HeartBeat: {
        timestamp: (heartBeat: IHeartbeat) => JSON.stringify(heartBeat.timestamp)
    }
}