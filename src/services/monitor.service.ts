import { IMonitorDocument } from "@app/interfaces/monitor.interface";
import { MonitorModel } from "@app/models/monitor.model";
import { Model, Op } from "sequelize";
import { getSingleNotificationGroup } from "./notification.service";
import dayjs from 'dayjs';
import { getHttpHeartBeatsByDuration, htttpStatusMonitor } from "./http.service";
import { toLower } from "lodash";
import { IHeartbeat } from "@app/interfaces/heartbeat.interface";
import { uptimePercentage } from "@app/utils/utils";
import { HttpModel } from "@app/models/http.model";
import { getMongoHeartBeatsByDuration, mongoStatusMonitor } from "./mongo.service";
import { MongoModel } from "@app/models/mongo.model";
import { getRedisHeartBeatsByDuration, redisStatusMonitor } from "./redis.service";
import { RedisModel } from "@app/models/redis.model";
import { getTcpHeartBeatsByDuration, tcpStatusMonitor } from "./tcp.service";
import { TcpModel } from "@app/models/tcp.model";

const HTTP_TYPE = 'http';
const TCP_TYPE = 'tcp';
const MONGO_TYPE = 'mongodb';
const REDIS_TYPE = 'redis';

export const createMonitor = async (data: IMonitorDocument): Promise<IMonitorDocument> => {
    try {
        const result: Model = await MonitorModel.create(data);
        return result.dataValues;
    } catch (error) {
        throw new Error(error);
    }
};

export const getAllUserMonitors = async (userId: number): Promise<IMonitorDocument[]> => {
    try {
        const monitors: IMonitorDocument[] = await MonitorModel.findAll({
            raw: true,
            where: {
                userId
            },
            order: [
                ['createdAt', 'DESC']
            ]
        }) as unknown as IMonitorDocument[];
        return monitors;
    } catch (error) {
        throw new Error(error);
    }
}

export const getUserActiveMonitors = async (userId: number): Promise<IMonitorDocument[]> => {
    try {
        const updatedMonitors: IMonitorDocument[] = [];
        const monitors: IMonitorDocument[] = await MonitorModel.findAll({
            raw: true,
            where: {
                [Op.and]: [{ userId }, { active: true }]
            },
            order: [
                ['createdAt', 'DESC']
            ]
        }) as unknown as IMonitorDocument[];
        let heartbeats: IHeartbeat[] = [];
        for(let monitor of monitors) {
            const group = await getSingleNotificationGroup(monitor.notificationId!);
            heartbeats = await getHeartbeats(monitor.type, monitor.id!, 24);
            const uptime: number = uptimePercentage(heartbeats);
            monitor = {
                ...monitor,
                uptime,
                heartbeats: heartbeats.slice(0, 16),
                notifications: group
            }
            updatedMonitors.push(monitor);
        }
        return updatedMonitors;
    } catch (error) {
        throw new Error(error);
    }
}

export const getAllUsersActiveMonitors = async (): Promise<IMonitorDocument[]> => {
    try {
        const monitors: IMonitorDocument[] = await MonitorModel.findAll({
            raw: true,
            where: {active: true },
            order: [
                ['createdAt', 'DESC']
            ]
        }) as unknown as IMonitorDocument[];
        return monitors;
    } catch (error) {
        throw new Error(error);
    }
}

export const getMonitorById = async (monitorId: number): Promise<IMonitorDocument> => {
    try {
        const monitor: IMonitorDocument = await MonitorModel.findOne({
            raw: true,
            where: { id: monitorId }
        }) as unknown as IMonitorDocument;
        let updatedMonitor: IMonitorDocument = { ...monitor };
        const notifications = await getSingleNotificationGroup(updatedMonitor.notificationId!);
        updatedMonitor = {...updatedMonitor, notifications };
        return updatedMonitor;
    } catch (error) {
        throw new Error(error);
    }
}

export const toggleMonitor = async (monitorId: number, userId: number, active: boolean): Promise<IMonitorDocument[]> => {
    try {
        await MonitorModel.update(
            { active },
            {
                where: {
                    [Op.and]: [{ id: monitorId }, { userId }]
                }
            }
        );
        const result: IMonitorDocument[] = await getAllUserMonitors(userId);
        return result; 
    } catch (error) {
        throw new Error(error);
    }
}

export const updateSingleMonitor = async (monitorId: number, userId: number, data: IMonitorDocument): Promise<IMonitorDocument[]> => {
    try {
        await MonitorModel.update(
            data,
            {
                where: { id: monitorId }
            }
        );
        const result: IMonitorDocument[] = await getAllUserMonitors(userId);
        return result; 
    } catch (error) {
        throw new Error(error);
    }
}

export const updateMonitorStatus = async (monitor: IMonitorDocument, timestamp: number, type: String): Promise<IMonitorDocument> => {
    try {
        const now = timestamp ? dayjs(timestamp).toDate() : dayjs().toDate();
        const { id, status } = monitor;
        const updatedMonitor: IMonitorDocument = { ...monitor };
        updatedMonitor.status = type === 'success' ? 0 : 1;
        const isStatus = type === 'success' ? true : false;
        if(isStatus && status === 1) {
            updatedMonitor.lastChanged = now;
        } else if(!isStatus && status === 0) {
            updatedMonitor.lastChanged = now;
        }
        await MonitorModel.update(
            updatedMonitor,
            {
                where: { id }
            }
        );
        return updatedMonitor; 
    } catch (error) {
        throw new Error(error);
    }
}

export const deleteSingleMonitor = async (monitorId: number, userId: number, type: string): Promise<IMonitorDocument[]> => {
    try {
        await deleteMonitorTypeHeartBeats(monitorId, type);
        await MonitorModel.destroy(
            {
                where: { id: monitorId }
            }
        );
        const result: IMonitorDocument[] = await getAllUserMonitors(userId);
        return result; 
    } catch (error) {
        throw new Error(error);
    }
}

const deleteMonitorTypeHeartBeats = async (monitorId: number,  type: string): Promise<void> => {
    let model = null;
    if(type === HTTP_TYPE) {
        model = HttpModel;
    }
    if(type === MONGO_TYPE) {
        model = MongoModel;
    }
    if(type === REDIS_TYPE) {
        model = RedisModel;
    }

    if(type === TCP_TYPE) {
        model = TcpModel;
    }

    if(model) {
        await model.destroy({
            where: {
                monitorId
            }
        });
    }
}

export const startCreatedMonitors = (monitor: IMonitorDocument, name: string, type: string): void => {
    switch(type) {
        case HTTP_TYPE:
            console.log('http', monitor.name, name);
            htttpStatusMonitor(monitor!, toLower(name));
            break;
        case TCP_TYPE:
            console.log('tcp', monitor.name, name);
            tcpStatusMonitor(monitor!, toLower(name));
            break;
        case MONGO_TYPE:
            console.log('mongo', monitor.name, name);
            mongoStatusMonitor(monitor!, toLower(name));
            break;
        case REDIS_TYPE:
            console.log('redis', monitor.name, name);
            redisStatusMonitor(monitor!, toLower(name));
            break;
    }
}

export const getHeartbeats = async (type: string, monitorId: number, duration: number): Promise<IHeartbeat[]> => {
    let heartbeats: IHeartbeat[] = [];
    switch(type) {
        case HTTP_TYPE:
            console.log('http');
            heartbeats = await getHttpHeartBeatsByDuration(monitorId, duration);
            break;
        case TCP_TYPE:
            console.log('tcp');
            heartbeats = await getTcpHeartBeatsByDuration(monitorId, duration);
            break;
        case MONGO_TYPE:
            console.log('mongo');
            heartbeats = await getMongoHeartBeatsByDuration(monitorId, duration);
            break;
        case REDIS_TYPE:
            console.log('redis');
            heartbeats = await getRedisHeartBeatsByDuration(monitorId, duration);
            break;
    }
    return heartbeats;
}