//import { IEmailLocals } from "@app/interfaces/notification.interface";

import { IHeartbeat } from "@app/interfaces/heartbeat.interface";
import { IMonitorDocument, IMonitorResponse } from "@app/interfaces/monitor.interface";
import logger from "@app/server/logger";
import { getMonitorById, updateMonitorStatus } from "@app/services/monitor.service";
import { emailSender, locals } from "@app/utils/utils";
import dayjs from "dayjs";
import { mongodbPing } from "./monitors";
import { IEmailLocals } from "@app/interfaces/notification.interface";
import { createMongoHeartBeat } from "@app/services/mongo.service";

class MongoMonitor {
    errorCount: number;
    noSuccessAlert: boolean;
    emailsLocals: IEmailLocals;
    constructor() {
        this.errorCount = 0;
        this.noSuccessAlert = true;
        this.emailsLocals = locals();
    }

    async start(data: IMonitorDocument): Promise<void> {
        const {
            monitorId,
            url
        } = data;
        const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
        try {
            const response: IMonitorResponse = await mongodbPing(url!)
            if(monitorData.connection !== response.status) {
                this.errorAssertionCheck(monitorData, response.responseTime);
            } else {
                this.successAssertionCheck(monitorData, response);
            }

        } catch (error) {
            const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
            this.mongoDBError(monitorData, error);
        }
    }

    async errorAssertionCheck(monitorData: IMonitorDocument, responseTime: number): Promise<void> {
        this.errorCount += 1;
        const timestamp = dayjs.utc().valueOf();
        const heartbeatData: IHeartbeat = {
            monitorId: monitorData.id!,
            status: 1,
            code: 500,
            message: 'Connection status incorrect',
            timestamp,
            responseTime,
            connection: 'refused'
        }
        await Promise.all([updateMonitorStatus(monitorData, timestamp, 'failure'), createMongoHeartBeat(heartbeatData)]);
        if (monitorData.alertThreshold > 0 && this.errorCount > monitorData.alertThreshold) {
            this.errorCount = 0;
            this.noSuccessAlert = false;
            emailSender(
                monitorData.notifications!.emails,
                'errorStatus',
                this.emailsLocals
            );
        }
        logger.info(`MongoDB heartbeat failed assertions: Monitor ID ${monitorData.id}`);
    }

    async successAssertionCheck(monitorData: IMonitorDocument, response: IMonitorResponse): Promise<void> {
        const heartbeatData: IHeartbeat = {
            monitorId: monitorData.id!,
            status: 0,
            code: response.code,
            message: response.message,
            timestamp: dayjs.utc().valueOf(),
            responseTime: response.responseTime,
            connection: response.status
        }
        await Promise.all([
            updateMonitorStatus(monitorData, heartbeatData.timestamp, 'success'),
            createMongoHeartBeat(heartbeatData)
        ]);
        if (!this.noSuccessAlert) {
            this.errorCount = 0;
            this.noSuccessAlert = true;
            emailSender(
                monitorData.notifications!.emails,
                'successStatus',
                this.emailsLocals
            );
        }
        logger.info(`MongoDB heartbeat success: Monitor ID ${monitorData.id}`);
    }

    async mongoDBError(monitorData: IMonitorDocument, error: IMonitorResponse): Promise<void> {
        logger.info(`MongoDB heartbeat failed: Monitor ID ${monitorData.id}`);
        this.errorCount += 1;
        const timestamp = dayjs.utc().valueOf();
        const heartbeatData: IHeartbeat = {
            monitorId: monitorData.id!,
            status: 1,
            code: error.code,
            message: error.message ?? 'MongoDB connection failed',
            timestamp,
            responseTime: error.responseTime,
            connection: error.status
        };
        await Promise.all([updateMonitorStatus(monitorData, timestamp, 'failure'), createMongoHeartBeat(heartbeatData)]);
        if (monitorData.alertThreshold > 0 && this.errorCount > monitorData.alertThreshold) {
        this.errorCount = 0;
        this.noSuccessAlert = false;
        emailSender(
            monitorData.notifications!.emails,
            'errorStatus',
            this.emailsLocals
        );
    }
  }
}

export const mongoMonitor: MongoMonitor = new MongoMonitor();