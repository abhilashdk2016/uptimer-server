import { HeartBeatResolver } from "./heartbeat";
import { MonitorResolver } from "./monitor";
import { NotificationResolver } from "./notification";
import { SSLMonitorResolver } from "./ssl";
import { UserResolver } from "./user";

export const resolvers = [
    UserResolver,
    NotificationResolver,
    MonitorResolver,
    HeartBeatResolver,
    SSLMonitorResolver
];