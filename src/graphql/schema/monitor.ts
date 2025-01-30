import { buildSchema } from "graphql";

export const monitorSchema = buildSchema(`#graphql
    input Monitor {
        id: Int
        name: String!
        userId: Int!
        active: Boolean
        status: Int!
        frequency: Int!
        url: String!
        method: String
        type: String!
        alertThreshold: Int!
        body: String
        headers: String
        httpAuthMethod: String
        basicAuthUser: String
        basicAuthPass: String
        bearerToken: String
        timeout: Int
        redirects: Int
        responseTime: String
        statusCode: String
        contentType: String
        connection: String
        port: Int
        notificationId: Int!
    }

    type HeartBeatResponse {
        id: ID
        monitorId: Int
        status: Int
        code: Int
        message: String
        timestamp: String
        reqHeaders: String
        resHeaders: String
        reqBody: String
        resBody: String
        responseTime: Int
        connection: String
    }

    type NotificationResponse {
        id: ID!
        userId: Int!
        groupName: String!
        emails: String!
    }

    type MonitorResult {
        id: Int
        name: String!
        userId: Int!
        active: Boolean!
        status: Int!
        frequency: Int!
        url: String!
        method: String
        type: String!
        alertThreshold: Int!
        body: String
        headers: String
        httpAuthMethod: String
        basicAuthUser: String
        basicAuthPass: String
        bearerToken: String
        timeout: Int
        redirects: Int
        responseTime: Int
        statusCode: String
        contentType: String
        connection: String
        lastChanged: String
        uptime: Int
        heartbeats: [HeartBeatResponse!]!
        port: Int
        notifications: NotificationResponse
    }

    input ToggleMonitor {
        monitorId: Int!
        userId: Int!
        name: String!
        active: Boolean!
    }

    type MonitorResponse {
        userId: Int
        monitors: [MonitorResult!]
    }

    type DeleteMonitorResponse {
        id: ID!
    }

    type AutoRefresh {
        refresh: Boolean
    }

    type Query {
        getSingleMonitor(monitorId: String!): MonitorResponse
        getUserMonitors(userId: String!): MonitorResponse
        autoRefresh(userId: String!, refresh: Boolean!): AutoRefresh
    }

    type Mutation {
        createMonitor(monitor: Monitor!): MonitorResponse
        toggleMonitor(monitor: ToggleMonitor!): MonitorResponse
        updateMonitor(monitorId: ID!, userId: ID!, monitor: Monitor!): MonitorResponse
        deleteMonitor(monitorId: ID!, userId: ID!, type: String!): DeleteMonitorResponse
    }

    type Subscription {
        monitorsUpdated: MonitorResponse
    }
`);

/*
    {
  "username": "abhilashdk2013@gmail.com",
  "password": "abhi@2025",
  "userId": "2",
  "monitor": {
    "name": "Local HTTP Monitor",
    "userId": 2,
    "active": true,
    "status": 0,
    "frequency": 30,
    "url": "http://localhost:5001/health",
    "method": "GET",
    "type": "http",
    "alertThreshold": 2,
    "timeout": 5,
    "redirects": 0,
    "responseTime": "3000",
    "statusCode": "[200, 204]",
    "contentType" : "text/html; charset=utf-8",
    "notificationId": 2
  }
}
*/