import { mergeTypeDefs } from "@graphql-tools/merge";
import { userSchema } from "./user";
import { notificationSchema } from "./notification";
import { monitorSchema } from "./monitor";
import { heartBeatSchema } from "./heartbeats";
import { sslMonitorSchema } from "./ssl";

export const mergedGraphQLSchema = mergeTypeDefs([
    userSchema,
    notificationSchema,
    monitorSchema,
    heartBeatSchema,
    sslMonitorSchema
]);